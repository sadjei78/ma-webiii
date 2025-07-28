// Security Configuration
// This file is now a template - actual authorization is handled by Firebase

const SECURITY_CONFIG = {
    // Security mode: 'firestore' or 'disabled'
    // 'firestore' = check authorized users in Firestore collection
    // 'disabled' = no restrictions (anyone can sign up)
    securityMode: 'firestore',
    
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
    
    // Check Firestore for authorized users
    if (SECURITY_CONFIG.securityMode === 'firestore') {
        try {
            const user = firebase.auth().currentUser;
            if (!user) return false;
            
            // Check if user exists in authorizedUsers collection
            const userDoc = await db.collection('authorizedUsers').doc(user.uid).get();
            if (userDoc.exists) {
                return userDoc.data().authorized === true;
            }
            
            // Also check by email for backward compatibility
            const emailQuery = await db.collection('authorizedUsers')
                .where('email', '==', userEmail)
                .where('authorized', '==', true)
                .limit(1)
                .get();
            
            return !emailQuery.empty;
        } catch (error) {
            console.error('Error checking authorization:', error);
            return false;
        }
    }
    
    return false;
} 