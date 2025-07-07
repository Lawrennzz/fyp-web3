const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin using the existing configuration
if (!admin.apps.length) {
    try {
        // Try to use environment variables or existing config
        admin.initializeApp();
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        process.exit(1);
    }
}

// Function to set hotel owner privileges
async function setHotelOwnerPrivilege(email) {
    try {
        // Get user by email
        const user = await admin.auth().getUserByEmail(email);

        // Set custom claims
        await admin.auth().setCustomUserClaims(user.uid, { hotelOwner: true });

        // Create or update user document in Firestore
        await admin.firestore().collection('users').doc(user.uid).set({
            email: email,
            isHotelOwner: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`Successfully set hotel owner privileges for user: ${email}`);
        process.exit(0);
    } catch (error) {
        console.error('Error setting hotel owner privileges:', error);
        process.exit(1);
    }
}

// Check if email argument is provided
if (process.argv.length < 3) {
    console.error('Please provide an email address as an argument');
    console.log('Usage: node set-hotel-owner.js <email>');
    process.exit(1);
}

// Get email from command line argument
const email = process.argv[2];

// Set hotel owner privileges
setHotelOwnerPrivilege(email); 