import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

if (!getApps().length) {
    initializeApp({
        credential: cert({
            // TODO: Replace with your Firebase Admin service account credentials
            projectId: 'your-project-id',
            clientEmail: 'your-client-email',
            privateKey: 'your-private-key'.replace(/\\n/g, '\n'),
        }),
    });
}
const db = getFirestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    if (req.method === 'DELETE') {
        try {
            await db.collection('bookings').doc(id as string).update({ status: 'cancelled' });
            res.status(200).json({ success: true });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Failed to cancel booking' });
        }
    } else if (req.method === 'PUT') {
        try {
            const { checkIn, checkOut, guests, guestInfo } = req.body;
            await db.collection('bookings').doc(id as string).update({
                checkIn: new Date(checkIn),
                checkOut: new Date(checkOut),
                guests,
                guestInfo
            });
            res.status(200).json({ success: true });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Failed to update booking' });
        }
    } else {
        res.status(405).end();
    }
} 