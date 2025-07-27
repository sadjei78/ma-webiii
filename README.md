# 📱 Mom's Contact Manager

A private, secure contact management system built for family use, deployed on GitHub Pages with Firebase backend.

## 🌟 Features

- **📋 Contact Management**: Add, edit, delete, and organize contacts
- **🏷️ Categorization**: Organize contacts by categories (Family, Work, Friends, etc.)
- **⭐ Status Management**: Mark contacts as important or archived
- **🔍 Search & Filter**: Find contacts quickly with search and filters
- **📧 Bulk Operations**: Email multiple contacts, bulk category updates
- **📤 Export**: Export contacts to CSV format
- **📱 Mobile Friendly**: Works perfectly on all devices
- **🔒 Secure**: Private GitHub repository with secure Firebase database

## 🚀 Quick Start

### Prerequisites
- GitHub account
- Firebase account (free)
- Node.js installed

### Setup Steps

1. **Clone this repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/mom-contacts.git
   cd mom-contacts
   ```

2. **Run the setup script**
   ```bash
   ./setup-github-pages.sh
   ```

3. **Follow the detailed setup guide**
   - See `GITHUB_PAGES_SETUP.md` for complete instructions

## 🔧 Architecture

- **Frontend**: Static HTML/CSS/JavaScript
- **Backend**: Firebase Firestore (NoSQL database)
- **Hosting**: GitHub Pages
- **Security**: Private repository + Firebase security rules

## 📁 Project Structure

```
mom-contacts/
├── public/                 # Static files for GitHub Pages
│   ├── index.html         # Main application
│   └── js/
│       ├── app.js         # Main application logic
│       └── firebase-config.js  # Firebase configuration
├── .github/workflows/     # GitHub Actions for deployment
├── package.json           # Node.js dependencies
├── GITHUB_PAGES_SETUP.md # Detailed setup guide
└── README.md             # This file
```

## 🔒 Security

- **Private Repository**: Only you and family members can access
- **Firebase Security**: Configurable security rules
- **HTTPS**: Automatic SSL encryption
- **No Server**: Static hosting means no server vulnerabilities

## 📱 Usage

### Adding Contacts
1. Click "Add Contact" button
2. Fill in contact information
3. Choose category and status
4. Click "Save Contact"

### Managing Contacts
- **Edit**: Click the dropdown menu → Edit
- **Delete**: Click the dropdown menu → Delete
- **Mark Important**: Click the star icon
- **Archive**: Click the archive option

### Bulk Operations
1. Select multiple contacts using checkboxes
2. Choose bulk action (Email, Update Categories, Update Status)
3. Apply changes to all selected contacts

### Exporting Data
- Click "Export" button to download contacts as CSV
- Data is automatically backed up in Firebase

## 🛠️ Development

### Local Development
```bash
# Install dependencies
npm install

# Start local server (for testing)
python3 app.py
```

### Deployment
```bash
# Deploy to GitHub Pages
npm run deploy
```

## 🔧 Configuration

### Firebase Setup
1. Create Firebase project
2. Enable Firestore Database
3. Update `public/js/firebase-config.js`
4. Set security rules

### Customization
- Edit `public/index.html` for branding
- Modify `public/js/app.js` for features
- Update categories in the application

## 📊 Monitoring

### Firebase Console
- Monitor database usage
- View authentication logs
- Check performance metrics

### GitHub Actions
- Automatic deployment on push
- Build status monitoring
- Deployment logs

## 🚨 Troubleshooting

### Common Issues

1. **Firebase Connection Error**
   - Check API key in firebase-config.js
   - Verify project ID
   - Check browser console for errors

2. **GitHub Pages Not Updating**
   - Wait 5-10 minutes for deployment
   - Check Actions tab for status
   - Clear browser cache

3. **Data Not Saving**
   - Check Firestore rules
   - Verify database is created
   - Check browser console

### Debug Steps
1. Open browser developer tools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Verify Firebase configuration

## 🔄 Updates

### Adding Features
1. Make changes to code
2. Test locally
3. Commit and push to GitHub
4. Automatic deployment to GitHub Pages

### Database Backups
1. Export data from Firebase Console
2. Store backups securely
3. Regular backup schedule

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Firebase Console logs
3. Check GitHub Actions status
4. Verify all configuration steps

## 📄 License

This project is private and for family use only.

## 🎉 Success!

Your contact management system will be live at:
`https://YOUR_USERNAME.github.io/mom-contacts`

Share this secure URL with your family! 📱✨

---

**Built with ❤️ for family contact management** 