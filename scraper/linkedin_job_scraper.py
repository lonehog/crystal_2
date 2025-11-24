#!/usr/bin/env python3
"""
LinkedIn Job Scraper (Selenium-based) with webdriver-manager and automatic ChromeDriver
selection based on locally installed browser version (best-effort).
"""
from typing import List, Dict
import time
import urllib.parse
import sys
import traceback
import shutil
import subprocess
import re

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


def _detect_local_chrome_major() -> str:
    """
    Attempt to detect a locally installed Chrome/Chromium major version.
    Returns the major version as a string (e.g. '142') or empty string if unknown.
    """
    candidates = [
        "chromium",
        "chromium-browser",
        "google-chrome",
        "google-chrome-stable",
        "chrome",
    ]
    for cmd in candidates:
        path = shutil.which(cmd)
        if not path:
            continue
        try:
            result = subprocess.run([path, "--version"], capture_output=True, text=True, timeout=2)
            out = (result.stdout or result.stderr or "").strip()
            # Examples:
            # "Chromium 142.0.7444.134"
            # "Google Chrome 114.0.5735.90"
            m = re.search(r"(\d+)\.(\d+)\.(\d+)\.(\d+)", out)
            if m:
                return m.group(1)
            m2 = re.search(r"(\d+)\.\d+", out)
            if m2:
                return m2.group(1)
        except Exception:
            continue
    return ""


class LinkedInJobScraper:
    def __init__(self, url: str):
        self.url = url
        self.jobs: List[Dict] = []

    def _make_driver(self, headless: bool = True):
        opts = Options()
        if headless:
            opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu")
        opts.add_argument("--window-size=1200,1000")
        opts.add_argument("--disable-blink-features=AutomationControlled")
        opts.add_argument(
            "user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )

        # Prefer explicit CHROME_DRIVER_PATH if provided (useful when webdriver-manager can't match versions)
        import os
        driver_path = os.environ.get("CHROME_DRIVER_PATH")
        if not driver_path:
            # Try to auto-detect local Chrome/Chromium major version and request a matching chromedriver.
            major = _detect_local_chrome_major()
            try:
                # webdriver-manager API varies; call the default installer which will choose an appropriate driver.
                driver_path = ChromeDriverManager().install()
                # If major was detected, try to pick a matching version directory if available in wdm cache
                if major:
                    candidate = f"{os.path.expanduser('~')}/.wdm/drivers/chromedriver/linux64/{major}.0.0.0/chromedriver"
                    # not reliable across systems — keep driver_path as returned by webdriver-manager
            except Exception as e:
                # If webdriver-manager cannot install, log and fall back to None (system driver may be used)
                print(f"webdriver-manager install error: {e}", file=sys.stderr)
                driver_path = None

        try:
            if driver_path:
                service = Service(driver_path)
                driver = webdriver.Chrome(service=service, options=opts)
            else:
                # Fallback to system chromedriver (may fail)
                driver = webdriver.Chrome(options=opts)
            driver.set_page_load_timeout(30)
            return driver
        except Exception as e:
            # Give a helpful error about version mismatch and how to resolve it.
            print("Failed to start Chrome WebDriver. This commonly happens when the installed Chrome/Chromium\n"
                  "version is not compatible with the downloaded ChromeDriver. To fix:\n"
                  " - Ensure Chrome/Chromium is installed and on PATH, or set the CHROME_BINARY env var to its path.\n"
                  " - Install a matching chromedriver manually, or update webdriver-manager to download the correct one.\n"
                  f"Underlying error: {e}", file=sys.stderr)
            raise

    def _safe_find_text(self, parent, by, selector):
        try:
            el = parent.find_element(by, selector)
            return el.text.strip()
        except Exception:
            return ""

    def scrape_jobs(self, max_jobs: int = 50, fetch_full_details: bool = False, headless: bool = True) -> List[Dict]:
        self.jobs = []
        driver = None
        try:
            driver = self._make_driver(headless=headless)
            driver.get(self.url)
            wait = WebDriverWait(driver, 15)

            try:
                wait.until(
                    EC.presence_of_element_located(
                        (By.CSS_SELECTOR, "ul.jobs-search__results-list, div.jobs-search-results__list")
                    )
                )
            except TimeoutException:
                time.sleep(2)

            job_urls = []
            last_height = driver.execute_script("return document.body.scrollHeight")
            scroll_tries = 0
            while len(job_urls) < max_jobs and scroll_tries < 12:
                anchors = driver.find_elements(
                    By.XPATH,
                    "//a[contains(@href,'/jobs/view') or contains(@href,'/jobs/search') or contains(@href,'/jobs/')][.//span[contains(@class,'result-card__title') or contains(@class,'job-card-list__title') or contains(@class,'job-card-container__link')]]"
                )
                if not anchors:
                    anchors = driver.find_elements(By.CSS_SELECTOR, "a.job-card-list__title, a.result-card__full-card-link")
                for a in anchors:
                    href = a.get_attribute("href")
                    if href and href not in job_urls:
                        job_urls.append(href)
                        if len(job_urls) >= max_jobs:
                            break

                driver.execute_script("window.scrollBy(0, window.innerHeight);")
                time.sleep(1)
                new_height = driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    scroll_tries += 1
                else:
                    scroll_tries = 0
                last_height = new_height

            job_urls = job_urls[:max_jobs]

            for idx, job_url in enumerate(job_urls):
                try:
                    driver.get(job_url)
                    time.sleep(1)
                    try:
                        wait.until(
                            EC.presence_of_element_located(
                                (By.CSS_SELECTOR, "h1, .topcard__title, .jobs-unified-top-card__job-title")
                            )
                        )
                    except TimeoutException:
                        pass

                    title = (
                        self._safe_find_text(driver, By.CSS_SELECTOR, "h1.jobs-unified-top-card__job-title")
                        or self._safe_find_text(driver, By.CSS_SELECTOR, "h1")
                        or self._safe_find_text(driver, By.CSS_SELECTOR, ".topcard__title")
                        or self._safe_find_text(driver, By.CSS_SELECTOR, ".jobs-unified-top-card__job-title")
                    )

                    company = (
                        self._safe_find_text(driver, By.CSS_SELECTOR, ".jobs-unified-top-card__company-name")
                        or self._safe_find_text(driver, By.CSS_SELECTOR, ".topcard__org-name-link")
                        or self._safe_find_text(driver, By.CSS_SELECTOR, ".topcard__org-name")
                        or self._safe_find_text(driver, By.CSS_SELECTOR, ".jobs-unified-top-card__company-name a")
                    )

                    location = (
                        self._safe_find_text(driver, By.CSS_SELECTOR, ".jobs-unified-top-card__bullet")
                        or self._safe_find_text(driver, By.CSS_SELECTOR, ".topcard__flavor--bullet")
                        or self._safe_find_text(driver, By.CSS_SELECTOR, ".job-location")
                    )

                    posted = (
                        self._safe_find_text(driver, By.CSS_SELECTOR, "span.posted-time-ago__text")
                        or self._safe_find_text(driver, By.CSS_SELECTOR, ".jobs-unified-top-card__posted-date")
                        or self._safe_find_text(driver, By.CSS_SELECTOR, ".result-card__meta")
                    )

                    description = ""
                    try:
                        desc_el = None
                        for sel in [
                            ".show-more-less-html__markup",
                            ".description__text",
                            ".job-description__content",
                            ".jobs-description__container",
                            ".jobs-description-content__text",
                        ]:
                            try:
                                desc_el = driver.find_element(By.CSS_SELECTOR, sel)
                                if desc_el and desc_el.text.strip():
                                    description = desc_el.text.strip()
                                    break
                            except Exception:
                                continue
                    except Exception:
                        description = ""

                    employment_type = ""
                    try:
                        bullets = driver.find_elements(By.CSS_SELECTOR, ".description__job-criteria-text, .job-criteria__text")
                        for b in bullets:
                            text = b.text.strip().lower()
                            if any(k in text for k in ["full-time", "teilzeit", "full time", "contract", "intern"]):
                                employment_type = b.text.strip()
                                break
                    except Exception:
                        employment_type = ""

                    job = {
                        "title": title,
                        "company": company,
                        "location": location,
                        "job_url": job_url,
                        "description": description,
                        "employment_type": employment_type,
                        "posted_date": posted,
                    }
                    self.jobs.append(job)
                except Exception as e:
                    print(f"LinkedIn: failed to scrape {job_url}: {e}", file=sys.stderr)
                    traceback.print_exc(file=sys.stderr)
                    continue

            return self.jobs

        except Exception as e:
            print(f"LinkedIn scraping error: {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            return []

        finally:
            try:
                if driver:
                    driver.quit()
            except Exception:
                pass