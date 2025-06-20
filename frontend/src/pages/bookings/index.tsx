import { useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import Layout from '../../components/Layout';
import { format } from 'date-fns';
import { getContract } from '../../utils/web3Config';
import HotelBookingABI from '../../contracts/HotelBooking.json';

interface BackendBooking {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  hotel: {
    name: string;
    location: {
      city: string;
      country: string;
    };
    image: string;
  };
}

interface BlockchainBooking {
  hotelId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface Booking extends Omit<BackendBooking, 'checkIn' | 'checkOut'> {
  checkIn: Date;
  checkOut: Date;
  blockchainStatus?: string;
}

export default function Bookings() {
  const { account, provider } = useWeb3React<Web3Provider>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account && provider) {
      fetchBookings();
    }
  }, [account, provider]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is connected
      if (!account) {
        setError('Please connect your wallet to view your bookings.');
        return;
      }

      // Fetch bookings from backend first
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels/bookings/${account}`);
        if (!response.ok) {
          throw new Error(`Backend error: ${response.status} ${response.statusText}`);
        }
        const backendBookings: BackendBooking[] = await response.json();
        console.log('Backend bookings:', backendBookings);

        // If we have backend bookings, try to fetch blockchain data
        if (backendBookings.length > 0) {
          try {
            // Get contract instance
            const hotelBookingAddress = process.env.NEXT_PUBLIC_HOTEL_BOOKING_ADDRESS;
            if (!hotelBookingAddress || !provider) {
              console.warn('Web3 not fully configured, showing only backend data');
              setBookings(backendBookings.map(booking => ({
                ...booking,
                checkIn: new Date(booking.checkIn),
                checkOut: new Date(booking.checkOut)
              })));
              return;
            }

            const contract = await getContract(hotelBookingAddress, HotelBookingABI, provider);
            const bookingIds = await contract.getBookingsByUser(account);
            
            // Map blockchain bookings to our format
            const blockchainBookings: BlockchainBooking[] = await Promise.all(
              bookingIds.map(async (id: string) => {
                const bookingData = await contract.bookings(id);
                return {
                  hotelId: bookingData.hotelId,
                  roomId: bookingData.roomId,
                  checkIn: new Date(bookingData.checkIn.toNumber() * 1000),
                  checkOut: new Date(bookingData.checkOut.toNumber() * 1000),
                  totalPrice: Number(bookingData.totalPrice),
                  transactionHash: bookingData.transactionHash,
                  status: bookingData.status
                };
              })
            );

            console.log('Blockchain bookings:', blockchainBookings);

            // Merge backend and blockchain bookings
            const mergedBookings: Booking[] = backendBookings.map(backendBooking => {
              const blockchainBooking = blockchainBookings.find(
                b => b.transactionHash === backendBooking.transactionHash
              );
              return {
                ...backendBooking,
                checkIn: new Date(backendBooking.checkIn),
                checkOut: new Date(backendBooking.checkOut),
                blockchainStatus: blockchainBooking?.status
              };
            });

            setBookings(mergedBookings);
          } catch (blockchainError) {
            console.error('Blockchain error:', blockchainError);
            // If blockchain fails, still show backend data
            setBookings(backendBookings.map(booking => ({
              ...booking,
              checkIn: new Date(booking.checkIn),
              checkOut: new Date(booking.checkOut)
            })));
          }
        } else {
          // No bookings found
          setBookings([]);
        }
      } catch (backendError) {
        console.error('Backend error:', backendError);
        throw new Error('Failed to fetch bookings from the server. Please try again later.');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error instanceof Error ? error.message : 'Failed to load bookings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#0B1120] text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

          {loading && (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {!loading && !error && bookings.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">You don't have any bookings yet.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking, index) => (
              <div
                key={`${booking.transactionHash}-${index}`}
                className="bg-[#1A2332] rounded-lg overflow-hidden shadow-lg"
              >
                {booking.hotel && (
                  <div className="relative h-48">
                    <img
                      src={booking.hotel.image}
                      alt={booking.hotel.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  {booking.hotel ? (
                    <>
                      <h2 className="text-xl font-semibold mb-2">{booking.hotel.name}</h2>
                      <p className="text-gray-400 mb-4">
                        {booking.hotel.location.city}, {booking.hotel.location.country}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-400 mb-4">Hotel details not available</p>
                  )}

                  <div className="space-y-2 text-sm text-gray-300">
                    <p>
                      <span className="font-medium">Check-in:</span>{' '}
                      {format(booking.checkIn, 'PPP')}
                    </p>
                    <p>
                      <span className="font-medium">Check-out:</span>{' '}
                      {format(booking.checkOut, 'PPP')}
                    </p>
                    <p>
                      <span className="font-medium">Total Price:</span>{' '}
                      ${booking.totalPrice.toFixed(2)}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={`capitalize ${
                        booking.status === 'confirmed' ? 'text-green-500' :
                        booking.status === 'cancelled' ? 'text-red-500' :
                        'text-yellow-500'
                      }`}>
                        {booking.status}
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <a
                      href={`${process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER}/tx/${booking.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View on Explorer
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
} 