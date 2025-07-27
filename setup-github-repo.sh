#!/bin/bash

echo "🚀 Setting up GitHub Repository for Mom's Contact Manager"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
fi

# Create a clean staging area
echo "🧹 Cleaning up files for repository..."

# Remove any existing git index
rm -f .git/index.lock

# Add only the necessary files for GitHub Pages deployment
echo "📁 Adding files to repository..."

# Core application files
git add public/
git add package.json
git add package-lock.json
git add .github/

# Security and configuration files
git add firestore.rules
git add .gitignore

# Documentation files
git add README.md
git add SECURITY_GUIDE.md
git add SECURITY_SUMMARY.md
git add GITHUB_PAGES_SETUP.md

# Deployment scripts
git add deploy-secure.sh
git add setup-github-pages.sh

# Check what files are staged
echo ""
echo "📋 Files that will be committed:"
git status --porcelain

echo ""
echo "🔍 Review the files above. These are the files that will be included in your repository."
echo ""

# Ask for confirmation
read -p "Do you want to proceed with the commit? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ Committing files..."
    git commit -m "Initial commit: Secure contact management system with Firebase and GitHub Pages"
    
    echo ""
    echo "🎉 Repository is ready!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Create a private GitHub repository called 'mom-contacts'"
    echo "2. Add the remote origin:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/mom-contacts.git"
    echo "3. Push to GitHub:"
    echo "   git push -u origin main"
    echo "4. Deploy to GitHub Pages:"
    echo "   ./deploy-secure.sh"
    echo ""
    echo "🔒 Your repository will include:"
    echo "   ✅ Static web files (public/)"
    echo "   ✅ Firebase configuration"
    echo "   ✅ Security rules and documentation"
    echo "   ✅ Deployment scripts"
    echo "   ❌ Local data files (excluded for security)"
    echo "   ❌ Python Flask files (not needed for static deployment)"
    echo ""
else
    echo "❌ Commit cancelled. You can manually add files and commit."
fi 