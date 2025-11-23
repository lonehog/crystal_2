# Crystal Scraper

This directory contains the Python-based job scrapers that are called from the Node.js backend.

## Structure

- `main.py` - Entry point that accepts `--keyword` argument and outputs JSON
- `utils.py` - Shared utilities for data processing
- `linkedin_scraper.py` - Symlink to `../Linkedin/linkedin_job_scraper.py`
- `stepstone_scraper.py` - Symlink to `../Stepstone/stepstone_scraper_selenium.py`

## Usage

The Node.js backend calls this scraper using `child_process`:

```bash
python3 scraper/main.py --keyword="embedded systems engineer" --source=all
```

### Arguments

- `--keyword` (required) - Job search keyword
- `--source` (optional) - Scraper source: `linkedin`, `stepstone`, or `all` (default: `all`)
- `--max-jobs` (optional) - Maximum jobs to return (default: 100)

### Output

The scraper outputs JSON to stdout:

```json
{
  "success": true,
  "keyword": "embedded systems engineer",
  "timestamp": "2025-11-23T12:00:00",
  "total_jobs": 42,
  "jobs": [
    {
      "title": "Embedded Systems Engineer",
      "company": "Tech Corp",
      "location": "Berlin",
      "url": "https://...",
      "description": "...",
      "salary": "€60,000 - €80,000",
      "job_type": "Full-time",
      "posted_at": "vor 2 Stunden",
      "role_slug": "embedded-systems",
      "source": "stepstone"
    }
  ]
}
```

## Setup

1. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create symlinks to existing scrapers:
```bash
ln -s ../Linkedin/linkedin_job_scraper.py linkedin_scraper.py
ln -s ../Stepstone/stepstone_scraper_selenium.py stepstone_scraper.py
```

## Integration with Node.js

The Node.js backend (`server/services/scraper.service.ts`) spawns this Python script and:
1. Captures stdout (JSON output)
2. Captures stderr (progress messages)
3. Parses the JSON
4. Upserts jobs to PostgreSQL database
