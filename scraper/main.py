#!/usr/bin/env python3
"""
Crystal Scraper - Main Entry Point
Unified interface for all job scrapers
Outputs JSON to stdout for Node.js consumption
"""

import sys
import json
import argparse
from datetime import datetime
import os

# Add parent directory to path to import existing scrapers
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(parent_dir, 'Linkedin'))
sys.path.insert(0, os.path.join(parent_dir, 'Stepstone'))


def scrape_linkedin(keyword):
    """Scrape LinkedIn for jobs matching keyword"""
    try:
        from linkedin_job_scraper import LinkedInJobScraper
        
        # Build URL with keyword
        url = f"https://www.linkedin.com/jobs/search/?f_TPR=r3600&keywords={keyword.replace(' ', '%20')}"
        
        scraper = LinkedInJobScraper(url)
        scraper.scrape_jobs(fetch_full_details=False)
        
        # Convert to standardized format
        jobs = []
        for job in scraper.jobs:
            jobs.append({
                'title': job.get('title', ''),
                'company': job.get('company', ''),
                'location': job.get('location', ''),
                'url': job.get('job_url', ''),
                'description': job.get('description', ''),
                'salary': '',
                'job_type': job.get('employment_type', ''),
                'posted_at': job.get('posted_date', ''),
                'role_slug': classify_role(job.get('title', '')),
                'source': 'linkedin'
            })
        
        return jobs
        
    except Exception as e:
        print(json.dumps({'error': f'LinkedIn scraper error: {str(e)}'}), file=sys.stderr)
        return []


def scrape_stepstone(keyword):
    """Scrape Stepstone for jobs matching keyword"""
    try:
        from stepstone_scraper_selenium import StepstoneSeleniumScraper
        
        scraper = StepstoneSeleniumScraper(headless=True)
        scraper.setup_driver()
        
        # Scrape with keyword (using existing scraper)
        scraper.scrape_all_pages(max_pages=5)
        
        # Convert to standardized format
        jobs = []
        for job in scraper.jobs:
            jobs.append({
                'title': job.get('title', ''),
                'company': job.get('company', 'Unknown'),  # Company extraction issue noted
                'location': job.get('location', ''),
                'url': job.get('job_url', ''),
                'description': '',
                'salary': job.get('salary_info', ''),
                'job_type': job.get('job_type', ''),
                'posted_at': job.get('posted_date', ''),
                'role_slug': classify_role(job.get('title', '')),
                'source': 'stepstone'
            })
        
        scraper.cleanup()
        return jobs
        
    except Exception as e:
        print(json.dumps({'error': f'Stepstone scraper error: {str(e)}'}), file=sys.stderr)
        return []


def classify_role(title):
    """
    Classify job role based on title
    Returns: embedded-systems, firmware, hardware, software, etc.
    """
    title_lower = title.lower()
    
    if 'embedded' in title_lower and 'system' in title_lower:
        return 'embedded-systems'
    elif 'firmware' in title_lower or 'fpga' in title_lower:
        return 'firmware'
    elif 'hardware' in title_lower or 'hw ' in title_lower or 'pcb' in title_lower:
        return 'hardware'
    elif 'software' in title_lower or 'sw ' in title_lower:
        return 'software'
    elif 'embedded' in title_lower:
        return 'embedded-general'
    elif 'engineer' in title_lower:
        return 'engineering'
    else:
        return 'other'


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Crystal Job Scraper')
    parser.add_argument('--keyword', required=True, help='Job search keyword')
    parser.add_argument('--source', choices=['linkedin', 'stepstone', 'all'], default='all',
                       help='Scraper source')
    parser.add_argument('--max-jobs', type=int, default=100,
                       help='Maximum number of jobs to return')
    
    args = parser.parse_args()
    
    all_jobs = []
    
    try:
        # Run scrapers based on source
        if args.source in ['linkedin', 'all']:
            print(json.dumps({'status': 'scraping', 'source': 'linkedin'}), file=sys.stderr)
            linkedin_jobs = scrape_linkedin(args.keyword)
            all_jobs.extend(linkedin_jobs)
            print(json.dumps({'status': 'completed', 'source': 'linkedin', 'count': len(linkedin_jobs)}), file=sys.stderr)
        
        if args.source in ['stepstone', 'all']:
            print(json.dumps({'status': 'scraping', 'source': 'stepstone'}), file=sys.stderr)
            stepstone_jobs = scrape_stepstone(args.keyword)
            all_jobs.extend(stepstone_jobs)
            print(json.dumps({'status': 'completed', 'source': 'stepstone', 'count': len(stepstone_jobs)}), file=sys.stderr)
        
        # Limit results
        if len(all_jobs) > args.max_jobs:
            all_jobs = all_jobs[:args.max_jobs]
        
        # Output JSON to stdout for Node.js to consume
        output = {
            'success': True,
            'keyword': args.keyword,
            'timestamp': datetime.now().isoformat(),
            'total_jobs': len(all_jobs),
            'jobs': all_jobs
        }
        
        # Print JSON to stdout (Node.js will capture this)
        print(json.dumps(output, indent=2))
        
    except Exception as e:
        # Print error to stderr
        error_output = {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
