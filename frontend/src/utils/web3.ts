import { ethers } from 'ethers';
import { config } from '../config';
import HotelBookingABI from '../contracts/HotelBooking.json';
import USDTTokenABI from '../contracts/TestUSDT.json';

export const getWeb3Provider = () => {
  if (typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined') {
    return new ethers.providers.Web3Provider((window as any).ethereum);
  }
  return new ethers.providers.JsonRpcProvider(config.RPC_URL);
};

export const getHotelBookingContract = async (signer?: ethers.Signer) => {
  const provider = getWeb3Provider();
  const contract = new ethers.Contract(
    config.HOTEL_BOOKING_CONTRACT,
    HotelBookingABI,
    signer || provider
  );
  return contract;
};

export const getUSDTContract = async (signer?: ethers.Signer) => {
  const provider = getWeb3Provider();
  const contract = new ethers.Contract(
    config.USDT_CONTRACT,
    USDTTokenABI,
    signer || provider
  );
  return contract;
};

export const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const calculateTotalPrice = (pricePerNight: number, checkIn: Date, checkOut: Date) => {
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  return pricePerNight * nights;
};

export const isValidBookingDates = (checkIn: Date, checkOut: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    checkIn >= today &&
    checkOut > checkIn &&
    nights >= config.MIN_BOOKING_DAYS &&
    nights <= config.MAX_BOOKING_DAYS
  );
};

export const connectWallet = async () => {
  if (typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined') {
    try {
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const provider = getWeb3Provider();
      const network = await provider.getNetwork();
      
      if (network.chainId !== config.NETWORK_ID) {
        throw new Error('Please connect to the correct network (Ganache)');
      }
      
      return provider;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  } else {
    throw new Error('Please install MetaMask to use this feature');
  }
}; 