import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useFirebase } from '../../../contexts/FirebaseContext';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
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
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);
    const [isCancelSubmitting, setIsCancelSubmitting] = useState(false);

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

    const openEditModal = () => {
        if (!booking) return;
        setEditForm({
            checkIn: booking.checkIn.toDate ? booking.checkIn.toDate().toISOString().slice(0, 10) : '',
            checkOut: booking.checkOut.toDate ? booking.checkOut.toDate().toISOString().slice(0, 10) : '',
            guests: booking.guests,
            guestInfo: { ...booking.guestInfo }
        });
        setEditing(true);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('guestInfo.')) {
            setEditForm((prev: any) => ({
                ...prev,
                guestInfo: { ...prev.guestInfo, [name.replace('guestInfo.', '')]: value }
            }));
        } else {
            setEditForm((prev: any) => ({ ...prev, [name]: value }));
        }
    };

    const submitEdit = async () => {
        if (!booking) return;
        setIsEditSubmitting(true);
        try {
            if (db) {
                const bookingRef = doc(db, 'bookings', booking.id);
                await updateDoc(bookingRef, {
                    checkIn: Timestamp.fromDate(new Date(editForm.checkIn)),
                    checkOut: Timestamp.fromDate(new Date(editForm.checkOut)),
                    guests: Number(editForm.guests),
                    guestInfo: editForm.guestInfo
                });
            }
            setEditing(false);
            // Optionally, reload booking
            router.replace(router.asPath);
        } catch (err) {
            console.error(err);
            alert('Error updating booking.');
        } finally {
            setIsEditSubmitting(false);
        }
    };

    const cancelBooking = async () => {
        if (!booking) return;
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        setIsCancelSubmitting(true);
        try {
            // Backend cancel
            const res = await fetch(`/api/bookings/${booking.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to cancel booking');
            // Firestore update
            if (db) {
                const bookingRef = doc(db, 'bookings', booking.id);
                await updateDoc(bookingRef, { status: 'cancelled' });
            }
            // Optionally, reload booking
            router.replace(router.asPath);
        } catch (err) {
            alert('Error cancelling booking.');
        } finally {
            setIsCancelSubmitting(false);
        }
    };

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

                        {booking.status === 'active' && new Date(booking.checkIn.toDate()) > new Date() && (
                            <div className="flex gap-2 mt-8">
                                <button
                                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                                    onClick={openEditModal}
                                    disabled={isEditSubmitting}
                                >Edit</button>
                                <button
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                    onClick={cancelBooking}
                                    disabled={isCancelSubmitting}
                                >Cancel</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#1E293B] p-8 rounded-xl w-full max-w-lg">
                        <h2 className="text-2xl font-bold mb-4 text-white">Edit Booking</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-300 mb-1">Check-in</label>
                                <input type="date" name="checkIn" value={editForm.checkIn} onChange={handleEditChange} className="w-full px-3 py-2 rounded bg-gray-700 text-white" />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-1">Check-out</label>
                                <input type="date" name="checkOut" value={editForm.checkOut} onChange={handleEditChange} className="w-full px-3 py-2 rounded bg-gray-700 text-white" />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-1">Guests</label>
                                <input type="number" name="guests" value={editForm.guests} onChange={handleEditChange} className="w-full px-3 py-2 rounded bg-gray-700 text-white" min={1} />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-1">First Name</label>
                                <input type="text" name="guestInfo.firstName" value={editForm.guestInfo?.firstName || ''} onChange={handleEditChange} className="w-full px-3 py-2 rounded bg-gray-700 text-white" />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-1">Last Name</label>
                                <input type="text" name="guestInfo.lastName" value={editForm.guestInfo?.lastName || ''} onChange={handleEditChange} className="w-full px-3 py-2 rounded bg-gray-700 text-white" />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-1">Email</label>
                                <input type="email" name="guestInfo.email" value={editForm.guestInfo?.email || ''} onChange={handleEditChange} className="w-full px-3 py-2 rounded bg-gray-700 text-white" />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-1">Phone</label>
                                <input type="tel" name="guestInfo.phone" value={editForm.guestInfo?.phone || ''} onChange={handleEditChange} className="w-full px-3 py-2 rounded bg-gray-700 text-white" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button className="px-4 py-2 bg-gray-600 text-white rounded-lg" onClick={() => setEditing(false)} disabled={isEditSubmitting}>Cancel</button>
                            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg" onClick={submitEdit} disabled={isEditSubmitting}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
} 