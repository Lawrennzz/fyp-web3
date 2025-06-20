import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { config } from '../config';
import { switchToGanacheNetwork } from '../utils/web3';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../config/firebase';

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
}

export const useWalletConnect = (): UseWalletConnectReturn => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      return localStorage.getItem('walletAddress');
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
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            
            if (network.chainId === config.NETWORK_ID) {
              setWalletAddress(accounts[0]);
              localStorage.setItem('walletAddress', accounts[0]);
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
                throw new Error('Failed to switch to the Ganache network. Please try again or switch manually in MetaMask.');
              }
            }

            updateWalletState(accounts[0], null);
            console.log('Successfully connected to MetaMask');
          } catch (requestError: any) {
            if (requestError.code === 4001) {
              throw new Error('Please accept the connection request in your MetaMask extension.');
            }
            throw requestError;
          }
          break;
        }

        case 'coinbase':
          // Implement Coinbase Wallet connection
          throw new Error('Coinbase Wallet connection not implemented yet');

        case 'social':
          // Implement social login
          throw new Error('Social login not implemented yet');

        case 'email':
          // Implement email login
          if (!payload?.email) {
            throw new Error('Email is required');
          }
          // Add your email login logic here
          break;

        case 'phone':
          // Implement phone login
          throw new Error('Phone login not implemented yet');

        case 'passkey':
          // Implement passkey login
          throw new Error('Passkey login not implemented yet');

        case 'guest':
          // Implement guest login
          setWalletAddress('guest');
          break;

        case 'google':
          try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            if (result.user) {
              setWalletAddress(result.user.uid);
              localStorage.setItem('walletAddress', result.user.uid);
            } else {
              throw new Error('Failed to sign in with Google');
            }
          } catch (error) {
            console.error('Google sign in error:', error);
            throw error;
          }
          break;

        default:
          throw new Error('Unknown provider');
      }
    } catch (err) {
      console.error('Connection error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      console.error('Error details:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, updateWalletState]);

  const disconnectWallet = useCallback(async () => {
    try {
      const ethereum = window?.ethereum;
      if (ethereum) {
        // Clear any cached permissions
        await ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        }).catch(console.error); // Ignore if not supported

        // Remove event listeners using the same handler functions
        ethereum.removeListener('chainChanged', handleChainChanged);
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
      
      // Clear local state
      setWalletAddress(null);
      localStorage.removeItem('walletAddress');
      setError(null);
      
      // Force page reload to clear any cached provider state
      window.location.reload();
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet';
      setError(errorMessage);
      throw err;
    }
  }, [handleChainChanged, handleAccountsChanged]);

  return {
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    walletAddress,
  };
}; 