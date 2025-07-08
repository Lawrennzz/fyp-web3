const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Middleware to check if the user is an admin
const isAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Check if user is admin from custom claims or Firestore
        if (decodedToken.admin) {
            req.user = decodedToken;
            return next();
        }

        // Check in Firestore as fallback
        const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists && userDoc.data().isAdmin) {
            req.user = decodedToken;
            return next();
        }

        return res.status(403).json({ success: false, message: 'Forbidden - Admin privileges required' });
    } catch (error) {
        console.error('Error verifying admin status:', error);
        return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
    }
};

// Set hotel owner privileges endpoint
router.post('/set-hotel-owner', isAdmin, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        // Get user from Firebase Auth
        const user = await admin.auth().getUser(userId);

        // Set custom claims
        await admin.auth().setCustomUserClaims(userId, {
            ...user.customClaims,
            hotelOwner: true
        });

        // Update Firestore document
        await admin.firestore().collection('users').doc(userId).set({
            isHotelOwner: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`Successfully set hotel owner privileges for user ID: ${userId}`);
        res.json({ success: true, message: 'Hotel owner privileges set successfully' });
    } catch (error) {
        console.error('Error setting hotel owner privileges:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router; 