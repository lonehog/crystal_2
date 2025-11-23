"""
Scraper Utilities
Shared functions for data processing and validation
"""

from typing import Dict, List, Optional
from datetime import datetime
import re


def clean_text(text: Optional[str]) -> str:
    """
    Clean and normalize text
    Remove extra whitespace, newlines, etc.
    """
    if not text:
        return ""
    
    # Remove extra whitespace and newlines
    text = ' '.join(text.split())
    return text.strip()


def extract_salary(text: str) -> Optional[str]:
    """
    Extract salary information from text
    Returns formatted salary string or None
    """
    if not text:
        return None
    
    # Common salary patterns
    patterns = [
        r'(\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?(?:\s*-\s*\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?)?)',  # $50,000 - $70,000
        r'(€\d{1,3}(?:,\d{3})*(?:\.\d{2})?(?:\s*-\s*€\d{1,3}(?:,\d{3})*(?:\.\d{2})?)?)',  # €50,000 - €70,000
        r'(\d{1,3}(?:,\d{3})*\s*(?:USD|EUR|GBP))',  # 50,000 USD
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return None


def validate_job(job: Dict) -> bool:
    """
    Validate that a job dict has required fields
    """
    required_fields = ['title', 'company', 'url', 'source']
    
    for field in required_fields:
        if not job.get(field):
            return False
    
    return True


def deduplicate_jobs(jobs: List[Dict]) -> List[Dict]:
    """
    Remove duplicate jobs based on URL
    """
    seen_urls = set()
    unique_jobs = []
    
    for job in jobs:
        url = job.get('url', '')
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique_jobs.append(job)
    
    return unique_jobs


def format_job_for_db(job: Dict) -> Dict:
    """
    Format job data for database insertion
    Ensure all fields are properly formatted
    """
    return {
        'title': clean_text(job.get('title', ''))[:500],
        'company': clean_text(job.get('company', ''))[:500],
        'location': clean_text(job.get('location', ''))[:500],
        'url': job.get('url', '')[:1000],
        'description': job.get('description', ''),
        'salary': job.get('salary', '')[:200],
        'job_type': job.get('job_type', '')[:200],
        'posted_at': job.get('posted_at', '')[:200],
        'role_slug': job.get('role_slug', 'other'),
        'source': job.get('source', 'unknown'),
    }


def parse_relative_date(date_str: str) -> Optional[datetime]:
    """
    Parse relative dates like 'vor 2 Stunden', '2 hours ago'
    Returns datetime or None
    """
    if not date_str:
        return None
    
    date_str = date_str.lower()
    
    # German patterns
    german_patterns = {
        r'vor (\d+) stunde': 'hours',
        r'vor (\d+) tag': 'days',
        r'vor (\d+) woche': 'weeks',
        r'vor (\d+) monat': 'months',
        r'gestern': 'yesterday',
        r'heute': 'today',
    }
    
    # English patterns
    english_patterns = {
        r'(\d+) hour.*ago': 'hours',
        r'(\d+) day.*ago': 'days',
        r'(\d+) week.*ago': 'weeks',
        r'(\d+) month.*ago': 'months',
        r'yesterday': 'yesterday',
        r'today': 'today',
    }
    
    all_patterns = {**german_patterns, **english_patterns}
    
    for pattern, unit in all_patterns.items():
        match = re.search(pattern, date_str)
        if match:
            if unit in ['yesterday', 'today']:
                # Handle special cases
                if unit == 'today':
                    return datetime.now()
                elif unit == 'yesterday':
                    from datetime import timedelta
                    return datetime.now() - timedelta(days=1)
            else:
                # Extract number and calculate
                num = int(match.group(1))
                from datetime import timedelta
                
                if unit == 'hours':
                    return datetime.now() - timedelta(hours=num)
                elif unit == 'days':
                    return datetime.now() - timedelta(days=num)
                elif unit == 'weeks':
                    return datetime.now() - timedelta(weeks=num)
                elif unit == 'months':
                    return datetime.now() - timedelta(days=num * 30)
    
    return None


def get_role_priority(role_slug: str) -> int:
    """
    Get priority for role type (lower = higher priority)
    Used for sorting jobs
    """
    priorities = {
        'embedded-systems': 1,
        'firmware': 2,
        'hardware': 3,
        'embedded-general': 4,
        'software': 5,
        'engineering': 6,
        'other': 7,
    }
    
    return priorities.get(role_slug, 99)
