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
  connectWallet: (provider: WalletProvider, payload?: any) => Promise<void>;
  isConnecting: boolean;
  error: string | null;
  walletAddress: string | null;
}

export function useWalletConnect(): UseWalletConnectReturn {
  const { connector } = useWeb3React<Web3Provider>();
  const { useAccount, useIsActive } = hooks;
  const account = useAccount();
  const isActive = useIsActive();
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Initialize state on mount
  useEffect(() => {
    // Always start disconnected
    localStorage.setItem('isDisconnected', 'true');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('lastProvider');
    localStorage.removeItem('isGuest');
    localStorage.removeItem('guestId');

    // Deactivate any existing connection
    if (connector?.deactivate) {
      connector.deactivate();
    }
  }, []);

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
        case 'metamask':
          if (!window.ethereum?.isMetaMask) {
            throw new Error('MetaMask is not installed');
          }

          // Activate MetaMask
          await metaMask.activate();

          // Switch to correct network
          await switchToGanacheNetwork();

          // Get accounts
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts.length === 0) throw new Error('No accounts found');

          // Update state
          updateWalletState(accounts[0], null);
          localStorage.setItem('lastProvider', 'metamask');
          break;

        case 'google':
          const googleProvider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, googleProvider);
          if (!result.user) throw new Error('Failed to authenticate with Google');

          updateWalletState(result.user.uid, null);
          localStorage.setItem('lastProvider', 'google');
          break;

        case 'guest':
          const guestId = `guest_${Date.now()}`;
          updateWalletState(guestId, null);
          localStorage.setItem('lastProvider', 'guest');
          localStorage.setItem('isGuest', 'true');
          localStorage.setItem('guestId', guestId);
          break;

        default:
          throw new Error(`Unsupported wallet provider: ${provider}`);
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      updateWalletState(null, null);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, updateWalletState]);

  return {
    connectWallet,
    isConnecting,
    error,
    walletAddress
  };
}