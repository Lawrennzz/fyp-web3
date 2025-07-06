// This file is no longer needed since we're using inline type declarations
// to avoid conflicts with MetaMask's detect-provider types

import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import HotelBookingABI from '../contracts/HotelBooking.json';
import TestUSDTABI from '../contracts/TestUSDT.json';
import { getWeb3 } from './web3';
import { formatDate } from './helpers';

// Contract addresses from deployment
const HOTEL_BOOKING_ADDRESS = process.env.NEXT_PUBLIC_HOTEL_BOOKING_ADDRESS || '';
const TEST_USDT_ADDRESS = process.env.NEXT_PUBLIC_TEST_USDT_ADDRESS || '';

/**
 * Get a hotel booking contract instance
 * @returns Contract instance
 */
export const getHotelBookingContract = async (): Promise<Contract> => {
    try {
        const web3 = await getWeb3();
        return new web3.eth.Contract(
            HotelBookingABI.abi as AbiItem[],
            HOTEL_BOOKING_ADDRESS
        );
    } catch (error) {
        console.error('Error getting hotel booking contract:', error);
        throw error;
    }
};

/**
 * Get a USDT contract instance
 * @returns Contract instance
 */
export const getUSDTContract = async (): Promise<Contract> => {
    try {
        const web3 = await getWeb3();
        return new web3.eth.Contract(
            TestUSDTABI.abi as AbiItem[],
            TEST_USDT_ADDRESS
        );
    } catch (error) {
        console.error('Error getting USDT contract:', error);
        throw error;
    }
};

/**
 * Get booking by ID
 * @param bookingId The ID of the booking to fetch
 * @returns Booking data
 */
export const getBookingById = async (bookingId: string): Promise<any> => {
    try {
        // For now, we'll return mock data
        // In a real implementation, you would fetch this from the blockchain
        return getMockBookingData(bookingId);
    } catch (error) {
        console.error('Error getting booking by ID:', error);
        throw error;
    }
};

/**
 * Get mock booking data for testing
 * @param bookingId Booking ID
 * @returns Mock booking data
 */
const getMockBookingData = (bookingId: string): any => {
    // Sample hotel data
    const hotels = [
        {
            id: '1',
            name: 'The Ritz-Carlton',
            location: 'London, United Kingdom',
            image: '/images/hotels/ritz.jpg',
            description: 'Luxury hotel in the heart of London',
            rooms: [
                {
                    id: '101',
                    type: 'Executive Suite',
                    pricePerNight: 350,
                    features: ['King Bed', 'Ocean View', 'Mini Bar', 'Room Service', 'WiFi'],
                    description: 'Spacious suite with a king-sized bed and ocean view',
                },
                {
                    id: '102',
                    type: 'Deluxe Room',
                    pricePerNight: 250,
                    features: ['Queen Bed', 'City View', 'Mini Bar', 'WiFi'],
                    description: 'Comfortable room with a queen-sized bed and city view',
                },
            ],
        },
        {
            id: '2',
            name: 'Mandarin Oriental',
            location: 'London, United Kingdom',
            image: '/images/hotels/mandarin.jpg',
            description: 'Elegant hotel with stunning views',
            rooms: [
                {
                    id: '201',
                    type: 'Premier Suite',
                    pricePerNight: 400,
                    features: ['King Bed', 'River View', 'Mini Bar', 'Room Service', 'WiFi', 'Jacuzzi'],
                    description: 'Luxurious suite with a king-sized bed and river view',
                },
                {
                    id: '202',
                    type: 'Superior Room',
                    pricePerNight: 300,
                    features: ['Queen Bed', 'Garden View', 'Mini Bar', 'WiFi'],
                    description: 'Elegant room with a queen-sized bed and garden view',
                },
            ],
        },
    ];

    // Create a mock booking
    const hotel = hotels[0];
    const room = hotel.rooms[0];

    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + 30); // 30 days from now

    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + 3); // 3 days stay

    return {
        id: bookingId,
        hotelId: hotel.id,
        roomId: room.id,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        guests: 2,
        totalPrice: 750,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        hotelDetails: {
            name: hotel.name,
            location: hotel.location,
            image: hotel.image,
        },
        roomDetails: {
            type: room.type,
            pricePerNight: room.pricePerNight,
            features: room.features,
        },
        guestName: 'John Doe',
        guestEmail: 'john.doe@example.com',
    };
};

/**
 * Get all bookings for a user
 * @param userAddress User's Ethereum address
 * @returns Array of bookings
 */
export const getUserBookings = async (userAddress: string): Promise<any[]> => {
    try {
        // For now, we'll return mock data
        // In a real implementation, you would fetch this from the blockchain
        return [
            getMockBookingData('iszIDQpH5mBCTyCpzTNO'),
            getMockBookingData('2ndMockBookingID'),
        ];
    } catch (error) {
        console.error('Error getting user bookings:', error);
        throw error;
    }
};

/**
 * Create a new booking
 * @param bookingData Booking data
 * @param userAddress User's Ethereum address
 * @returns Transaction receipt
 */
export const createBooking = async (bookingData: any, userAddress: string): Promise<any> => {
    try {
        // Mock implementation
        console.log('Creating booking with data:', bookingData);
        console.log('User address:', userAddress);

        // Return a mock transaction receipt
        return {
            transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
            status: true,
        };
    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
};

export { }; 