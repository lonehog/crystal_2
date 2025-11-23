#!/bin/bash

# Crystal Quick Setup Script
# This script automates the initial setup of the Crystal app

set -e  # Exit on error

CRYSTAL_DIR="/home/surya/Projects/job_hunter/crystal"
cd "$CRYSTAL_DIR"

echo "💎 Crystal Quick Setup"
echo "====================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. You'll need to install PostgreSQL first."
    echo "   Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "   Mac: brew install postgresql"
    exit 1
fi

echo "✅ PostgreSQL detected"
echo ""

# Step 1: Install Node.js dependencies
echo "📦 Step 1: Installing Node.js dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Step 2: Check database connection
echo "🗄️  Step 2: Checking PostgreSQL connection..."
if psql -lqt | cut -d \| -f 1 | grep -qw crystal_jobs; then
    echo "✅ Database 'crystal_jobs' already exists"
else
    echo "📊 Creating database 'crystal_jobs'..."
    createdb crystal_jobs 2>/dev/null || {
        echo "⚠️  Could not create database automatically."
        echo "   Please create it manually: createdb crystal_jobs"
        echo "   Or: psql -U postgres -c 'CREATE DATABASE crystal_jobs;'"
        exit 1
    }
    echo "✅ Database created"
fi
echo ""

# Step 3: Check .env file
echo "⚙️  Step 3: Checking environment configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    # Check if DATABASE_URL needs updating
    if grep -q "user:password" .env; then
        echo "⚠️  WARNING: .env still has placeholder credentials"
        echo "   Please update DATABASE_URL in .env with your PostgreSQL credentials"
        echo ""
        echo "   Example:"
        echo "   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/crystal_jobs"
        echo ""
    fi
else
    echo "❌ .env file not found"
    exit 1
fi
echo ""

# Step 4: Run database migrations
echo "🔄 Step 4: Running database migrations..."
npm run db:migrate
echo "✅ Migrations complete"
echo ""

# Step 5: Python environment setup
echo "🐍 Step 5: Setting up Python environment..."
cd scraper

if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

echo "   Installing Python dependencies..."
source venv/bin/activate
pip install -q -r requirements.txt
echo "✅ Python dependencies installed"
deactivate

cd "$CRYSTAL_DIR"
echo ""

# Final message
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "To start the development server:"
echo "  cd $CRYSTAL_DIR"
echo "  npm run dev"
echo ""
echo "The app will be available at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo ""
echo "⚠️  IMPORTANT: Update .env with your PostgreSQL credentials before starting!"
echo ""
echo "For detailed instructions, see: SETUP_COMPLETE.md"
