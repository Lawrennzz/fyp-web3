import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useWeb3React } from '@web3-react/core';
import { getContract } from '../../utils/web3Config';
import { useAuth } from '../../contexts/FirebaseContext';
import { IoWallet, IoDocumentText, IoRefresh, IoWarning, IoAdd, IoCode } from 'react-icons/io5';
import { Contract, Event, BigNumber } from 'ethers';
import HotelBookingABI from '../../contracts/HotelBooking.json';
import { Web3Provider } from '@ethersproject/providers';
import { config } from '../../config';
import { ethers } from 'ethers';
import { collection, getDocs, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { useFirebase } from '../../contexts/FirebaseContext';

interface Transaction {
  id: string;
  guestAddress: string;
  hotelId: string;
  roomId: string;
  checkInDate: Date;
  checkOutDate: Date;
  status: 'pending' | 'completed' | 'failed';
  type: 'payment' | 'refund';
  bookingId: string;
  amount?: string;
  timestamp?: string;
}

interface DashboardStats {
  totalTransactions: number;
  totalRevenue: number;
  pendingRefunds: number;
  failedTransactions: number;
}

interface BookingEventArgs {
  bookingId: BigNumber;
  hotelId: BigNumber;
  roomId: BigNumber;
  guest: string;
  checkInDate: BigNumber;
  checkOutDate: BigNumber;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { provider: library, account } = useWeb3React();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { db } = useFirebase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [firebaseBookings, setFirebaseBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTransactions: 0,
    totalRevenue: 0,
    pendingRefunds: 0,
    failedTransactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);

  // Helper function to safely convert values to numbers
  const getNumberValue = (value: any): number => {
    if (BigNumber.isBigNumber(value)) {
      // For token values (like USDT, ETH), convert to string and format
      return parseFloat(ethers.utils.formatUnits(value, 18)); // 18 decimals for ETH/USDT
    }
    if (value && typeof value.toNumber === 'function') {
      return value.toNumber();
    }
    // If it's already a number or string, convert it
    return Number(value);
  };

  // Add debug logging
  useEffect(() => {
    console.log('🔍 Admin Dashboard Debug:');
    console.log('- Auth Loading:', authLoading);
    console.log('- User:', user);
    console.log('- User email:', user?.email);
    console.log('- Is Admin:', isAdmin);
    console.log('- User UID:', user?.uid);
  }, [user, isAdmin, authLoading]);

  useEffect(() => {
    // Don't do anything while auth is still loading
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }

    // Now auth is complete, check admin status
    if (!isAdmin) {
      console.log('❌ Admin access denied:', {
        user: user?.email || 'No user',
        isAdmin,
        authComplete: !authLoading
      });

      // Only redirect if no user after auth is complete
      if (!user) {
        console.log('🔄 No user found, redirecting to home');
        router.push('/');
      } else {
        console.log('🔄 User exists but not admin, staying for debug');
      }
    } else {
      console.log('✅ Admin access granted');
    }
  }, [isAdmin, router, user, authLoading]);

  useEffect(() => {
    if (isAdmin && !authLoading) {
      // Set up real-time listener for Firebase bookings
      const bookingsCollection = collection(db, 'bookings');
      const unsubscribe = onSnapshot(
        bookingsCollection,
        {
          next: (snapshot: any) => {
            const bookingsData = snapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data()
            })) as any[];
            setFirebaseBookings(bookingsData);
            updateStatsWithFirebaseData(bookingsData);
          }
        }
      );
      // Fetch blockchain data if available
      if (account && library) {
        fetchTransactions();
        fetchDashboardStats();
        const contract = getContract(
          config.HOTEL_BOOKING_CONTRACT,
          HotelBookingABI.abi,
          library as Web3Provider
        );
        const bookingFilter = contract.filters.BookingCreated();
        contract.on(bookingFilter, (bookingId, hotelId, roomId, guest, checkInDate, checkOutDate) => {
          const newTx: Transaction = {
            id: bookingId.toString(),
            guestAddress: guest,
            hotelId: getNumberValue(hotelId).toString(),
            roomId: getNumberValue(roomId).toString(),
            checkInDate: new Date(getNumberValue(checkInDate) * 1000),
            checkOutDate: new Date(getNumberValue(checkOutDate) * 1000),
            status: 'completed',
            type: 'payment',
            bookingId: bookingId.toString()
          };
          setTransactions(prev => [...prev, newTx]);
          fetchDashboardStats();
        });
        return () => {
          contract.removeAllListeners();
          unsubscribe();
        };
      } else {
        setLoading(false);
        return unsubscribe;
      }
    }
  }, [account, library, isAdmin, authLoading]);

  const fetchFirebaseBookings = async () => {
    try {
      console.log('🔍 Fetching Firebase bookings...');
      const bookingsCollection = collection(db, 'bookings');
      const bookingsSnapshot = await getDocs(bookingsCollection);

      const bookingsData = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      console.log('📄 Firebase bookings found:', bookingsData.length);
      console.log('📄 Looking for address: 0x197ed06Cb269f1725D456701C0a1A33FAaD124eD');

      // Filter for the specific MetaMask address
      const targetBookings = bookingsData.filter((booking: any) =>
        booking.userAddress?.toLowerCase() === '0x197ed06Cb269f1725D456701C0a1A33FAaD124eD'.toLowerCase()
      );

      console.log('🎯 Bookings for target address:', targetBookings);

      setFirebaseBookings(bookingsData);

      // Update stats based on Firebase bookings
      updateStatsWithFirebaseData(bookingsData);
    } catch (error) {
      console.error('❌ Error fetching Firebase bookings:', error);
    }
  };

  // New function to update stats with Firebase data
  const updateStatsWithFirebaseData = (bookings: any[]) => {
    if (!bookings || bookings.length === 0) return;

    // Only include confirmed or completed bookings
    const validBookings = bookings.filter(
      booking => booking.status === 'confirmed' || booking.status === 'completed'
    );

    // Calculate total revenue from valid bookings
    const totalFirebaseRevenue = validBookings.reduce((sum, booking) => {
      const bookingPrice = booking.totalPrice || booking.price || 0;
      return sum + (typeof bookingPrice === 'number' ? bookingPrice : parseFloat(bookingPrice) || 0);
    }, 0);

    setStats(prevStats => ({
      ...prevStats,
      totalTransactions: validBookings.length,
      totalRevenue: totalFirebaseRevenue
    }));
  };

  // 1. Fix blockchain event fetching and show a user-friendly message if no events
  const fetchTransactions = async () => {
    try {
      if (!library) return;
      const contract = getContract(
        config.HOTEL_BOOKING_CONTRACT,
        HotelBookingABI.abi,
        library as Web3Provider
      );
      // Fetch all past events
      let events = await contract.queryFilter(contract.filters.BookingCreated(), 0, 'latest');
      if (!events || events.length === 0) {
        // Fallback: try fetching from block 0 to latest
        events = await contract.queryFilter(contract.filters.BookingCreated());
      }
      console.log('DEBUG: Raw BookingCreated events fetched from blockchain:', events);
      const txs = await Promise.all(events.map(async (event) => {
        const args = event.args as any;
        let bookingDetails = null;
        try {
          bookingDetails = await contract.bookings(args.bookingId);
        } catch (e) { }
        return {
          id: args.bookingId?.toString() || '',
          guestAddress: args.guest,
          hotelId: args.hotelId?.toString() || '',
          roomId: args.roomId?.toString() || '',
          checkInDate: new Date(Number(args.checkInDate?.toString() || 0) * 1000),
          checkOutDate: new Date(Number(args.checkOutDate?.toString() || 0) * 1000),
          status: 'completed' as const,
          type: 'payment' as const,
          bookingId: args.bookingId?.toString() || '',
          amount: bookingDetails ? ethers.utils.formatUnits(bookingDetails.amount, 18) : undefined,
          timestamp: bookingDetails ? new Date(Number(bookingDetails.timestamp?.toString() || 0) * 1000).toLocaleString() : undefined
        };
      }));
      setTransactions(txs);
      console.log('⛓️ Blockchain transactions found:', txs.length);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Initialize stats with zeros
      setStats({
        totalTransactions: 0,
        totalRevenue: 0,
        pendingRefunds: 0,
        failedTransactions: 0
      });

      if (!library) {
        // If blockchain is not available, we can still show Firebase data
        return;
      }

      const contract = getContract(
        config.HOTEL_BOOKING_CONTRACT,
        HotelBookingABI.abi,
        library as Web3Provider
      );

      // Fetch stats from smart contract
      const totalTx = await contract.getTotalTransactions();
      const revenue = await contract.getTotalRevenue();
      const pendingRefunds = await contract.getPendingRefunds();
      const failedTx = await contract.getFailedTransactions();

      // Update with blockchain data
      setStats({
        totalTransactions: getNumberValue(totalTx),
        totalRevenue: parseFloat(ethers.utils.formatUnits(revenue, 18)),
        pendingRefunds: getNumberValue(pendingRefunds),
        failedTransactions: getNumberValue(failedTx)
      });
    } catch (error) {
      console.error('Error fetching blockchain stats:', error);
      // If there's an error with blockchain, we can still show Firebase data
    } finally {
      setLoading(false);
    }
  };

  const processRefund = async (bookingId: string) => {
    try {
      if (!library || !process.env.NEXT_PUBLIC_HOTEL_BOOKING_ADDRESS) return;

      const contract = getContract(
        process.env.NEXT_PUBLIC_HOTEL_BOOKING_ADDRESS,
        HotelBookingABI.abi,
        library as Web3Provider
      );

      await contract.processRefund(bookingId);
      // Refresh data after refund
      fetchTransactions();
      fetchDashboardStats();
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
            <h2 className="text-xl font-bold mb-2">⏳ Loading Authentication...</h2>
            <p>Please wait while we verify your credentials.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show debug info if not admin after auth is complete
  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
            <h2 className="text-xl font-bold mb-4">🔍 Admin Access Debug</h2>
            <div className="space-y-2">
              <p><strong>Auth Loading:</strong> {authLoading ? '⏳ Loading' : '✅ Complete'}</p>
              <p><strong>User Email:</strong> {user?.email || 'Not signed in'}</p>
              <p><strong>User UID:</strong> {user?.uid || 'No UID'}</p>
              <p><strong>Is Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Authentication Status:</strong> {user ? '✅ Signed in' : '❌ Not signed in'}</p>
            </div>
            <div className="mt-4">
              <h3 className="font-bold">Required for Admin Access:</h3>
              <ul className="list-disc list-inside mt-2">
                <li>Must be signed in with Google OAuth (jason@gmail.com)</li>
                <li>Account must have isAdmin: true in Firestore</li>
                <li>Try signing out and back in if still not working</li>
              </ul>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // 2. Improve the theme and table readability
  // Replace the main container and table classes for a lighter, more readable theme
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-blue-700">Admin Dashboard</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="flex items-center px-4 py-2 bg-blue-200 text-blue-800 rounded-lg hover:bg-blue-300"
              >
                <IoCode className="mr-2" />
                {showDebug ? 'Hide Debug' : 'Show Debug'}
              </button>
              <button
                onClick={() => router.push('/admin/register-hotel')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <IoAdd className="mr-2" />
                Register New Hotel
              </button>
              <button
                onClick={() => router.push('/admin/set-hotel-owner')}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <IoAdd className="mr-2" />
                Set Hotel Owner
              </button>
            </div>
          </div>

          {/* Debug Information */}
          {showDebug && (
            <div className="mb-8 bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-2 text-gray-200">Debug Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-300 mb-2">Stats</h4>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm">
                    {JSON.stringify(stats, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-300 mb-2">Firebase Bookings ({firebaseBookings.length})</h4>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm max-h-60">
                    {JSON.stringify(firebaseBookings.map(b => ({
                      id: b.id,
                      price: b.totalPrice || b.price,
                      hotel: b.hotelName,
                      date: b.createdAt?.toDate?.() || b.createdAt
                    })), null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-500 text-white rounded-lg p-6">
              <div className="flex items-center mb-2">
                <IoWallet className="text-2xl mr-2" />
                <h3 className="text-lg">Total Transactions</h3>
              </div>
              <p className="text-2xl font-bold">{stats.totalTransactions}</p>
            </div>

            <div className="bg-green-500 text-white rounded-lg p-6">
              <div className="flex items-center mb-2">
                <IoDocumentText className="text-2xl mr-2" />
                <h3 className="text-lg">Total Revenue</h3>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            </div>

            <div className="bg-yellow-500 text-white rounded-lg p-6">
              <div className="flex items-center mb-2">
                <IoRefresh className="text-2xl mr-2" />
                <h3 className="text-lg">Pending Refunds</h3>
              </div>
              <p className="text-2xl font-bold">{stats.pendingRefunds}</p>
            </div>

            <div className="bg-red-500 text-white rounded-lg p-6">
              <div className="flex items-center mb-2">
                <IoWarning className="text-2xl mr-2" />
                <h3 className="text-lg">Failed Transactions</h3>
              </div>
              <p className="text-2xl font-bold">{stats.failedTransactions}</p>
            </div>
          </div>

          {/* Firebase Bookings Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-xl font-semibold">Firebase Bookings ({firebaseBookings.length})</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">All bookings stored in Firebase database</p>
            </div>
            {firebaseBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Booking ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Hotel Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {firebaseBookings.map((booking: any) => (
                      <tr key={booking.id} className={booking.userAddress?.toLowerCase() === '0x197ed06Cb269f1725D456701C0a1A33FAaD124eD'.toLowerCase() ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {booking.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {booking.userAddress || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {booking.hotelName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          ${booking.totalPrice || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <span className={`px-2 py-1 rounded-full text-xs ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {booking.status || 'unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {booking.createdAt ? new Date(booking.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                No Firebase bookings found
              </div>
            )}
          </div>

          {/* Blockchain Transactions Table - always visible and readable */}
          <div className="bg-white rounded-lg shadow overflow-x-auto mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-xl font-semibold text-blue-700">Blockchain Transactions ({firebaseBookings.length})</h2>
              <p className="text-sm text-gray-600">Transactions recorded on blockchain (from Firebase records)</p>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Guest Address</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Hotel Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Room Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {firebaseBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">No blockchain transactions found.</td>
                  </tr>
                ) : (
                  firebaseBookings.map((booking: any) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{booking.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{booking.userAddress || booking.userId || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.hotelName || booking.hotel || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.roomType || (booking.roomDetails && booking.roomDetails.type) || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.checkIn ? new Date(booking.checkIn.seconds ? booking.checkIn.seconds * 1000 : booking.checkIn).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.checkOut ? new Date(booking.checkOut.seconds ? booking.checkOut.seconds * 1000 : booking.checkOut).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.totalPrice ? `$${booking.totalPrice}` : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.createdAt ? new Date(booking.createdAt.seconds ? booking.createdAt.seconds * 1000 : booking.createdAt).toLocaleString() : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{booking.status || 'unknown'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
} 