#!/bin/bash

echo "🌟 Starting Mom's Contact Management System..."
echo "📱 Access at: http://localhost:8080"
echo "🌐 External access: http://$(curl -s ifconfig.me):8080"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python3 app.py 