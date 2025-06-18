import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { getContract } from '../../utils/web3Config';
import { ethers } from 'ethers';
import DatePicker from 'react-datepicker';

interface Room {
  id: string;
  type: string;
  price: number;
  beds: {
    count: number;
    type: string;
  };
  available: boolean;
}

interface Hotel {
  _id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  rating: number;
  price: number;
  amenities: string[];
  reviews: {
    user: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

export default function HotelDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { account, provider } = useWeb3React();
  const isConnected = !!account;
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchHotelDetails();
    }
  }, [id]);

  const fetchHotelDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch hotel details');
      }
      
      const data = await response.json();
      setHotel(data);
    } catch (error) {
      console.error('Error fetching hotel details:', error);
      setError('Failed to load hotel details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (roomId: string) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }

    try {
      // TODO: Implement actual booking through smart contract
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels/${id}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          checkIn,
          checkOut,
          account
        }),
      });

      if (!response.ok) {
        throw new Error('Booking failed');
      }

      alert('Booking successful!');
      router.push('/bookings'); // Redirect to bookings page
    } catch (error) {
      console.error('Error booking room:', error);
      alert('Error booking room. Please try again.');
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

  if (error || !hotel) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-400">{error || 'Hotel not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          ← Back to Hotels
        </button>

        {/* Hotel Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{hotel.name}</h1>
          <div className="flex items-center gap-4 text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-blue-500">★</span>
              <span>{hotel.rating}</span>
              <span>({hotel.reviews.length} reviews)</span>
            </div>
            <span>•</span>
            <span>{hotel.location}</span>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="col-span-2 row-span-2">
            <img
              src={hotel.image}
              alt="Hotel Image"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">About this hotel</h2>
          <p className="text-gray-400">{hotel.description}</p>
        </div>

        {/* Amenities */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Amenities</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {hotel.amenities.map((amenity, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-400">
                <span>✓</span>
                <span>{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rooms */}
        <div>
          <h2 className="text-xl font-bold mb-6">Available Rooms</h2>
          <div className="space-y-6">
            {/* Assuming hotel.rooms is not provided in the hotel object */}
            {/* You might want to fetch rooms from the backend or use a default set */}
            {/* For now, we'll use a default set of rooms */}
            {/* Replace this with actual room data from the backend */}
            {/* For example: hotel.rooms.filter(room => room.available).map(room => ( */}
            {/*   <div */}
            {/*     key={room.id} */}
            {/*     className="bg-gray-800 rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" */}
            {/*   > */}
            {/*     <div> */}
            {/*       <h3 className="text-lg font-semibold mb-2">{room.type}</h3> */}
            {/*       <p className="text-gray-400 mb-2"> */}
            {/*         {room.beds.count} {room.beds.type} bed(s) */}
            {/*       </p> */}
            {/*     </div> */}
            {/*     <div className="flex flex-col md:flex-row items-start md:items-center gap-4"> */}
            {/*       <div className="flex flex-col gap-2"> */}
            {/*         <DatePicker */}
            {/*           selected={checkIn} */}
            {/*           onChange={(date) => setCheckIn(date)} */}
            {/*           selectsStart */}
            {/*           startDate={checkIn} */}
            {/*           endDate={checkOut} */}
            {/*           minDate={new Date()} */}
            {/*           placeholderText="Check-in" */}
            {/*           className="bg-gray-700 text-white" */}
            {/*         /> */}
            {/*         <DatePicker */}
            {/*           selected={checkOut} */}
            {/*           onChange={(date) => setCheckOut(date)} */}
            {/*           selectsEnd */}
            {/*           startDate={checkIn} */}
            {/*           endDate={checkOut} */}
            {/*           minDate={checkIn || new Date()} */}
            {/*           placeholderText="Check-out" */}
            {/*           className="bg-gray-700 text-white" */}
            {/*         /> */}
            {/*       </div> */}
            {/*       <div className="flex flex-col items-end gap-2"> */}
            {/*         <span className="text-2xl font-bold">${room.price}</span> */}
            {/*         <span className="text-gray-400">per night</span> */}
            {/*         <button */}
            {/*           onClick={() => handleBooking(room.id)} */}
            {/*           disabled={!isConnected} */}
            {/*           className={`px-6 py-2 rounded ${ */}
            {/*             isConnected */}
            {/*               ? 'bg-blue-500 hover:bg-blue-600' */}
            {/*               : 'bg-gray-600 cursor-not-allowed' */}
            {/*           }`} */}
            {/*         > */}
            {/*           {isConnected ? 'Book Now' : 'Connect Wallet to Book'} */}
            {/*         </button> */}
            {/*       </div> */}
            {/*     </div> */}
            {/*   </div> */}
            {/* )) */}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">Guest Reviews</h2>
          <div className="space-y-6">
            {hotel.reviews.map((review, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">★</span>
                    <span>{review.rating}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">{review.user}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">
                    {new Date(review.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-400">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
} 