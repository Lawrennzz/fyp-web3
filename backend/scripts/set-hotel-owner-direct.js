const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
try {
    const serviceAccountPath = path.join(__dirname, '..', 'firebase-admin-key.json');

    if (fs.existsSync(serviceAccountPath)) {
        // Use service account file if available
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized with service account file');
    } else {
        // Try default credentials
        admin.initializeApp();
        console.log('Firebase Admin initialized with default credentials');
    }
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    process.exit(1);
}

// Function to set hotel owner privileges
async function setHotelOwnerPrivileges(userId) {
    try {
        console.log(`Setting hotel owner privileges for user ID: ${userId}`);

        // Get user from Firebase Auth
        const user = await admin.auth().getUser(userId);
        console.log(`Found user: ${user.email || 'No email'}`);

        // Get current custom claims
        const currentClaims = user.customClaims || {};
        console.log('Current custom claims:', currentClaims);

        // Set custom claims
        await admin.auth().setCustomUserClaims(userId, {
            ...currentClaims,
            hotelOwner: true
        });
        console.log('Custom claims updated successfully');

        // Update Firestore document
        await admin.firestore().collection('users').doc(userId).set({
            isHotelOwner: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log('Firestore document updated successfully');

        // Verify the changes
        const updatedUser = await admin.auth().getUser(userId);
        console.log('Updated custom claims:', updatedUser.customClaims);

        console.log(`Successfully set hotel owner privileges for user ID: ${userId}`);
        process.exit(0);
    } catch (error) {
        console.error('Error setting hotel owner privileges:', error);
        process.exit(1);
    }
}

// Check if userId is provided as command line argument
if (process.argv.length < 3) {
    console.error('Please provide a user ID as a command line argument');
    console.log('Usage: node set-hotel-owner-direct.js <userId>');
    process.exit(1);
}

// Get userId from command line argument
const userId = process.argv[2];

// Set hotel owner privileges
setHotelOwnerPrivileges(userId); 