import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useFirebase } from '../../../contexts/FirebaseContext';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { config } from '../../../config';

interface BookingConfirmation {
    id: string;
    hotelDetails: {
        name: string;
        location: {
            address: string;
            city: string;
            country: string;
        };
    };
    roomDetails: {
        type: string;
    };
    guestInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    checkIn: any;
    checkOut: any;
    guests: number;
    totalPrice: number;
    status: string;
    transactionHash: string;
}

export default function BookingConfirmation() {
    const router = useRouter();
    const { id } = router.query;
    const { db } = useFirebase();
    const [booking, setBooking] = useState<BookingConfirmation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id || !db) return;

        const fetchBooking = async () => {
            try {
                setLoading(true);
                setError(null);

                const bookingRef = doc(db, 'bookings', id as string);
                const bookingDoc = await getDoc(bookingRef);

                if (!bookingDoc.exists) {
                    setError('Booking not found');
                    return;
                }

                setBooking({
                    id: bookingDoc.id,
                    ...bookingDoc.data()
                } as BookingConfirmation);
            } catch (error) {
                console.error('Error fetching booking:', error);
                setError('Failed to load booking details');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [id, db]);

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </Layout>
        );
    }

    if (error || !booking) {
        return (
            <Layout>
                <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Error</h1>
                        <p className="text-gray-400">{error || 'Booking not found'}</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-[#0B1120]">
                <div className="container mx-auto px-6 py-8">
                    <div className="bg-[#1E293B] rounded-xl p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold mb-2">Booking Confirmation</h1>
                            <p className="text-gray-400">Booking ID: {booking.id}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Hotel Details</h2>
                                <div className="space-y-2">
                                    <p><span className="text-gray-400">Hotel:</span> {booking.hotelDetails.name}</p>
                                    <p><span className="text-gray-400">Location:</span> {booking.hotelDetails.location.address}</p>
                                    <p><span className="text-gray-400">City:</span> {booking.hotelDetails.location.city}</p>
                                    <p><span className="text-gray-400">Country:</span> {booking.hotelDetails.location.country}</p>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold mb-4">Guest Information</h2>
                                <div className="space-y-2">
                                    <p><span className="text-gray-400">Name:</span> {booking.guestInfo.firstName} {booking.guestInfo.lastName}</p>
                                    <p><span className="text-gray-400">Email:</span> {booking.guestInfo.email}</p>
                                    <p><span className="text-gray-400">Phone:</span> {booking.guestInfo.phone}</p>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
                                <div className="space-y-2">
                                    <p><span className="text-gray-400">Room Type:</span> {booking.roomDetails.type}</p>
                                    <p><span className="text-gray-400">Check-in:</span> {format(booking.checkIn.toDate(), 'PPP')}</p>
                                    <p><span className="text-gray-400">Check-out:</span> {format(booking.checkOut.toDate(), 'PPP')}</p>
                                    <p><span className="text-gray-400">Guests:</span> {booking.guests}</p>
                                    <p><span className="text-gray-400">Total Price:</span> ${booking.totalPrice} USDT</p>
                                    <p><span className="text-gray-400">Status:</span> {booking.status}</p>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold mb-4">Verification</h2>
                                <div className="space-y-2">
                                    <p className="text-gray-400">This booking is verified on the blockchain.</p>
                                    <a
                                        href={`https://sepolia.etherscan.io/tx/${booking.transactionHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300"
                                    >
                                        View Transaction
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <a
                                href={`${config.API_URL}/api/hotels/booking-confirmation/${booking.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                            >
                                Download PDF Confirmation
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
} 