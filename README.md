# Crystal 💎

A modern job dashboard with Glassmorphism UI, built with React, Node.js, and Python scrapers.

## Features

✨ **Glassmorphism Design** - Beautiful Vision UI with deep navy backgrounds and glass cards  
🔍 **Multi-Source Scraping** - LinkedIn and Stepstone job scrapers  
⚡ **Real-time Updates** - Live job tracking with hourly scrapes  
🎯 **Keyword Management** - Track multiple job search keywords  
📊 **Analytics Dashboard** - View job statistics and trends  
🚀 **TypeScript** - End-to-end type safety  
🗄️ **PostgreSQL** - Robust data storage with Drizzle ORM  

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing fast builds
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Drizzle ORM** for database access
- **PostgreSQL** for data storage

### Scrapers
- **Python 3** for web scraping
- **Selenium** for dynamic content
- **BeautifulSoup** for HTML parsing
- **Requests** for HTTP requests

## Project Structure

```
crystal/
├── src/                    # React frontend
│   ├── components/        # UI components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   └── services/         # API client
├── server/                # Node.js backend
│   ├── routes/           # Express routes
│   ├── services/         # Business logic
│   ├── db/               # Database schema
│   └── config/           # Configuration
├── scraper/              # Python scrapers
│   ├── main.py          # Entry point
│   ├── linkedin_scraper.py
│   └── stepstone_scraper.py
└── scripts/              # Utility scripts
```

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **PostgreSQL** 14+
- **Chrome/Chromium** (for Selenium)

## Installation

### 1. Clone and Setup

```bash
cd crystal
npm install
```

### 2. Python Environment

```bash
cd scraper
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb crystal_jobs

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Run migrations
npm run db:migrate
```

### 4. Environment Variables

Update `.env` with your settings:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/crystal_jobs
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Development

### Start All Services

```bash
npm run dev
```

This runs:
- **Frontend** at `http://localhost:5173`
- **Backend** at `http://localhost:3001`

### Individual Services

```bash
# Frontend only
npm run dev:client

# Backend only
npm run dev:server

# Test Python scraper
npm run scraper:test
```

## Usage

### Dashboard
Visit `http://localhost:5173` to see:
- Total jobs tracked
- New jobs in last hour
- Jobs by source (LinkedIn, Stepstone)
- Recent scraper runs

### Triggering Scrapers

Click **"Search for jobs now"** button to manually trigger scrapers.

**Note:** Scrapers enforce a 1-hour cooldown to avoid rate limiting.

### Managing Keywords

Go to **Settings** page to:
- Add new job search keywords
- Remove existing keywords
- Configure scraper behavior

## API Endpoints

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:source` - Get jobs by source
- `GET /api/jobs/stats` - Get job statistics

### Scrapers
- `POST /api/scraper/trigger/:source` - Trigger scraper
- `GET /api/scraper/status` - Get scraper status

### Settings
- `GET /api/settings/keywords` - Get keywords
- `PUT /api/settings/keywords` - Update keywords

## Database Schema

### Jobs Table
- `id` - Primary key
- `title` - Job title
- `company` - Company name
- `location` - Job location
- `url` - Job posting URL
- `posted_at` - When job was posted
- `role_slug` - Job category
- `source` - Data source (linkedin/stepstone)
- `created_at` - When we first saw the job
- `updated_at` - Last time we saw the job

### Scraper Runs Table
- `id` - Primary key
- `source` - Scraper source
- `status` - Run status (running/completed/failed)
- `jobs_found` - Number of jobs found
- `new_jobs` - Number of new jobs
- `started_at` - Run start time
- `completed_at` - Run completion time
- `error` - Error message (if failed)

## Design System (Vision UI)

### Colors
- **Background:** `#0B1120` (Deep Navy)
- **Accent:** `#0075FF` (Electric Blue)
- **Text:** White headings, Gray-400 body

### Glass Cards
```css
bg-gray-900/60 
backdrop-blur-xl 
border border-white/10 
rounded-2xl 
shadow-2xl
```

### Typography
- **Font:** Inter
- **Headings:** White, bold
- **Body:** Gray-400

## Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables

Set these in production:
- `NODE_ENV=production`
- `DATABASE_URL=your_production_db_url`
- `PORT=3001`

## Troubleshooting

### Scrapers Not Running
1. Check Python environment: `python3 --version`
2. Verify Chrome/Chromium installed: `which chromium`
3. Check scraper logs in database

### Database Connection Errors
1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL in `.env`
3. Ensure database exists: `psql -l`

### Port Already in Use
Change PORT in `.env` or kill existing process:
```bash
# Find process
lsof -i :3001

# Kill process
kill -9 <PID>
```

## Contributing

This is a personal project, but suggestions are welcome!

## License

MIT License - See LICENSE file for details

## Credits

Built with ❤️ using:
- React + Vite
- Express + Drizzle ORM
- Tailwind CSS
- Python Selenium + BeautifulSoup
