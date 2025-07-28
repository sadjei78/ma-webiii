// Security Configuration
// This file is now a template - actual authorization is handled by Firebase

const SECURITY_CONFIG = {
    // Security mode: 'firestore' or 'disabled'
    // 'firestore' = check authorized users in Firestore collection
    // 'disabled' = no restrictions (anyone can sign up)
    securityMode: 'firestore', // Re-enabled now that user is added
    
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
            if (!user) {
                console.log('No authenticated user found');
                return false;
            }
            
            console.log('Checking authorization for:', userEmail);
            console.log('User UID:', user.uid);
            
            // First try to check by email (more reliable)
            try {
                const emailQuery = await db.collection('authorizedUsers')
                    .where('email', '==', userEmail)
                    .where('authorized', '==', true)
                    .limit(1)
                    .get();
                
                if (!emailQuery.empty) {
                    console.log('User authorized by email check');
                    return true;
                }
            } catch (emailError) {
                console.log('Email check failed:', emailError);
            }
            
            // Then try to check by UID
            try {
                const userDoc = await db.collection('authorizedUsers').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const isAuthorized = userData.authorized === true && userData.email === userEmail;
                    console.log('User authorized by UID check:', isAuthorized);
                    return isAuthorized;
                }
            } catch (uidError) {
                console.log('UID check failed:', uidError);
            }
            
            console.log('User not found in authorized users');
            return false;
            
        } catch (error) {
            console.error('Error checking authorization:', error);
            // On error, allow access temporarily to prevent lockout
            console.log('Allowing access due to error');
            return true;
        }
    }
    
    return false;
} 