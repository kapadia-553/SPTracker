#!/bin/bash

# Development setup script for SP Track

echo "🔧 Setting up SP Track for development..."

# Backend setup
echo "⚙️  Setting up .NET backend..."
cd backend

# Restore packages
dotnet restore

# Install EF Core tools if not already installed
dotnet tool install --global dotnet-ef 2>/dev/null || echo "EF Core tools already installed"

# Create database and run migrations
echo "🗃️  Setting up database..."
dotnet ef database update --project src/SpTrack.Infrastructure

# Start backend services
echo "🚀 Starting backend API..."
dotnet run --project src/SpTrack.Api &
API_PID=$!

echo "🚀 Starting background worker..."
dotnet run --project src/SpTrack.Worker &
WORKER_PID=$!

cd ..

# Frontend setup
echo "🎨 Setting up Angular frontend..."
cd frontend

# Install dependencies
npm install

# Start frontend applications
echo "🚀 Starting Portal (Customer)..."
ng serve portal --port 4200 &
PORTAL_PID=$!

echo "🚀 Starting Agent Dashboard..."
ng serve agent --port 4201 &
AGENT_PID=$!

cd ..

echo ""
echo "✅ Development environment started!"
echo ""
echo "🌐 Development URLs:"
echo "   API: http://localhost:5000"
echo "   API Docs: http://localhost:5000/swagger"
echo "   Agent Dashboard: http://localhost:4201"
echo "   Customer Portal: http://localhost:4200"
echo ""
echo "🛑 To stop all services:"
echo "   kill $API_PID $WORKER_PID $PORTAL_PID $AGENT_PID"
echo ""

# Keep script running
wait