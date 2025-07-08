import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/FirebaseContext';
import { doc, updateDoc, getFirestore, getDoc, setDoc } from 'firebase/firestore';
import { app } from '../../config/firebase';
import axios from 'axios';
import { config } from '../../config';

export default function SetHotelOwner() {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const [userId, setUserId] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const db = getFirestore(app);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId) {
            setError('Please enter a user ID');
            return;
        }

        try {
            setIsProcessing(true);
            setError('');
            setMessage('');

            // First update the Firestore document
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists) {
                // Create the document if it doesn't exist
                await setDoc(userDocRef, {
                    isHotelOwner: true,
                    updatedAt: new Date(),
                    createdAt: new Date()
                });
            } else {
                // Update the existing document
                await updateDoc(userDocRef, {
                    isHotelOwner: true,
                    updatedAt: new Date()
                });
            }

            // Then call the backend API to update custom claims
            try {
                const response = await axios.post(`${config.API_URL}/api/admin/set-hotel-owner`, {
                    userId: userId
                });

                if (response.data.success) {
                    setMessage(`Successfully set hotel owner privileges for user ID: ${userId}. Please ask the user to sign out and sign back in.`);
                } else {
                    setMessage(`Updated Firestore document, but there was an issue updating custom claims: ${response.data.message}`);
                }
            } catch (apiError: any) {
                console.error('API error:', apiError);
                setMessage(`Updated Firestore document, but there was an issue updating custom claims. The user may need to sign out and sign back in for changes to take effect.`);
            }

            setUserId('');
        } catch (error: any) {
            console.error('Error setting hotel owner privileges:', error);
            setError(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Redirect if not admin
    if (!loading && !isAdmin) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                        <p className="font-bold">Access Denied</p>
                        <p>You need admin privileges to access this page.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Set Hotel Owner Privileges</h1>

                {message && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
                        <p>{message}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="userId">
                            User ID
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="userId"
                            type="text"
                            placeholder="Enter user ID"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            disabled={isProcessing}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            type="submit"
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Processing...' : 'Set Hotel Owner Privileges'}
                        </button>
                    </div>
                </form>

                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
                    <p className="font-bold">Instructions</p>
                    <p>Enter the user ID to grant hotel owner privileges.</p>
                    <p className="mt-2">Your user ID: {user?.uid || 'Not signed in'}</p>
                    <p className="mt-2 font-bold">Note: The user will need to sign out and sign back in for the changes to take effect.</p>
                </div>
            </div>
        </Layout>
    );
} 