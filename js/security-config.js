// Security Configuration
// This file is now a template - actual authorized users should be configured privately

const SECURITY_CONFIG = {
    // Security mode: 'domain', 'email', or 'disabled'
    // 'domain' = check email domains (requires server-side validation)
    // 'email' = check specific email addresses (requires server-side validation)  
    // 'disabled' = no restrictions (anyone can sign up)
    securityMode: 'disabled',
    
    // Custom error message
    accessDeniedMessage: 'Access denied. Your email is not authorized to use this application.'
};

// Function to check if user is authorized
// This is now a placeholder - actual validation should be done server-side
function isUserAuthorized(userEmail) {
    if (!userEmail) return false;
    
    // For now, allow all users (you can implement server-side validation later)
    if (SECURITY_CONFIG.securityMode === 'disabled') {
        return true;
    }
    
    // Placeholder for server-side validation
    // In a real implementation, this would make an API call to your server
    console.log('Security check for:', userEmail);
    return true;
} 