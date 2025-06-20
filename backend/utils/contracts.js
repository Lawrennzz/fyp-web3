const { ethers } = require('ethers');
const HotelBookingABI = require('../../contracts/artifacts/contracts/HotelBooking.sol/HotelBooking.json').abi;

// Get provider based on environment
const getProvider = () => {
  if (process.env.NODE_ENV === 'production') {
    return new ethers.providers.JsonRpcProvider(process.env.INFURA_URL);
  }
  // For local development
  return new ethers.providers.JsonRpcProvider('http://localhost:8545');
};

// Get signer for contract interactions
const getSigner = () => {
  const provider = getProvider();
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  return wallet;
};

// Get HotelBooking contract instance
const getHotelBookingContract = async () => {
  const signer = getSigner();
  const contract = new ethers.Contract(
    process.env.HOTEL_BOOKING_CONTRACT_ADDRESS,
    HotelBookingABI,
    signer
  );
  return contract;
};

module.exports = {
  getProvider,
  getSigner,
  getHotelBookingContract
}; 