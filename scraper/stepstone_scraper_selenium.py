#!/usr/bin/env python3
"""
Stepstone Job Scraper (Selenium-based)
Best-effort Stepstone scraper using Selenium. Extracts job cards from search pages
and visits each job to collect details.

Class: StepstoneSeleniumScraper(headless=True)
  - setup_driver()
  - scrape_all_pages(max_pages=5, max_jobs=50, keyword=None)
  - cleanup()
Populates self.jobs with dictionaries containing:
  title, company, location, job_url, salary_info, job_type, posted_date
"""
from typing import List, Dict, Optional
import time
import sys
import traceback
import urllib.parse

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.common.exceptions import (
    TimeoutException,
    NoSuchElementException,
    WebDriverException,
)
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

class StepstoneSeleniumScraper:
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.driver: Optional[webdriver.Chrome] = None
        self.jobs: List[Dict] = []

    def setup_driver(self):
        """Initialize Selenium Chrome driver"""
        import os
        opts = Options()
        if self.headless:
            opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu")
        opts.add_argument("--window-size=1200,1000")
        opts.add_argument("--disable-blink-features=AutomationControlled")
        opts.add_argument(
            "user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )

        # Prefer explicit CHROME_DRIVER_PATH env var if provided (useful in constrained environments)
        driver_path = os.environ.get("CHROME_DRIVER_PATH")
        service = None
        if driver_path:
            try:
                service = Service(driver_path)
            except Exception:
                service = None

        if not service:
            try:
                # webdriver-manager will attempt to download a matching driver
                installed = ChromeDriverManager().install()
                service = Service(installed)
            except Exception as e:
                print(f"webdriver-manager install error: {e}", file=sys.stderr)
                service = None

        try:
            if service:
                self.driver = webdriver.Chrome(service=service, options=opts)
            else:
                # fallback to system webdriver (may fail if versions mismatch)
                self.driver = webdriver.Chrome(options=opts)
        except WebDriverException:
            # Try fallback to default webdriver without explicit service
            self.driver = webdriver.Chrome()
        if self.driver:
            self.driver.set_page_load_timeout(30)
        print("Stepstone scraper: driver setup complete", file=sys.stderr)

    def _safe_text(self, parent, by, selector):
        try:
            el = parent.find_element(by, selector)
            return el.text.strip()
        except Exception:
            return ""

    def _handle_cookie_dialog(self):
        """
        Handle Stepstone cookie consent dialog if present.
        Attempts to click a 'reject all' / 'ablehnen' / 'Alle ablehnen' button,
        or a generic dismiss/accept fallback. Non-fatal if not present.
        """
        if not self.driver:
            return
        try:
            # Common button texts on German Stepstone cookie dialogs
            possible_texts = [
                "Alle ablehnen", "Alle Ablehnen", "Ablehnen", "Alles ablehnen",
                "Ablehnen", "Reject all", "Reject", "Reject all cookies", "Manage cookies"
            ]
            # Try to find buttons by XPath matching text
            for txt in possible_texts:
                try:
                    btn = self.driver.find_element(By.XPATH, f"//button[normalize-space()='{txt}']")
                    if btn and btn.is_displayed():
                        try:
                            btn.click()
                            time.sleep(0.5)
                            return
                        except Exception:
                            continue
                except Exception:
                    continue

            # Fallback: look for cookie banner close or decline buttons by common selectors
            selectors = [
                "button[data-testid='cookie-decline']",
                "button[data-testid='opt-out-button']",
                "button.cookie-decline",
                "button#onetrust-reject-all-handler",
                "button[aria-label='Reject']",
                "button[aria-label='Ablehnen']",
                "button[title='Ablehnen']",
                ".cookie-banner .btn-reject",
                ".cmp-consent__reject",
            ]
            for sel in selectors:
                try:
                    el = self.driver.find_element(By.CSS_SELECTOR, sel)
                    if el and el.is_displayed():
                        try:
                            el.click()
                            time.sleep(0.5)
                            return
                        except Exception:
                            continue
                except Exception:
                    continue

            # Another fallback: click common cookie dialog close icons
            try:
                close_elems = self.driver.find_elements(By.CSS_SELECTOR, ".cookie-banner button, .onetrust-close-btn-ui, .cmp-consent__close")
                for c in close_elems:
                    if c and c.is_displayed():
                        try:
                            c.click()
                            time.sleep(0.4)
                            return
                        except Exception:
                            continue
            except Exception:
                pass

        except Exception:
            # non-fatal; just continue if we cannot dismiss
            return

    def _collect_job_links_on_page(self, keyword: Optional[str] = None) -> List[str]:
        """
        Collect job links visible on the current search results page.
        We look for anchors that contain '/stellenangebote' which is common on Stepstone.
        """
        if not self.driver:
            return []
        anchors = []
        try:
            # Broad XPath to catch job anchors
            elems = self.driver.find_elements(
                By.XPATH,
                "//a[contains(@href,'/stellenangebote') or contains(@href,'/jobs/') or contains(@href,'/job/')]"
            )
            for e in elems:
                href = e.get_attribute("href")
                if href and '/stellenangebote' in href:
                    anchors.append(href.split('?')[0])
        except Exception:
            pass
        # Deduplicate while preserving order
        seen = set()
        unique = []
        for u in anchors:
            if u not in seen:
                seen.add(u)
                unique.append(u)
        return unique

    def scrape_all_pages(self, max_pages: int = 5, max_jobs: int = 50, keyword: Optional[str] = None) -> List[Dict]:
        """
        Scrape Stepstone search pages and visit each job listing.
        - max_pages: how many paginated search result pages to visit
        - max_jobs: total job listings to collect across pages
        - keyword: optional search keyword to include in the search URL
        """
        self.jobs = []
        if not self.driver:
            self.setup_driver()
        driver = self.driver
        try:
            base_search_url = "https://www.stepstone.de/stellenangebote"
            # Build search URL with keyword if provided
            if keyword:
                encoded = urllib.parse.quote(keyword)
                search_url_template = f"{base_search_url}?ke={encoded}&page={{page}}"
            else:
                search_url_template = f"{base_search_url}?page={{page}}"

            collected_links: List[str] = []

            for page in range(1, max_pages + 1):
                if len(collected_links) >= max_jobs:
                    break
                url = search_url_template.format(page=page)
                try:
                    driver.get(url)
                    # Handle cookie dialog if it appears (try to reject/close)
                    try:
                        self._handle_cookie_dialog()
                    except Exception:
                        pass
                    # Wait briefly for dynamic results to load
                    try:
                        WebDriverWait(driver, 8).until(
                            EC.presence_of_element_located((By.TAG_NAME, "a"))
                        )
                    except TimeoutException:
                        time.sleep(1)

                    # Scroll a bit to load lazy content
                    driver.execute_script("window.scrollBy(0, 600);")
                    time.sleep(0.8)

                    links = self._collect_job_links_on_page(keyword=keyword)
                    for l in links:
                        if len(collected_links) >= max_jobs:
                            break
                        if l not in collected_links:
                            collected_links.append(l)

                except Exception as e:
                    print(f"Stepstone: failed to load search page {url}: {e}", file=sys.stderr)
                    traceback.print_exc(file=sys.stderr)
                    continue

            # Visit each job link and extract details
            for job_url in collected_links[:max_jobs]:
                try:
                    driver.get(job_url)
                    time.sleep(1.0)
                    # Wait for job title or main container
                    try:
                        WebDriverWait(driver, 8).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, "h1, .job-ad--title, .job-detail"))
                        )
                    except TimeoutException:
                        pass

                    title = (
                        self._safe_text(driver, By.CSS_SELECTOR, "h1.job-detail__title")
                        or self._safe_text(driver, By.CSS_SELECTOR, "h1")
                        or self._safe_text(driver, By.CSS_SELECTOR, ".job-ad--title")
                        or ""
                    )

                    company = (
                        self._safe_text(driver, By.CSS_SELECTOR, ".job-ad-company__name")
                        or self._safe_text(driver, By.CSS_SELECTOR, ".job-company-name")
                        or self._safe_text(driver, By.CSS_SELECTOR, ".company-name")
                        or ""
                    )

                    location = (
                        self._safe_text(driver, By.CSS_SELECTOR, ".job-ad-location")
                        or self._safe_text(driver, By.CSS_SELECTOR, ".job-location")
                        or ""
                    )

                    # posted date (often in a small meta element)
                    posted = (
                        self._safe_text(driver, By.CSS_SELECTOR, ".job-ad-created")
                        or self._safe_text(driver, By.CSS_SELECTOR, ".job-ad-posted")
                        or ""
                    )

                    # salary info
                    salary = (
                        self._safe_text(driver, By.XPATH, "//p[contains(., 'Gehalt') or contains(., 'Gehalt:') or contains(., 'Salary')]")
                        or self._safe_text(driver, By.CSS_SELECTOR, ".salary")
                        or ""
                    )

                    # job type (full-time/part-time) - look in criteria blocks
                    job_type = ""
                    try:
                        elems = driver.find_elements(By.CSS_SELECTOR, ".job-attribute, .job-criteria__item")
                        for e in elems:
                            txt = e.text.strip().lower()
                            if any(k in txt for k in ["vollzeit", "full-time", "teilzeit", "part-time", "befristet", "contract"]):
                                job_type = e.text.strip()
                                break
                    except Exception:
                        job_type = ""

                    job = {
                        "title": title,
                        "company": company or "Unknown",
                        "location": location,
                        "job_url": job_url,
                        "salary_info": salary,
                        "job_type": job_type,
                        "posted_date": posted,
                    }
                    self.jobs.append(job)

                except Exception as e:
                    print(f"Stepstone: failed to scrape job {job_url}: {e}", file=sys.stderr)
                    traceback.print_exc(file=sys.stderr)
                    continue

            print(f"Stepstone scraping completed: {len(self.jobs)} jobs found", file=sys.stderr)
            return self.jobs

        except Exception as e:
            print(f"Stepstone scraping error: {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            return []

    def cleanup(self):
        """Cleanup Selenium driver"""
        try:
            if self.driver:
                self.driver.quit()
                self.driver = None
        except Exception:
            pass
        print("Stepstone scraper: Cleanup completed", file=sys.stderr)