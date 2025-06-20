import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { config } from '../config';
import { switchToGanacheNetwork } from '../utils/web3';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { hooks, metaMask } from '../utils/web3Config';
import { useAuth } from '../contexts/FirebaseContext';

// Add MetaMask Ethereum provider type
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (params: any) => void) => void;
      removeListener: (event: string, callback: (params: any) => void) => void;
      selectedAddress: string | null;
      chainId: string;
    };
  }
}

export type WalletProvider = 'metamask' | 'coinbase' | 'social' | 'email' | 'phone' | 'passkey' | 'guest' | 'google';

interface UseWalletConnectReturn {
  isConnecting: boolean;
  error: string | null;
  connectWallet: (provider: WalletProvider, payload?: any) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  walletAddress: string | null;
  connectAsGuest: () => Promise<void>;
}

export function useWalletConnect(): UseWalletConnectReturn {
  const { connector } = useWeb3React<Web3Provider>();
  const { useAccount, useIsActive } = hooks;
  const account = useAccount();
  const isActive = useIsActive();
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const storedAddress = localStorage.getItem('walletAddress');
      const isGuest = localStorage.getItem('isGuest') === 'true';
      const guestId = localStorage.getItem('guestId');
      
      // If it's a guest session, verify we have a valid guest ID
      if (isGuest && guestId) {
        return guestId;
      }
      // For non-guest sessions, return the stored address
      else if (!isGuest && storedAddress) {
        return storedAddress;
      }
      
      // Clear invalid states
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('isGuest');
      localStorage.removeItem('guestId');
      return null;
    }
    return null;
  });

  // Batch update state function to reduce re-renders
  const updateWalletState = useCallback((address: string | null, errorMsg: string | null = null) => {
    setWalletAddress(address);
    setError(errorMsg);
    if (address) {
      localStorage.setItem('walletAddress', address);
    } else {
      localStorage.removeItem('walletAddress');
    }
  }, []);

  // Handle chain changes
  const handleChainChanged = useCallback((chainId: string) => {
    const newChainId = parseInt(chainId, 16);
    if (newChainId !== config.NETWORK_ID) {
      updateWalletState(null, 'Please switch back to the Ganache network in MetaMask.');
    } else {
      updateWalletState(walletAddress, null);
    }
  }, [updateWalletState, walletAddress]);

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      updateWalletState(null, 'Please unlock your MetaMask extension.');
    } else {
      updateWalletState(accounts[0], null);
    }
  }, [updateWalletState]);

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      // Check if we're in a disconnected state
      const isDisconnected = localStorage.getItem('isDisconnected') === 'true';
      if (isDisconnected) {
        return;
      }

      // Check for guest session first
      const isGuest = localStorage.getItem('isGuest') === 'true';
      const guestId = localStorage.getItem('guestId');
      if (isGuest && guestId) {
        setWalletAddress(guestId);
        return;
      }

      // Then check for MetaMask connection
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            
            if (network.chainId === config.NETWORK_ID) {
              setWalletAddress(accounts[0]);
              localStorage.setItem('walletAddress', accounts[0]);
              localStorage.setItem('lastProvider', 'metamask');
              
              // Activate MetaMask connector
              await metaMask.connectEagerly();
            } else {
              setError('Please switch to the Ganache network in MetaMask.');
            }
          }
        } catch (error) {
          console.error('Error checking existing connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  // Set up event listeners
  useEffect(() => {
    const ethereum = window?.ethereum;
    if (typeof window !== 'undefined' && ethereum) {
      ethereum.on('chainChanged', handleChainChanged);
      ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        ethereum.removeListener('chainChanged', handleChainChanged);
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [handleChainChanged, handleAccountsChanged]);

  const connectWallet = useCallback(async (provider: WalletProvider, payload?: any) => {
    if (isConnecting) return; // Prevent multiple connection attempts
    
    try {
      setIsConnecting(true);
      setError(null);
      
      // Clear disconnected state
      localStorage.removeItem('isDisconnected');

      switch (provider) {
        case 'metamask': {
          console.log('Attempting to connect to MetaMask...');
          
          // Check if MetaMask is installed
          if (typeof window === 'undefined' || !window.ethereum) {
            if (payload?.type === 'mobile') {
              console.log('Mobile connection - skipping ethereum check');
              return;
            }
            throw new Error('MetaMask is not installed. Please install the MetaMask Chrome extension to continue.');
          }

          // Check if it's actually MetaMask
          if (!window.ethereum.isMetaMask) {
            throw new Error('Please use the MetaMask Chrome extension as your wallet provider.');
          }

          console.log('Requesting account access...');
          try {
            // Activate MetaMask connector
            await metaMask.activate();

            // Request account access
            const accounts = await window.ethereum.request({ 
              method: 'eth_requestAccounts' 
            });

            if (!accounts || accounts.length === 0) {
              throw new Error('No accounts found. Please make sure your MetaMask extension is unlocked.');
            }

            // Get the provider and check network in parallel
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();

            if (network.chainId !== config.NETWORK_ID) {
              await switchToGanacheNetwork();
              const updatedNetwork = await provider.getNetwork();
              if (updatedNetwork.chainId !== config.NETWORK_ID) {
                throw new Error('Please switch to the Ganache network in MetaMask.');
              }
            }

            // Update state and localStorage
            updateWalletState(accounts[0], null);
            localStorage.setItem('lastProvider', 'metamask');
            console.log('Successfully connected to MetaMask:', accounts[0]);
          } catch (error: any) {
            console.error('MetaMask connection error:', error);
            throw error;
          }
          break;
        }
        case 'google': {
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          if (result.user) {
            localStorage.setItem('lastProvider', 'google');
          }
          break;
        }
        case 'guest': {
          // Generate a random guest ID
          const guestId = Math.random().toString(36).substring(2, 15);
          
          // Store guest info in localStorage
          localStorage.setItem('isGuest', 'true');
          localStorage.setItem('guestId', guestId);
          localStorage.setItem('lastProvider', 'guest');
          
          // Update state
          updateWalletState(guestId, null);
          break;
        }
        default:
          throw new Error('Unsupported wallet provider');
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, updateWalletState]);

  const disconnectWallet = useCallback(async () => {
    try {
      if (connector?.deactivate) {
        await connector.deactivate();
      }
      
      // Clear all connection states
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('lastProvider');
      localStorage.removeItem('isGuest');
      localStorage.removeItem('guestId');
      localStorage.setItem('isDisconnected', 'true');
      
      // Reset states
      setWalletAddress(null);
      setError(null);
      
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
      throw err;
    }
  }, [connector]);

  const connectAsGuest = useCallback(async () => {
    await connectWallet('guest');
  }, [connectWallet]);

  return {
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    walletAddress,
    connectAsGuest,
  };
} 