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
    // @ts-ignore
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

export type WalletProvider = 'metamask' | 'coinbase' | 'social' | 'email' | 'phone' | 'passkey' | 'google' | 'guest';

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
      const lastProvider = localStorage.getItem('lastProvider');
      const isDisconnected = localStorage.getItem('isDisconnected') === 'true';
      const isGuest = localStorage.getItem('isGuest') === 'true';
      const guestId = localStorage.getItem('guestId');
      
      // If user explicitly disconnected, clear everything
      if (isDisconnected) {
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('lastProvider');
        localStorage.removeItem('isGuest');
        localStorage.removeItem('guestId');
        return null;
      }
      
      // Check for guest session
      if (isGuest && guestId) {
        return guestId;
      }
      
      // Only keep wallet address if it's from a valid provider
      if (storedAddress && lastProvider && lastProvider !== 'guest') {
        return storedAddress;
      }
      
      // Clear invalid states
      if (!isGuest) {
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('isGuest');
        localStorage.removeItem('guestId');
      }
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
      // MetaMask disconnected - clear all session data
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('lastProvider');
      localStorage.removeItem('isGuest');
      localStorage.removeItem('guestId');
      localStorage.setItem('isDisconnected', 'true');
      
      updateWalletState(null, null);
      setError(null);
    } else {
      updateWalletState(accounts[0], null);
      localStorage.removeItem('isDisconnected');
    }
  }, [updateWalletState]);

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      // Check if we're in a disconnected state
      const isDisconnected = localStorage.getItem('isDisconnected') === 'true';
      if (isDisconnected) {
        // Don't auto-reconnect when user has explicitly disconnected
        return;
      }

      // Clean up any guest data
      localStorage.removeItem('isGuest');
      localStorage.removeItem('guestId');

      // Only auto-reconnect to MetaMask if user hasn't explicitly disconnected
      // and we have a stored provider preference
      const lastProvider = localStorage.getItem('lastProvider');
      if (lastProvider === 'metamask' && typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask) {
        try {
          // @ts-ignore
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            
            if (network.chainId === config.NETWORK_ID) {
              setWalletAddress(accounts[0]);
              localStorage.setItem('walletAddress', accounts[0]);
              
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
      // Clear guest provider preferences
      else if (lastProvider === 'guest') {
        localStorage.removeItem('lastProvider');
      }
    };

    checkConnection();
  }, []);

  // Set up event listeners
  useEffect(() => {
    const ethereum = window?.ethereum;
    if (typeof window !== 'undefined' && ethereum) {
      // @ts-ignore
      ethereum.on('chainChanged', handleChainChanged);
      // @ts-ignore
      ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        // @ts-ignore
        ethereum.removeListener('chainChanged', handleChainChanged);
        // @ts-ignore
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

          if (!window.ethereum.isMetaMask) {
            throw new Error('Please install MetaMask extension');
          }

          console.log('Requesting account access...');
          try {
            // Always request account access to ensure user sees MetaMask prompt
            // This is important when MetaMask is connected but user disconnected from app
            // @ts-ignore
            const accounts = await window.ethereum.request({ 
              method: 'eth_requestAccounts' 
            });

            if (!accounts || accounts.length === 0) {
              throw new Error('No accounts found. Please unlock MetaMask.');
            }

            // Activate MetaMask connector
            await metaMask.activate();

            // Get the provider and check network
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
            // Trigger a storage event to update other components
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'lastProvider',
              newValue: 'google'
            }));
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
          
          // Trigger storage events to update other components
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'lastProvider',
            newValue: 'guest'
          }));
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'isGuest',
            newValue: 'true'
          }));
          break;
        }
        case 'email': {
          // Email authentication using Firebase
          if (payload?.email && payload?.password) {
            const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth');
            
            try {
              // Try to sign in first
              const result = await signInWithEmailAndPassword(auth, payload.email, payload.password);
              localStorage.setItem('lastProvider', 'email');
              // Trigger a storage event to update other components
              window.dispatchEvent(new StorageEvent('storage', {
                key: 'lastProvider',
                newValue: 'email'
              }));
            } catch (error: any) {
              // If sign in fails, try to create account
              if (error.code === 'auth/user-not-found') {
                const result = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
                localStorage.setItem('lastProvider', 'email');
                // Trigger a storage event to update other components
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'lastProvider',
                  newValue: 'email'
                }));
              } else {
                throw error;
              }
            }
          } else {
            throw new Error('Email and password are required for email authentication');
          }
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
      
      // Clear all connection states including any guest data
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