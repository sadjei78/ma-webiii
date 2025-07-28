// Security Configuration
// Edit this file to control who can access your contact manager

const SECURITY_CONFIG = {
    // Option 1: Allow specific email domains
    authorizedDomains: [
        'gmail.com',
        'yahoo.com', 
        'outlook.com',
        'hotmail.com',
        // Add your specific domains here
        // 'yourcompany.com',
        // 'yourdomain.com'
    ],
    
    // Option 2: Allow specific email addresses only
    authorizedEmails: [
        // 'mom@gmail.com',
        // 'dad@gmail.com',
        // 'family@gmail.com'
    ],
    
    // Security mode: 'domain' or 'email'
    // 'domain' = check email domains
    // 'email' = check specific email addresses
    securityMode: 'domain',
    
    // Custom error message
    accessDeniedMessage: 'Access denied. Your email is not authorized to use this application.'
};

// Function to check if user is authorized
function isUserAuthorized(userEmail) {
    if (!userEmail) return false;
    
    if (SECURITY_CONFIG.securityMode === 'email') {
        return SECURITY_CONFIG.authorizedEmails.includes(userEmail);
    } else {
        const userDomain = userEmail.split('@')[1];
        return SECURITY_CONFIG.authorizedDomains.includes(userDomain);
    }
} 