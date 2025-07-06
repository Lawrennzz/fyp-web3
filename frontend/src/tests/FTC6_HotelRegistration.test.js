/**
 * Test Case FTC-6: Hotel Owner Registration
 * 
 * This test script verifies that hotel owners can register new properties on the platform.
 */

import { ethers } from 'ethers';
import HotelBookingABI from '../contracts/HotelBooking.json';
import { config } from '../config';

// Mock data for testing
const testHotelData = {
    name: 'Test Luxury Hotel',
    description: 'A beautiful luxury hotel for testing purposes',
    city: 'Test City',
    country: 'Test Country',
    address: '123 Test Street, Test City, Test Country',
    amenities: ['WiFi', 'Pool', 'Restaurant', 'Gym', 'Spa & Wellness'],
    imageUrls: ['https://example.com/test-image.jpg'],
    rooms: [
        {
            type: 'Deluxe',
            description: 'A spacious deluxe room',
            pricePerNight: 200,
            maxGuests: 2,
            amenities: ['WiFi', 'Room Service', 'TV'],
            images: ['https://example.com/room-image.jpg']
        }
    ]
};

/**
 * Step 1: Connect wallet as hotel owner
 */
async function connectWalletAsHotelOwner() {
    console.log('Step 1: Connect wallet as hotel owner');

    try {
        // Check if MetaMask is installed
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask is not installed');
        }

        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];

        console.log(`Connected with account: ${account}`);

        // Check if the account has enough ETH for gas fees
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const balance = await provider.getBalance(account);

        if (ethers.utils.formatEther(balance) < 0.01) {
            console.warn('Warning: Account balance is low, may not have enough ETH for gas fees');
        }

        return { account, provider };
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
    }
}

/**
 * Step 2: Access hotel registration form
 */
async function accessHotelRegistrationForm() {
    console.log('Step 2: Access hotel registration form');

    try {
        // In a real test, this would navigate to the form
        // For this script, we'll just simulate the form access
        console.log('Successfully accessed hotel registration form');
        return true;
    } catch (error) {
        console.error('Failed to access hotel registration form:', error);
        throw error;
    }
}

/**
 * Step 3: Fill in hotel details
 */
async function fillHotelDetails() {
    console.log('Step 3: Fill in hotel details');

    try {
        // In a real test, this would fill in the form fields
        // For this script, we'll just simulate filling the form
        console.log('Hotel details filled successfully:', testHotelData);
        return testHotelData;
    } catch (error) {
        console.error('Failed to fill hotel details:', error);
        throw error;
    }
}

/**
 * Step 4: Upload hotel images to IPFS storage
 */
async function uploadHotelImages() {
    console.log('Step 4: Upload hotel images to IPFS storage');

    try {
        // In a real test, this would upload actual images to IPFS
        // For this script, we'll just simulate the upload
        const mockIPFSHashes = [
            'Qmf9T3jR7YVU4U8AJeXqvBgxCFCsT91vZaTUB4vt6NVCRU',
            'QmXyZ123456789abcdefghijklmnopqrstuvwxyz123456'
        ];

        console.log('Images uploaded to IPFS successfully:', mockIPFSHashes);
        return mockIPFSHashes;
    } catch (error) {
        console.error('Failed to upload images to IPFS:', error);
        throw error;
    }
}

/**
 * Step 5: Submit registration and pay gas fees
 */
async function submitRegistrationAndPayGas(account, provider, hotelData, ipfsHashes) {
    console.log('Step 5: Submit registration and pay gas fees');

    try {
        // Get contract instance
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
            config.HOTEL_BOOKING_CONTRACT,
            HotelBookingABI.abi,
            signer
        );

        // Call the contract method to add a hotel
        const tx = await contract.addHotel(
            hotelData.name,
            `${hotelData.city}, ${hotelData.country}`,
            hotelData.description,
            ipfsHashes[0] // Using the first IPFS hash as the main image
        );

        console.log('Transaction submitted, waiting for confirmation...');

        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        console.log('Transaction confirmed with hash:', receipt.transactionHash);

        // Get the hotel ID from the event logs
        const event = receipt.events.find(event => event.event === 'HotelAdded');
        const hotelId = event.args.hotelId.toString();

        return {
            transactionHash: receipt.transactionHash,
            hotelId: hotelId
        };
    } catch (error) {
        console.error('Failed to submit registration:', error);
        throw error;
    }
}

/**
 * Step 6: Check hotel registration on blockchain
 */
async function checkHotelRegistration(provider, hotelId, transactionHash) {
    console.log('Step 6: Check hotel registration on blockchain');

    try {
        // Get contract instance (read-only)
        const contract = new ethers.Contract(
            config.HOTEL_BOOKING_CONTRACT,
            HotelBookingABI.abi,
            provider
        );

        // Get hotel details from the contract
        const hotel = await contract.hotels(hotelId);

        console.log('Hotel verified on blockchain:', {
            id: hotel.id.toString(),
            name: hotel.name,
            owner: hotel.hotelOwner,
            isActive: hotel.isActive
        });

        // Check transaction on Etherscan
        const networkName = (await provider.getNetwork()).name;
        const etherscanBaseUrl = networkName === 'sepolia'
            ? 'https://sepolia.etherscan.io'
            : 'https://etherscan.io';

        console.log(`View transaction on Etherscan: ${etherscanBaseUrl}/tx/${transactionHash}`);

        return true;
    } catch (error) {
        console.error('Failed to verify hotel registration:', error);
        throw error;
    }
}

/**
 * Main test function
 */
async function runHotelRegistrationTest() {
    console.log('Starting Test Case FTC-6: Hotel Owner Registration');

    try {
        // Step 1: Connect wallet
        const { account, provider } = await connectWalletAsHotelOwner();

        // Step 2: Access registration form
        await accessHotelRegistrationForm();

        // Step 3: Fill hotel details
        const hotelData = await fillHotelDetails();

        // Step 4: Upload images
        const ipfsHashes = await uploadHotelImages();

        // Step 5: Submit registration
        const { hotelId, transactionHash } = await submitRegistrationAndPayGas(
            account,
            provider,
            hotelData,
            ipfsHashes
        );

        // Step 6: Check registration
        await checkHotelRegistration(provider, hotelId, transactionHash);

        console.log('Test Case FTC-6 completed successfully!');
        return true;
    } catch (error) {
        console.error('Test Case FTC-6 failed:', error);
        return false;
    }
}

// Export the test function for use in test runners
export default runHotelRegistrationTest;

// If running directly, execute the test
if (typeof window !== 'undefined' && window.runTest) {
    runHotelRegistrationTest()
        .then(success => console.log(`Test ${success ? 'passed' : 'failed'}`))
        .catch(error => console.error('Test execution error:', error));
} 