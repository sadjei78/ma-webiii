// Security Configuration
// Configure authorized email addresses here

const SECURITY_CONFIG = {
    // Security mode: 'domain', 'email', or 'disabled'
    // 'domain' = check email domains (requires server-side validation)
    // 'email' = check specific email addresses (client-side check)
    // 'disabled' = no restrictions (anyone can sign up)
    securityMode: 'email',
    
    // Authorized email addresses (add your allowed emails here)
    authorizedEmails: [
        'your-email@example.com',  // Replace with your email
        'family-member@example.com', // Add family member emails
        'trusted-person@example.com' // Add other trusted emails
    ],
    
    // Custom error message
    accessDeniedMessage: 'Access denied. Your email is not authorized to use this application. Please contact the administrator.'
};

// Function to check if user is authorized
function isUserAuthorized(userEmail) {
    if (!userEmail) return false;
    
    // Allow all users if security is disabled
    if (SECURITY_CONFIG.securityMode === 'disabled') {
        return true;
    }
    
    // Check specific email addresses
    if (SECURITY_CONFIG.securityMode === 'email') {
        return SECURITY_CONFIG.authorizedEmails.includes(userEmail.toLowerCase());
    }
    
    // Check email domains (for future use)
    if (SECURITY_CONFIG.securityMode === 'domain') {
        const userDomain = userEmail.split('@')[1];
        return SECURITY_CONFIG.authorizedDomains.includes(userDomain);
    }
    
    return false;
} 