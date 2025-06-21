import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useWeb3React } from '@web3-react/core';
import { getContract } from '../../utils/web3Config';
import { useAuth } from '../../contexts/FirebaseContext';
import { IoWallet, IoDocumentText, IoRefresh, IoWarning } from 'react-icons/io5';
import { Contract, Event, BigNumber } from 'ethers';
import HotelBookingABI from '../../contracts/HotelBooking.json';
import { Web3Provider } from '@ethersproject/providers';
import { config } from '../../config';
import { ethers } from 'ethers';

interface Transaction {
  id: string;
  guestAddress: string;
  hotelId: number;
  roomId: number;
  checkInDate: Date;
  checkOutDate: Date;
  status: 'pending' | 'completed' | 'failed';
  type: 'payment' | 'refund';
  bookingId: number;
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
  const { user, isAdmin } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTransactions: 0,
    totalRevenue: 0,
    pendingRefunds: 0,
    failedTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      router.push('/');
    }
  }, [isAdmin, router]);

  useEffect(() => {
    if (account && library) {
      fetchTransactions();
      fetchDashboardStats();

      // Listen for new events
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
          hotelId: hotelId.toNumber(),
          roomId: roomId.toNumber(),
          checkInDate: new Date(checkInDate.toNumber() * 1000),
          checkOutDate: new Date(checkOutDate.toNumber() * 1000),
          status: 'completed',
          type: 'payment',
          bookingId: bookingId.toNumber()
        };
        setTransactions(prev => [...prev, newTx]);
        fetchDashboardStats();
      });

      return () => {
        contract.removeAllListeners();
      };
    }
  }, [account, library]);

  const fetchTransactions = async () => {
    try {
      if (!library) return;
      
      const contract = getContract(
        config.HOTEL_BOOKING_CONTRACT,
        HotelBookingABI.abi,
        library as Web3Provider
      );

      // Fetch all past events
      const filter = {
        fromBlock: 0,
        toBlock: 'latest'
      };

      const events = await contract.queryFilter(contract.filters.BookingCreated(), filter.fromBlock, filter.toBlock);
      
      // Transform blockchain events to transaction objects
      const txs = events.map(event => {
        const args = event.args as unknown as BookingEventArgs;
        return {
          id: args.bookingId.toString(),
          guestAddress: args.guest,
          hotelId: args.hotelId.toNumber(),
          roomId: args.roomId.toNumber(),
          checkInDate: new Date(args.checkInDate.toNumber() * 1000),
          checkOutDate: new Date(args.checkOutDate.toNumber() * 1000),
          status: 'completed' as const,
          type: 'payment' as const,
          bookingId: args.bookingId.toNumber()
        };
      });

      setTransactions(txs);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      if (!library) return;
      
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

      setStats({
        totalTransactions: totalTx.toNumber(),
        totalRevenue: parseFloat(ethers.utils.formatUnits(revenue, 18)),
        pendingRefunds: pendingRefunds.toNumber(),
        failedTransactions: failedTx.toNumber()
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
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
            <p className="text-2xl font-bold">${stats.totalRevenue}</p>
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

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Guest Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Hotel ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Room ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {tx.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {tx.guestAddress.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {tx.hotelId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {tx.roomId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {tx.checkInDate.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {tx.checkOutDate.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {tx.type === 'payment' && (
                        <button
                          onClick={() => processRefund(tx.id)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Process Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
} 