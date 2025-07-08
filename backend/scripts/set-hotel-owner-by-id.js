const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

// Try to find the service account file
const serviceAccountPath = path.join(__dirname, '..', 'firebase-admin-key.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        // Check if service account file exists
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            // Try to use environment variables
            admin.initializeApp();
        }
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        process.exit(1);
    }
}

// Function to set hotel owner privileges by user ID
async function setHotelOwnerPrivilegeById(userId) {
    try {
        // Get user by ID
        const user = await admin.auth().getUser(userId);

        // Set custom claims
        await admin.auth().setCustomUserClaims(userId, { hotelOwner: true });

        // Create or update user document in Firestore
        await admin.firestore().collection('users').doc(userId).set({
            email: user.email,
            isHotelOwner: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`Successfully set hotel owner privileges for user ID: ${userId}`);
        console.log(`User email: ${user.email}`);
        process.exit(0);
    } catch (error) {
        console.error('Error setting hotel owner privileges:', error);
        process.exit(1);
    }
}

// Check if user ID argument is provided
if (process.argv.length < 3) {
    console.error('Please provide a user ID as an argument');
    console.log('Usage: node set-hotel-owner-by-id.js <userId>');
    process.exit(1);
}

// Get user ID from command line argument
const userId = process.argv[2];

// Set hotel owner privileges
setHotelOwnerPrivilegeById(userId); 