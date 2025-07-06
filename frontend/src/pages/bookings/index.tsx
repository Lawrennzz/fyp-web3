import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '@/components/Layout';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useFirebase } from '@/contexts/FirebaseContext';
import { collection, query, where, orderBy, getDocs, onSnapshot, DocumentData, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';
import { config } from '@/config';
import BookingPDFButton from '@/components/BookingPDFButton';

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
}

export default function Bookings() {
  const router = useRouter();
  const { account } = useWeb3React<Web3Provider>();
  const { db } = useFirebase();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printView, setPrintView] = useState<Booking | null>(null);

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

  const handlePrint = (booking: Booking) => {
    setPrintView(booking);
    // Use setTimeout to ensure the content is rendered before printing
    setTimeout(() => {
      window.print();
    }, 100);
  };

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
                <p><span className="font-medium">Check-in:</span> {format(printView.checkIn.toDate(), 'PPP')}</p>
                <p><span className="font-medium">Check-out:</span> {format(printView.checkOut.toDate(), 'PPP')}</p>
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
                          <p className="font-medium">{format(booking.checkIn.toDate(), 'PPP')}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Check-out</p>
                          <p className="font-medium">{format(booking.checkOut.toDate(), 'PPP')}</p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-4 border-t border-gray-700">
                        <div className="mb-4 md:mb-0">
                          <p className="text-gray-400">Total Price</p>
                          <p className="text-xl font-semibold">${booking.totalPrice} USDT</p>
                        </div>
                        <div className="space-y-2">
                          <a
                            href={`https://sepolia.etherscan.io/tx/${booking.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-blue-400 hover:text-blue-300"
                          >
                            View Transaction
                          </a>
                          <button
                            onClick={() => {
                              const hotelIdMap: { [key: string]: string } = {
                                "The Ritz-Carlton": "6856a0646aaf52ea0c8ebc83",
                                "Mandarin Oriental": "6856a0646aaf52ea0c8ebc86",
                                "Le Royal Monceau": "6856a0646aaf52ea0c8ebc89"
                              };

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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}