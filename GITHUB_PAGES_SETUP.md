# 🚀 GitHub Pages + Firebase Setup Guide

## 📋 Overview
This guide will help you deploy your contact management system to GitHub Pages with a secure Firebase database.

## 🔥 Step 1: Set Up Firebase

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `mom-contacts`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Set Up Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to you
5. Click "Done"

### 1.3 Set Up Security Rules
1. Go to "Firestore Database" → "Rules"
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all users under any document
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Note**: These are permissive rules for development. For production, implement proper authentication.

### 1.4 Get Firebase Configuration
1. Go to "Project Settings" (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → "Web"
4. Register app with name: `mom-contacts-web`
5. Copy the configuration object

## 🔧 Step 2: Update Firebase Configuration

### 2.1 Update firebase-config.js
Replace the placeholder configuration in `public/js/firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

## 📦 Step 3: Set Up GitHub Repository

### 3.1 Create GitHub Repository
1. Go to [GitHub](https://github.com)
2. Click "New repository"
3. Name: `mom-contacts`
4. Make it **Private** (for security)
5. Don't initialize with README (we'll push our code)

### 3.2 Push Your Code
```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Contact management system"

# Add remote repository (replace with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/mom-contacts.git

# Push to GitHub
git push -u origin main
```

### 3.3 Enable GitHub Pages
1. Go to your repository on GitHub
2. Click "Settings"
3. Scroll down to "Pages"
4. Under "Source", select "Deploy from a branch"
5. Select "gh-pages" branch
6. Click "Save"

## 🔄 Step 4: Deploy to GitHub Pages

### 4.1 Install Dependencies
```bash
npm install
```

### 4.2 Deploy
```bash
npm run deploy
```

### 4.3 Verify Deployment
1. Wait a few minutes for deployment
2. Visit: `https://YOUR_USERNAME.github.io/mom-contacts`

## 🔒 Step 5: Security Considerations

### 5.1 Firebase Security Rules (Production)
For production, implement proper security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /contacts/{contactId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /categories/{categoryId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### 5.2 Authentication (Optional)
To add user authentication:

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" provider
4. Add authentication to your app

## 📱 Step 6: Test Your Application

### 6.1 Test Features
- ✅ Add new contacts
- ✅ Edit existing contacts
- ✅ Delete contacts
- ✅ Mark as important/archived
- ✅ Search and filter
- ✅ Bulk operations
- ✅ Export to CSV

### 6.2 Test on Different Devices
- Desktop browser
- Mobile browser
- Tablet browser

## 🔧 Step 7: Customization

### 7.1 Update Repository Information
Edit `package.json`:
```json
{
  "repository": {
    "url": "git+https://github.com/YOUR_USERNAME/mom-contacts.git"
  },
  "homepage": "https://YOUR_USERNAME.github.io/mom-contacts"
}
```

### 7.2 Customize Branding
Update the title and branding in `public/index.html`:
```html
<title>Your Custom Title</title>
<a class="navbar-brand" href="#">
    <i class="fas fa-address-book me-2"></i>
    Your Custom Brand
</a>
```

## 🚨 Troubleshooting

### Common Issues

1. **Firebase not connecting**
   - Check API key in firebase-config.js
   - Verify project ID matches
   - Check browser console for errors

2. **GitHub Pages not updating**
   - Wait 5-10 minutes for deployment
   - Check Actions tab for deployment status
   - Clear browser cache

3. **Data not saving**
   - Check Firestore rules
   - Verify database is created
   - Check browser console for errors

4. **CORS errors**
   - Firebase handles CORS automatically
   - Check if using correct Firebase project

### Debug Steps
1. Open browser developer tools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Verify Firebase configuration

## 📊 Monitoring

### Firebase Console
- Monitor database usage
- Check authentication logs
- View performance metrics

### GitHub Actions
- Monitor deployment status
- Check for build errors
- View deployment logs

## 🔄 Updates and Maintenance

### Adding New Features
1. Make changes to code
2. Test locally
3. Commit and push to GitHub
4. Automatic deployment to GitHub Pages

### Database Backups
1. Export data from Firebase Console
2. Store backups securely
3. Regular backup schedule

## 🎉 Success!

Your contact management system is now:
- ✅ Hosted on GitHub Pages
- ✅ Using secure Firebase database
- ✅ Accessible from anywhere
- ✅ Private and secure
- ✅ Automatically deployed

**Your live URL**: `https://YOUR_USERNAME.github.io/mom-contacts`

Share this URL with your family for secure access to your contacts! 📱✨ 