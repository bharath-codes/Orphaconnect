#!/bin/bash

# OrphanConnect+ Local Development Setup

echo "🚀 Setting up OrphanConnect+ for local development..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is required but not installed."
    echo "Please install PostgreSQL and ensure it's running on port 5432"
    exit 1
fi

# Check if Redis is running
if ! command -v redis-cli &> /dev/null; then
    echo "❌ Redis is required but not installed."
    echo "Please install Redis and ensure it's running on port 6379"
    exit 1
fi

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install backend dependencies
echo "📦 Installing Python dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Create .env file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📄 Creating .env file..."
    cp .env.example backend/.env
    echo "⚠️  Please update backend/.env with your database credentials"
fi

# Create database
echo "💾 Setting up database..."
createdb orphanconnect 2>/dev/null || echo "Database might already exist"

# Initialize database
echo "🔧 Initializing database schema..."
cd backend
python3 -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('✅ Database initialized successfully')
"

# Load sample data
echo "📊 Loading sample data..."
psql -d orphanconnect -f ../database/sample_data.sql

echo "✅ Setup completed!"
echo ""
echo "🚀 To start the application:"
echo "   1. Start the backend:"
echo "      cd backend && python app.py"
echo ""
echo "   2. Start the frontend:"
echo "      cd frontend && python -m http.server 3000"
echo ""
echo "   3. Start Celery worker (optional):"
echo "      cd backend && celery -A tasks.celery_tasks worker --loglevel=info"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   Admin Login: admin@orphanconnect.com / admin123"