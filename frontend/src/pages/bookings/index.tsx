import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '@/components/Layout';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useFirebase } from '@/contexts/FirebaseContext';
import { collection, query, where, orderBy, getDocs, onSnapshot, DocumentData, QuerySnapshot, DocumentSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';
import { config } from '@/config';
import BookingPDFButton from '@/components/BookingPDFButton';
import { getCurrentNetwork, getLocalTransactionDetails } from '@/utils/ethereum';
import { fetchHotelIdMap } from '@/utils/helpers';
import { NETWORKS } from '@/utils/networks';

interface Booking {
  id: string;
  userId: string;
  hotelId: string;
  roomId: string;
  hotelName: string;
  roomType: string;
  checkIn: any;
  checkOut: any;
  guests: number;
  totalPrice: number;
  status: string;
  transactionHash: string;
  approvalHash: string;
  createdAt: any;
  hotelDetails: {
    name: string;
    location: {
      address: string;
      city: string;
      country: string;
    };
    image: string;
  };
  roomDetails: {
    type: string;
    pricePerNight: number;
    amenities: string[];
  };
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  editRequested?: boolean;
  refunded?: boolean;
  policy?: {
    type: string;
    canEdit: boolean;
    canCancel: boolean;
    editDeadlineHours?: number;
    cancelDeadlineHours?: number;
    refundable: string;
    cancelFee?: number;
  };
}

type NetworkType = typeof NETWORKS.ganache | typeof NETWORKS.sepolia | null;

export default function Bookings() {
  const router = useRouter();
  const { account } = useWeb3React<Web3Provider>();
  const { db } = useFirebase();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printView, setPrintView] = useState<Booking | null>(null);
  const [managingBooking, setManagingBooking] = useState<Booking | null>(null);
  const [network, setNetwork] = useState<NetworkType>(null);
  const [txDetails, setTxDetails] = useState<any>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [hotelIdMap, setHotelIdMap] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  useEffect(() => {
    if (!account || !db) return;

    setLoading(true);
    setError(null);

    console.log('Fetching bookings for account:', account.toLowerCase());

    const bookingsRef = collection(db, 'bookings');
    const q = query(
      bookingsRef,
      where('userId', '==', account.toLowerCase()),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      {
        next: (querySnapshot: QuerySnapshot<DocumentData>) => {
          const bookingsData = querySnapshot.docs.map((doc: DocumentSnapshot<DocumentData>) => {
            const data = doc.data() || {};
            return {
              id: doc.id,
              ...data,
              hotelDetails: data.hotelDetails || {},
              roomDetails: data.roomDetails || {},
              checkIn: data.checkIn,
              checkOut: data.checkOut,
              createdAt: data.createdAt,
              guestInfo: data.guestInfo || {}
            } as Booking;
          });

          console.log('Found bookings:', bookingsData.length);
          setBookings(bookingsData);
          setLoading(false);
        },
        error: (error: Error) => {
          console.error('Error in real-time bookings listener:', error);
          setError('Failed to load bookings. Please try again.');
          setLoading(false);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [account, db]);

  useEffect(() => {
    getCurrentNetwork().then(setNetwork);
  }, []);

  useEffect(() => {
    fetchHotelIdMap().then(setHotelIdMap);
  }, []);

  const handlePrint = (booking: Booking) => {
    setPrintView(booking);
    // Use setTimeout to ensure the content is rendered before printing
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const openEditModal = (booking: Booking) => {
    setManagingBooking(booking);
    setIsEditing(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('guestInfo.')) {
      setManagingBooking((prev: any) => ({
        ...prev,
        guestInfo: { ...prev.guestInfo, [name.replace('guestInfo.', '')]: value }
      }));
    } else {
      setManagingBooking((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const submitEdit = async () => {
    if (!managingBooking) return;
    try {
      if (db) {
        const bookingRef = doc(db, 'bookings', managingBooking.id);
        await updateDoc(bookingRef, {
          checkIn: Timestamp.fromDate(
            managingBooking.checkIn.toDate
              ? managingBooking.checkIn.toDate()
              : new Date(managingBooking.checkIn)
          ),
          checkOut: Timestamp.fromDate(
            managingBooking.checkOut.toDate
              ? managingBooking.checkOut.toDate()
              : new Date(managingBooking.checkOut)
          ),
          guests: Number(managingBooking.guests),
          guestInfo: managingBooking.guestInfo
        });
        alert('Booking updated successfully.');
      }
      setManagingBooking(null);
    } catch (err) {
      console.error(err);
      alert('Error updating booking.');
    }
  };

  const cancelBooking = async (booking: Booking) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      if (db) {
        const bookingRef = doc(db, 'bookings', booking.id);
        await updateDoc(bookingRef, { status: 'cancelled' });
        alert('Booking cancelled. Please initiate refund via MetaMask.');
      }
    } catch (err) {
      alert('Error cancelling booking.');
    }
  };

  async function handleViewTx(txHash: string) {
    const details = await getLocalTransactionDetails(txHash);
    setTxDetails(details);
    setShowTxModal(true);
  }

  // Helper to get JS time from Firestore Timestamp, Date, or string
  function getTime(val: any): number {
    if (val && typeof val.toDate === 'function') {
      return val.toDate().getTime();
    } else if (val instanceof Date) {
      return val.getTime();
    } else {
      return new Date(val).getTime();
    }
  }

  let manageBookingModal = null;
  if (managingBooking) {
    const checkInTime = getTime(managingBooking.checkIn);
    const now = Date.now();
    const editDeadline = (managingBooking.policy?.editDeadlineHours || 24) * 60 * 60 * 1000;
    const cancelDeadline = (managingBooking.policy?.cancelDeadlineHours || 24) * 60 * 60 * 1000;
    const canEdit = managingBooking.policy?.canEdit &&
      !managingBooking.editRequested &&
      now < checkInTime - editDeadline;
    const canCancel = managingBooking.policy?.canCancel &&
      now < checkInTime - cancelDeadline;
    console.log('Booking policy:', managingBooking.policy);
    console.log('EditRequested:', managingBooking.editRequested);
    console.log('Check-in:', managingBooking.checkIn);
    manageBookingModal = (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1E293B] p-8 rounded-xl w-full max-w-2xl text-white">
          <h2 className="text-2xl font-bold mb-4">Manage My Booking</h2>
          {isEditing ? (
            <div>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Check-in</label>
                  <input type="date" name="checkIn" value={format(getTime(managingBooking.checkIn), 'yyyy-MM-dd')} onChange={e => setManagingBooking(prev => prev ? { ...prev, checkIn: new Date(e.target.value) } : prev)} className="w-full p-2 rounded bg-gray-800 text-white" />
                </div>
                <div>
                  <label className="block mb-1">Check-out</label>
                  <input type="date" name="checkOut" value={format(getTime(managingBooking.checkOut), 'yyyy-MM-dd')} onChange={e => setManagingBooking(prev => prev ? { ...prev, checkOut: new Date(e.target.value) } : prev)} className="w-full p-2 rounded bg-gray-800 text-white" />
                </div>
                <div>
                  <label className="block mb-1">Guests</label>
                  <input type="number" name="guests" min="1" value={managingBooking.guests} onChange={e => setManagingBooking(prev => prev ? { ...prev, guests: Number(e.target.value) } : prev)} className="w-full p-2 rounded bg-gray-800 text-white" />
                </div>
                <div>
                  <label className="block mb-1">First Name</label>
                  <input type="text" name="guestInfo.firstName" value={managingBooking.guestInfo?.firstName || ''} onChange={handleEditChange} className="w-full p-2 rounded bg-gray-800 text-white" />
                  <label className="block mb-1 mt-2">Last Name</label>
                  <input type="text" name="guestInfo.lastName" value={managingBooking.guestInfo?.lastName || ''} onChange={handleEditChange} className="w-full p-2 rounded bg-gray-800 text-white" />
                  <label className="block mb-1 mt-2">Email</label>
                  <input type="email" name="guestInfo.email" value={managingBooking.guestInfo?.email || ''} onChange={handleEditChange} className="w-full p-2 rounded bg-gray-800 text-white" />
                  <label className="block mb-1 mt-2">Phone</label>
                  <input type="text" name="guestInfo.phone" value={managingBooking.guestInfo?.phone || ''} onChange={handleEditChange} className="w-full p-2 rounded bg-gray-800 text-white" />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600" onClick={async () => { await submitEdit(); setIsEditing(false); }}>Save</button>
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Booking Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><span className="font-medium">Hotel:</span> {managingBooking.hotelDetails?.name}</p>
                    <p><span className="font-medium">Room Type:</span> {managingBooking.roomDetails?.type}</p>
                    <p><span className="font-medium">Check-in:</span> {format(getTime(managingBooking.checkIn), 'PPP')}</p>
                    <p><span className="font-medium">Check-out:</span> {format(getTime(managingBooking.checkOut), 'PPP')}</p>
                    <p><span className="font-medium">Guests:</span> {managingBooking.guests}</p>
                    <p><span className="font-medium">Total Price:</span> ${managingBooking.totalPrice} USDT</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Guest Name:</span> {managingBooking.guestInfo?.firstName} {managingBooking.guestInfo?.lastName}</p>
                    <p><span className="font-medium">Email:</span> {managingBooking.guestInfo?.email}</p>
                    <p><span className="font-medium">Phone:</span> {managingBooking.guestInfo?.phone}</p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Booking Policy</h3>
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p><span className="font-medium">Type:</span> {managingBooking.policy?.type || 'Standard Flexible'}</p>
                  <p><span className="font-medium">Edit allowed:</span> {managingBooking.policy?.canEdit ? `Yes, before ${managingBooking.policy?.editDeadlineHours || 24}h before check-in` : 'No'}</p>
                  <p><span className="font-medium">Cancel allowed:</span> {managingBooking.policy?.canCancel ? `Yes, before ${managingBooking.policy?.cancelDeadlineHours || 24}h before check-in` : 'No'}</p>
                  <p><span className="font-medium">Refund:</span> {managingBooking.policy?.refundable === 'full' ? 'Full refund' : managingBooking.policy?.refundable === 'partial' ? 'Partial refund' : 'No refund'}</p>
                  {managingBooking.policy?.cancelFee ? (
                    <p><span className="font-medium">Cancel Fee:</span> {managingBooking.policy.cancelFee} USDT</p>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                {canEdit ? (
                  <button
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                    onClick={() => setIsEditing(true)}
                  >Edit Booking</button>
                ) : (
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-lg" disabled>Edit Not Allowed</button>
                )}
                {canCancel ? (
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    onClick={() => cancelBooking(managingBooking)}
                  >Cancel Booking</button>
                ) : (
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-lg" disabled>Cancel Not Allowed</button>
                )}
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg ml-auto" onClick={() => setManagingBooking(null)}>Close</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-gray-400">Please connect your wallet to view your bookings.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (printView) {
    return (
      <div className="p-8 bg-white text-black min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Travel.Go Booking Confirmation</h1>
            <p className="text-gray-600 mt-2">Booking ID: {printView.id}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Hotel Details</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Hotel:</span> {printView.hotelDetails.name}</p>
                <p><span className="font-medium">Address:</span> {printView.hotelDetails.location.address}</p>
                <p><span className="font-medium">City:</span> {printView.hotelDetails.location.city}</p>
                <p><span className="font-medium">Country:</span> {printView.hotelDetails.location.country}</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Guest Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {printView.guestInfo.firstName} {printView.guestInfo.lastName}</p>
                <p><span className="font-medium">Email:</span> {printView.guestInfo.email}</p>
                <p><span className="font-medium">Phone:</span> {printView.guestInfo.phone}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Room Type:</span> {printView.roomDetails.type}</p>
                <p><span className="font-medium">Check-in:</span> {format(getTime(printView.checkIn), 'PPP')}</p>
                <p><span className="font-medium">Check-out:</span> {format(getTime(printView.checkOut), 'PPP')}</p>
                <p><span className="font-medium">Guests:</span> {printView.guests}</p>
                <p><span className="font-medium">Total Price:</span> ${printView.totalPrice} USDT</p>
                <p><span className="font-medium">Status:</span> {printView.status}</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <h2 className="text-xl font-semibold mb-4">Booking QR Code</h2>
              <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <QRCode
                  value={`${siteOrigin}/bookings/confirmation/${printView.id}`}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                  title="Booking QR Code"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">Scan to view booking details</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-8">
            <div className="text-sm text-gray-500">
              <p className="mb-2">Transaction Hash: {printView.transactionHash}</p>
              <p className="mb-4">This booking is verified on the blockchain network.</p>
              <p>For assistance, please contact Travel.Go support.</p>
            </div>
          </div>

          <div className="mt-8 text-center print:hidden">
            <button
              onClick={() => setPrintView(null)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mr-4"
            >
              Back to Bookings
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 mr-4"
            >
              Print
            </button>
            <BookingPDFButton booking={printView} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#0B1120]">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

          {error && (
            <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {bookings.length === 0 ? (
            <div className="bg-[#1E293B] rounded-xl p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">No Bookings Found</h2>
              <p className="text-gray-400 mb-6">You haven't made any bookings yet.</p>
              <button
                onClick={() => router.push('/hotels')}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                Browse Hotels
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-[#1E293B] rounded-xl overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Hotel Image */}
                    <div className="relative w-full md:w-64 h-48">
                      <Image
                        src={booking.hotelDetails.image}
                        alt={booking.hotelDetails.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row justify-between mb-4">
                        <div>
                          <h2 className="text-2xl font-semibold mb-2">{booking.hotelDetails.name}</h2>
                          <p className="text-gray-400">
                            {booking.hotelDetails.location.city}, {booking.hotelDetails.location.country}
                          </p>
                        </div>
                        <div className="mt-4 md:mt-0">
                          <span className={`px-3 py-1 rounded-full text-sm ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                            }`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400">Room Type</p>
                          <p className="font-medium">{booking.roomDetails.type}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Guests</p>
                          <p className="font-medium">{booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Check-in</p>
                          <p className="font-medium">{format(getTime(booking.checkIn), 'PPP')}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Check-out</p>
                          <p className="font-medium">{format(getTime(booking.checkOut), 'PPP')}</p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-4 border-t border-gray-700">
                        <div className="mb-4 md:mb-0">
                          <p className="text-gray-400">Total Price</p>
                          <p className="text-xl font-semibold">${booking.totalPrice} USDT</p>
                        </div>
                        <div className="space-y-2">
                          {network && network.name === 'Sepolia' ? (
                            <a
                              href={`https://sepolia.etherscan.io/tx/${booking.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-blue-400 hover:text-blue-300"
                            >
                              View on Etherscan
                            </a>
                          ) : (
                            <button
                              onClick={() => handleViewTx(booking.transactionHash)}
                              className="block text-sm text-blue-400 hover:text-blue-300"
                            >
                              View Local Tx Details
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const correctHotelId = hotelIdMap[booking.hotelDetails.name] || booking.hotelId;
                              router.push(`/hotels/${correctHotelId}`);
                            }}
                            className="block text-sm text-blue-400 hover:text-blue-300"
                          >
                            View Hotel
                          </button>
                          <a
                            href={`/booking-confirmation/${booking.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-blue-400 hover:text-blue-300"
                          >
                            View Booking Details
                          </a>
                          <button
                            onClick={() => handlePrint(booking)}
                            className="block text-sm text-blue-400 hover:text-blue-300"
                          >
                            Print Booking Details
                          </button>
                          <BookingPDFButton booking={booking} />
                          <button
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            onClick={() => setManagingBooking(booking)}
                          >
                            Manage My Booking
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {manageBookingModal}

          {/* Transaction Details Modal */}
          {showTxModal && txDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#1E293B] p-8 rounded-xl w-full max-w-2xl text-white">
                <h2 className="text-2xl font-bold mb-4">Transaction Details</h2>
                <pre className="overflow-x-auto whitespace-pre-wrap text-sm bg-gray-900 p-4 rounded-lg max-h-96">{JSON.stringify(txDetails, null, 2)}</pre>
                <div className="flex justify-end mt-4">
                  <button className="px-4 py-2 bg-blue-500 rounded-lg" onClick={() => setShowTxModal(false)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}