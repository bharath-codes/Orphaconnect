#!/bin/bash

# OrphanConnect+ Deployment Script

echo "🚀 Starting OrphanConnect+ deployment..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your actual configuration"
fi

# Build and start services
echo "🐳 Building and starting Docker containers..."
docker-compose down
docker-compose build
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Initialize database
echo "💾 Initializing database..."
docker-compose exec backend python -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('Database tables created successfully')
"

echo "✅ Deployment completed!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:8080"
echo "   Backend API: http://localhost:5000"
echo "   Admin Login: admin@orphanconnect.com / admin123"
echo ""
echo "📊 Monitoring:"
echo "   Database: postgresql://postgres:password@localhost:5432/orphanconnect"
echo "   Redis: redis://localhost:6379"
echo ""
echo "🛠️ To view logs:"
echo "   docker-compose logs -f [service_name]"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"