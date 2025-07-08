import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '../../components/Layout';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { getContract } from '../../utils/web3Config';
import { format } from 'date-fns';
import HotelBookingABI from '../../contracts/HotelBooking.json';
import TestUSDTABI from '../../contracts/TestUSDT.json';
import { useFirebase } from '../../contexts/FirebaseContext';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { config } from '../../config';
import { normalizeImageUrl, PLACEHOLDER_HOTEL_IMAGE } from '../../utils/helpers';

interface CheckoutProps { }

export default function Checkout({ }: CheckoutProps) {
  const router = useRouter();
  const { account, provider } = useWeb3React<Web3Provider>();
  const { db } = useFirebase();
  const isConnected = !!account;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hotel, setHotel] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    promoCode: ''
  });

  const { id: roomId, hotelId, checkIn, checkOut, guests, nights, totalPrice } = router.query;

  useEffect(() => {
    if (!isConnected) {
      alert('Please connect your wallet to proceed with the booking');
      router.push('/');
      return;
    }

    if (router.isReady && hotelId && roomId) {
      fetchHotelAndRoomDetails();
    }
  }, [router.isReady, hotelId, roomId]);

  const fetchHotelAndRoomDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels/${hotelId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch hotel details');
      }

      const hotelData = await response.json();
      setHotel(hotelData);

      const roomData = hotelData.rooms.find((r: any) => r._id === roomId);
      if (!roomData) {
        throw new Error('Room not found');
      }
      setRoom(roomData);
    } catch (error) {
      console.error('Error fetching details:', error);
      setError('Failed to load booking details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayment = async () => {
    if (!isConnected || !provider || !hotel || !room || !db) return;

    // Validate form data
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setProcessingPayment(true);

      // Get contract addresses from config
      const hotelBookingAddress = config.HOTEL_BOOKING_CONTRACT;
      const usdtAddress = config.USDT_CONTRACT;

      if (!hotelBookingAddress || !usdtAddress) {
        throw new Error('Contract addresses not found');
      }

      // Get signer
      const signer = provider.getSigner();

      // Get contract instances with signer
      const hotelContract = new ethers.Contract(hotelBookingAddress, HotelBookingABI.abi, signer);
      const usdtContract = new ethers.Contract(usdtAddress, TestUSDTABI.abi, signer);

      // Convert total price to wei (assuming price is in USDT with 18 decimals)
      const totalPriceWei = ethers.utils.parseUnits(totalPrice as string, 18);

      // Approve USDT spending
      const approveTx = await usdtContract.approve(hotelBookingAddress, totalPriceWei);
      const approveReceipt = await approveTx.wait();

      // Call the smart contract to process the booking
      console.log('Starting booking process with contract...');
      const bookingId = `TG-${Date.now()}`;
      const tx = await hotelContract.book(
        bookingId,
        hotelId as string,
        roomId as string,
        totalPriceWei,
        Math.floor(new Date(checkIn as string).getTime() / 1000),
        Math.floor(new Date(checkOut as string).getTime() / 1000),
        { gasLimit: 500000 }
      );

      console.log('Transaction sent:', tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Store booking information in Firebase
      const bookingData = {
        userId: account.toLowerCase(),
        hotelId: hotelId as string,
        roomId: roomId as string,
        hotelName: hotel.name,
        roomType: room.type,
        checkIn: Timestamp.fromDate(new Date(checkIn as string)),
        checkOut: Timestamp.fromDate(new Date(checkOut as string)),
        guests: Number(guests),
        totalPrice: Number(totalPrice),
        transactionHash: receipt.transactionHash,
        approvalHash: approveReceipt.transactionHash,
        status: 'confirmed',
        createdAt: Timestamp.now(),
        guestInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        hotelDetails: {
          name: hotel.name,
          location: hotel.location,
          image: normalizeImageUrl(hotel.images[0]?.url || hotel.image)
        },
        roomDetails: {
          type: room.type,
          pricePerNight: room.pricePerNight,
          amenities: room.amenities
        },
        blockchainIds: {
          hotelId: String(Date.now()),
          roomId: String(Date.now() + 1)
        }
      };

      console.log('Storing booking data in Firebase:', bookingData);

      try {
        const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
        console.log('Booking stored in Firebase with ID:', bookingRef.id);

        // Also store payment information
        const paymentData = {
          amount: Number(totalPrice),
          bookingId: bookingRef.id,
          currency: "USDT",
          guestAddress: account.toLowerCase(),
          metadata: {
            checkInDate: new Date(checkIn as string).toISOString().split('T')[0],
            checkOutDate: new Date(checkOut as string).toISOString().split('T')[0],
            hotelId: hotelId as string,
            roomId: roomId as string
          },
          paymentMethod: "crypto",
          status: "confirmed",
          transactionHash: receipt.transactionHash,
          createdAt: Timestamp.now()
        };

        console.log('Storing payment data in Firebase:', paymentData);
        await addDoc(collection(db, 'payments'), paymentData);
        console.log('Payment data stored in Firebase');

        // Wait a moment before redirecting to ensure data is saved
        setTimeout(() => {
          router.push('/bookings');
        }, 2000);
      } catch (dbError) {
        console.error('Error storing data in Firebase:', dbError);
        alert('Booking confirmed but there was an error saving the details. Please try again or contact support.');
        // Still redirect since blockchain transaction was successful
        router.push('/bookings');
      }
    } catch (error: any) {
      console.error('Payment error:', error);

      // If the error is from the contract call
      if (error.code === 'CALL_EXCEPTION' || error.code === 4001) {
        // Store failed payment information
        const failedPaymentData = {
          amount: Number(totalPrice),
          bookingId: `TG-${Date.now()}`,
          currency: "USDT",
          guestAddress: account.toLowerCase(),
          metadata: {
            checkInDate: new Date(checkIn as string).toISOString().split('T')[0],
            checkOutDate: new Date(checkOut as string).toISOString().split('T')[0],
            hotelId: hotelId as string,
            roomId: roomId as string
          },
          paymentMethod: "crypto",
          status: "failed",
          error: error.message || 'Contract call failed',
          createdAt: Timestamp.now()
        };

        try {
          await addDoc(collection(db, 'payments'), failedPaymentData);
        } catch (dbError) {
          console.error('Error storing failed payment data:', dbError);
        }
      }

      alert(error.message || 'Failed to process payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error || !hotel || !room) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
          <div className="text-red-500">{error || 'Booking details not found'}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#0B1120]">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Booking Details */}
            <div className="lg:w-2/3">
              <h1 className="text-3xl font-bold mb-8">Confirm Your Booking</h1>

              {/* Hotel Info */}
              <div className="bg-[#1E293B] rounded-xl p-6 mb-6">
                <div className="flex gap-6">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                    <Image
                      src={normalizeImageUrl(hotel.images[0]?.url || hotel.image)}
                      alt={hotel.name}
                      fill
                      className="object-cover"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = PLACEHOLDER_HOTEL_IMAGE;
                      }}
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">{hotel.name}</h2>
                    <p className="text-gray-400">{hotel.location.address}</p>
                    <p className="text-gray-400">{hotel.location.city}, {hotel.location.country}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-[#1E293B] rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full bg-[#0B1120] border border-gray-700 rounded-lg p-3 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full bg-[#0B1120] border border-gray-700 rounded-lg p-3 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-[#0B1120] border border-gray-700 rounded-lg p-3 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-[#0B1120] border border-gray-700 rounded-lg p-3 text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Room Details */}
              <div className="bg-[#1E293B] rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Room Details</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-400">Room Type:</span> {room.type}</p>
                  <p><span className="text-gray-400">Guests:</span> {guests}</p>
                  <p><span className="text-gray-400">Check-in:</span> {format(new Date(checkIn as string), 'PPP')}</p>
                  <p><span className="text-gray-400">Check-out:</span> {format(new Date(checkOut as string), 'PPP')}</p>
                  <p><span className="text-gray-400">Number of nights:</span> {nights}</p>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="lg:w-1/3">
              <div className="sticky top-8">
                <div className="bg-[#1E293B] rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4">Payment Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Room rate</span>
                      <span>${room.pricePerNight} per night</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Number of nights</span>
                      <span>{nights}</span>
                    </div>
                    <div className="border-t border-gray-700 my-4"></div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>${totalPrice} USDT</span>
                    </div>
                    <button
                      onClick={handlePayment}
                      disabled={processingPayment || !isConnected}
                      className="w-full mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingPayment ? 'Processing...' : 'Confirm and Pay'}
                    </button>
                    {!isConnected && (
                      <p className="text-sm text-red-500 text-center mt-2">
                        Please connect your wallet to proceed
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 