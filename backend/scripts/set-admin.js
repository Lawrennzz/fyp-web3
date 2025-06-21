const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Function to set admin privileges
async function setAdminPrivilege(email) {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    // Create or update user document in Firestore
    await admin.firestore().collection('users').doc(user.uid).set({
      email: email,
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSignIn: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`Successfully set admin privileges for user: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin privileges:', error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address');
  console.log('Usage: node set-admin.js <email>');
  process.exit(1);
}

setAdminPrivilege(email); 