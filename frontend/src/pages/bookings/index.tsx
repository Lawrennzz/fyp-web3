import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '../../components/Layout';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, query, where, orderBy, getDocs, onSnapshot, DocumentData, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';

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

  useEffect(() => {
    if (!account || !db) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching bookings for account:', account.toLowerCase());

        const bookingsRef = collection(db, 'bookings');
        const q = query(
          bookingsRef,
          where('userId', '==', account.toLowerCase()),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        console.log('Found bookings:', querySnapshot.size);

        const bookingsData = querySnapshot.docs.map((doc: DocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          console.log('Booking data:', data);
          return {
            id: doc.id,
            userId: data?.userId,
            hotelId: data?.hotelId,
            roomId: data?.roomId,
            hotelName: data?.hotelName,
            roomType: data?.roomType,
            checkIn: data?.checkIn,
            checkOut: data?.checkOut,
            guests: data?.guests,
            totalPrice: data?.totalPrice,
            status: data?.status,
            transactionHash: data?.transactionHash,
            approvalHash: data?.approvalHash,
            createdAt: data?.createdAt,
            hotelDetails: data?.hotelDetails,
            roomDetails: data?.roomDetails,
            guestInfo: data?.guestInfo
          } as Booking;
        });

        setBookings(bookingsData);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setError('Failed to load bookings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();

    // Set up real-time listener for new bookings
    const bookingsRef = collection(db, 'bookings');
    const q = query(
      bookingsRef,
      where('userId', '==', account.toLowerCase()),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, {
      next: (snapshot: QuerySnapshot<DocumentData>) => {
        const newBookings = snapshot.docs.map((doc: DocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data?.userId,
            hotelId: data?.hotelId,
            roomId: data?.roomId,
            hotelName: data?.hotelName,
            roomType: data?.roomType,
            checkIn: data?.checkIn,
            checkOut: data?.checkOut,
            guests: data?.guests,
            totalPrice: data?.totalPrice,
            status: data?.status,
            transactionHash: data?.transactionHash,
            approvalHash: data?.approvalHash,
            createdAt: data?.createdAt,
            hotelDetails: data?.hotelDetails,
            roomDetails: data?.roomDetails,
            guestInfo: data?.guestInfo
          } as Booking;
        });
        setBookings(newBookings);
      },
      error: (error: Error) => {
        console.error('Error in real-time bookings listener:', error);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [account, db]);

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
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            booking.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
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
                            onClick={() => router.push(`/hotels/${booking.hotelId}`)}
                            className="block text-sm text-blue-400 hover:text-blue-300"
                    >
                            View Hotel
                          </button>
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