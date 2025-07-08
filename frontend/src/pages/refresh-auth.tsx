import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/FirebaseContext';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function RefreshAuth() {
    const { user, loading } = useAuth();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();
    const { redirect } = router.query;

    const handleRefreshToken = async () => {
        try {
            setIsProcessing(true);
            setError('');
            setMessage('Refreshing authentication token...');

            const auth = getAuth();
            if (auth.currentUser) {
                // Force token refresh
                await auth.currentUser.getIdToken(true);
                setMessage('Authentication token refreshed successfully! Redirecting...');

                // Wait a moment before redirecting
                setTimeout(() => {
                    if (typeof redirect === 'string' && redirect) {
                        router.push(redirect);
                    } else {
                        router.push('/');
                    }
                }, 2000);
            } else {
                setError('No user is currently signed in');
            }
        } catch (error: any) {
            console.error('Error refreshing token:', error);
            setError(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSignOut = async () => {
        try {
            setIsProcessing(true);
            setError('');
            setMessage('Signing out...');

            const auth = getAuth();
            await signOut(auth);

            setMessage('Signed out successfully! Please sign back in to refresh your permissions.');
        } catch (error: any) {
            console.error('Error signing out:', error);
            setError(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Refresh Authentication</h1>

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

                <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-2">Authentication Status</h2>
                        {loading ? (
                            <p>Loading authentication status...</p>
                        ) : user ? (
                            <div className="space-y-2">
                                <p><strong>Email:</strong> {user.email}</p>
                                <p><strong>User ID:</strong> {user.uid}</p>
                                <p><strong>Status:</strong> <span className="text-green-600">Signed In</span></p>
                            </div>
                        ) : (
                            <p className="text-red-600">Not signed in</p>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                        <button
                            onClick={handleRefreshToken}
                            className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isProcessing || !user}
                        >
                            Refresh Token
                        </button>

                        <button
                            onClick={handleSignOut}
                            className={`px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isProcessing || !user}
                        >
                            Sign Out
                        </button>

                        <Link
                            href="/"
                            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-center"
                        >
                            Go Home
                        </Link>
                    </div>
                </div>

                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
                    <p className="font-bold">Why refresh your token?</p>
                    <p className="mt-2">
                        When your permissions change (like becoming a hotel owner), you need to refresh your authentication token
                        for the changes to take effect. This page helps you do that without having to sign out completely.
                    </p>
                    <p className="mt-2">
                        If refreshing the token doesn't work, try signing out and signing back in.
                    </p>
                </div>
            </div>
        </Layout>
    );
} 