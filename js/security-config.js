// Security Configuration
// This file is now a template - actual authorization is handled by Firebase

const SECURITY_CONFIG = {
    // Security mode: 'firebase' or 'disabled'
    // 'firebase' = check Firebase Custom Claims for authorization
    // 'disabled' = no restrictions (anyone can sign up)
    securityMode: 'firebase',
    
    // Custom error message
    accessDeniedMessage: 'Access denied. Your email is not authorized to use this application. Please contact an existing member to request access.'
};

// Function to check if user is authorized
async function isUserAuthorized(userEmail) {
    if (!userEmail) return false;
    
    // Allow all users if security is disabled
    if (SECURITY_CONFIG.securityMode === 'disabled') {
        return true;
    }
    
    // Check Firebase Custom Claims for authorization
    if (SECURITY_CONFIG.securityMode === 'firebase') {
        try {
            const user = firebase.auth().currentUser;
            if (!user) return false;
            
            // Get user's custom claims from Firebase
            const token = await user.getIdTokenResult();
            return token.claims.authorized === true;
        } catch (error) {
            console.error('Error checking authorization:', error);
            return false;
        }
    }
    
    return false;
} 