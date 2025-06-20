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

export const switchToGanacheNetwork = async () => {
  if (typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined') {
    try {
      // First, try to switch to the network
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${Number(config.NETWORK_ID).toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Add the network if it doesn't exist
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${Number(config.NETWORK_ID).toString(16)}`,
                chainName: 'Ganache',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: config.CHAIN_SYMBOL,
                  decimals: config.CHAIN_DECIMALS,
                },
                rpcUrls: ['http://127.0.0.1:7545'],
              },
            ],
          });

          // Try switching again after adding
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${Number(config.NETWORK_ID).toString(16)}` }],
          });
        } catch (addError) {
          console.error('Error adding Ganache network:', addError);
          throw new Error('Failed to add Ganache network to MetaMask. Please make sure Ganache is running on http://127.0.0.1:7545');
        }
      } else {
        console.error('Error switching to Ganache network:', switchError);
        throw new Error('Failed to switch to Ganache network. Please make sure Ganache is running.');
      }
    }
  }
};

export const getHotelBookingContract = async (signer?: ethers.Signer) => {
  const provider = getWeb3Provider();
  const contract = new ethers.Contract(
    config.HOTEL_BOOKING_CONTRACT,
    HotelBookingABI.abi,
    signer || provider
  );
  return contract;
};

export const getUSDTContract = async (signer?: ethers.Signer) => {
  const provider = getWeb3Provider();
  const contract = new ethers.Contract(
    config.USDT_CONTRACT,
    USDTTokenABI.abi,
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
      // Request account access
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please make sure your MetaMask is unlocked.');
      }

      // Get the provider
      const provider = getWeb3Provider();
      
      // Check if we're on the correct network
      const network = await provider.getNetwork();
      if (network.chainId !== config.NETWORK_ID) {
        // Switch to the correct network
        await switchToGanacheNetwork();
      }
      
      return provider;
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        throw new Error('Please accept the connection request in MetaMask.');
      }
      throw error;
    }
  } else {
    throw new Error('Please install MetaMask to use this feature');
  }
}; 