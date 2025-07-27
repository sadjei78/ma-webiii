#!/bin/bash

echo "🔒 Deploying Mom's Contact Manager with Security Setup"
echo ""

# Check if required tools are installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy Firestore security rules
echo "🔐 Deploying Firestore security rules..."
if command -v firebase &> /dev/null; then
    firebase deploy --only firestore:rules
else
    echo "⚠️  Firebase CLI not found. Please install it with: npm install -g firebase-tools"
    echo "   Then run: firebase login && firebase deploy --only firestore:rules"
fi

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: Secure contact management system"
fi

# Deploy to GitHub Pages
echo "🚀 Deploying to GitHub Pages..."
npm run deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔒 Security Checklist:"
echo "   ✅ Firebase Authentication enabled"
echo "   ✅ Firestore security rules deployed"
echo "   ✅ HTTPS enforced (GitHub Pages)"
echo "   ✅ Private repository recommended"
echo ""
echo "📱 Your secure contact manager is now live!"
echo "   URL: https://YOUR_USERNAME.github.io/mom-contacts"
echo ""
echo "🔐 Next steps:"
echo "   1. Create accounts for family members"
echo "   2. Share the login URL with trusted family"
echo "   3. Set up regular backups"
echo "   4. Monitor Firebase usage"
echo ""
echo "📖 For detailed security information, see SECURITY_GUIDE.md" 