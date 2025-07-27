#!/bin/bash

echo "🚀 Setting up GitHub Pages deployment for Mom's Contact Manager"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Next steps:"
echo ""
echo "1. 🔥 Set up Firebase:"
echo "   - Go to https://console.firebase.google.com/"
echo "   - Create a new project called 'mom-contacts'"
echo "   - Set up Firestore Database"
echo "   - Get your Firebase configuration"
echo ""
echo "2. 📝 Update Firebase configuration:"
echo "   - Edit public/js/firebase-config.js"
echo "   - Replace placeholder values with your Firebase config"
echo ""
echo "3. 📦 Create GitHub repository:"
echo "   - Go to https://github.com"
echo "   - Create a new private repository called 'mom-contacts'"
echo ""
echo "4. 🚀 Deploy to GitHub Pages:"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Initial commit'"
echo "   git remote add origin https://github.com/YOUR_USERNAME/mom-contacts.git"
echo "   git push -u origin main"
echo "   npm run deploy"
echo ""
echo "5. ✅ Enable GitHub Pages:"
echo "   - Go to repository Settings → Pages"
echo "   - Select 'Deploy from a branch'"
echo "   - Choose 'gh-pages' branch"
echo ""
echo "📖 For detailed instructions, see GITHUB_PAGES_SETUP.md"
echo ""
echo "🎉 Your contact manager will be live at: https://YOUR_USERNAME.github.io/mom-contacts" 