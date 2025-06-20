import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import Layout from '../../components/Layout';
import { getContract } from '../../utils/web3Config';
import HotelBookingABI from '../../contracts/HotelBooking.json';
import TestUSDTABI from '../../contracts/TestUSDT.json';

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  promoCode?: string;
}

interface BookingDetails {
  hotelId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  hotel: {
    name: string;
    location: {
      city: string;
      country: string;
    };
    image: string;
  };
  room: {
    type: string;
    amenities: string[];
  };
}

export default function Checkout() {
  const router = useRouter();
  const { account, provider } = useWeb3React<Web3Provider>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    promoCode: ''
  });
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (router.query.id) {
      fetchBookingDetails();
    }
  }, [router.query.id]);

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels/booking/${router.query.id}`);
      if (!response.ok) throw new Error('Failed to fetch booking details');
      const data = await response.json();
      setBookingDetails(data);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setError('Failed to load booking details');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validatePromoCode = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/promo/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formData.promoCode })
      });
      if (!response.ok) throw new Error('Invalid promo code');
      const data = await response.json();
      setDiscount(data.discount);
    } catch (error) {
      console.error('Error validating promo code:', error);
      setError('Invalid promotion code');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !provider || !bookingDetails) return;

    try {
      setLoading(true);
      setError(null);

      // Get contract instances
      const hotelBookingAddress = process.env.NEXT_PUBLIC_HOTEL_BOOKING_ADDRESS;
      const testUSDTAddress = process.env.NEXT_PUBLIC_TEST_USDT_ADDRESS;
      
      if (!hotelBookingAddress || !testUSDTAddress) {
        throw new Error('Contract addresses not found');
      }

      const hotelContract = await getContract(hotelBookingAddress, HotelBookingABI, provider);
      const usdtContract = await getContract(testUSDTAddress, TestUSDTABI, provider);

      // Calculate final price with discount
      const finalPrice = bookingDetails.totalPrice * (1 - discount);
      const priceInWei = ethers.utils.parseEther(finalPrice.toString());

      // Approve USDT spending
      const approveTx = await usdtContract.approve(hotelBookingAddress, priceInWei);
      await approveTx.wait();

      // Create booking
      const bookTx = await hotelContract.bookRoom(
        bookingDetails.hotelId,
        bookingDetails.roomId,
        Math.floor(new Date(bookingDetails.checkIn).getTime() / 1000),
        Math.floor(new Date(bookingDetails.checkOut).getTime() / 1000),
        priceInWei,
        {
          from: account
        }
      );

      // Wait for transaction confirmation
      const receipt = await bookTx.wait();

      // Update backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels/${bookingDetails.hotelId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: bookingDetails.roomId,
          checkIn: bookingDetails.checkIn,
          checkOut: bookingDetails.checkOut,
          account,
          transactionHash: receipt.transactionHash,
          guestInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update booking on backend');
      }

      // Redirect to confirmation page
      router.push(`/bookings`);
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!bookingDetails) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0B1120] text-white">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>
            {error ? (
              <div className="bg-red-500 text-white p-4 rounded-lg">
                {error}
              </div>
            ) : (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-32 mb-4"></div>
                <div className="h-[200px] bg-gray-700 rounded-lg mb-4"></div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#0B1120] text-white">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-400 hover:text-blue-300 mb-8"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Hotel
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Booking Summary */}
            <div className="bg-[#1A2332] rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Your Booking</h2>
              
              <div className="mb-6">
                <img
                  src={bookingDetails.hotel.image}
                  alt={bookingDetails.hotel.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-xl font-semibold">{bookingDetails.hotel.name}</h3>
                <p className="text-gray-400">
                  {bookingDetails.hotel.location.city}, {bookingDetails.hotel.location.country}
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span>Check-in</span>
                  <span>{new Date(bookingDetails.checkIn).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-out</span>
                  <span>{new Date(bookingDetails.checkOut).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Room Type</span>
                  <span>{bookingDetails.room.type}</span>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between text-lg mb-2">
                  <span>Subtotal</span>
                  <span>${bookingDetails.totalPrice.toFixed(2)} USDT</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-500 mb-2">
                    <span>Discount</span>
                    <span>-${(bookingDetails.totalPrice * discount).toFixed(2)} USDT</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>${(bookingDetails.totalPrice * (1 - discount)).toFixed(2)} USDT</span>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-[#1A2332] rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-[#0B1120] rounded-lg p-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-[#0B1120] rounded-lg p-3 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#0B1120] rounded-lg p-3 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#0B1120] rounded-lg p-3 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Promotion Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="promoCode"
                      value={formData.promoCode}
                      onChange={handleInputChange}
                      className="flex-1 bg-[#0B1120] rounded-lg p-3 text-white"
                    />
                    <button
                      type="button"
                      onClick={validatePromoCode}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500 text-white p-4 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !account}
                  className={`w-full py-4 rounded-lg font-semibold ${
                    loading || !account
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Processing...' : 'Pay Now'}
                </button>

                {!account && (
                  <p className="text-center text-red-500">
                    Please connect your wallet to proceed with payment
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 