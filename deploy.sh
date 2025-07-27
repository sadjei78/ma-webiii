#!/bin/bash

# Contact Management System Deployment Script
echo "🚀 Deploying Contact Management System..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip3 install -r requirements.txt

# Create data directory if it doesn't exist
mkdir -p data

# Set proper permissions
chmod +x app.py

# Start the application
echo "🌟 Starting Contact Management System..."
echo "📱 Access your application at: http://localhost:8080"
echo "🌐 For external access, use your computer's IP address"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 app.py 