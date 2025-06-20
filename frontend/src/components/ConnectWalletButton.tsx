import { useState, useCallback } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { metaMask } from '../utils/web3Config';
import Image from 'next/image';
import WalletConnect from './WalletConnect';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { useAuth } from '../contexts/FirebaseContext';

interface ConnectWalletButtonProps {
  onClick?: () => void;
}

export default function ConnectWalletButton({ onClick }: ConnectWalletButtonProps) {
  const { connector, account } = useWeb3React<Web3Provider>();
  const { walletAddress, disconnectWallet } = useWalletConnect();
  const { user, logOut } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isGoogleUser = user && localStorage.getItem('lastProvider') === 'google';
  const isGuest = localStorage.getItem('isGuest') === 'true';

  const handleDisconnect = useCallback(async () => {
    try {
      // Disconnect Web3React if connected
      if (connector?.deactivate) {
        await connector.deactivate();
      } else if (connector?.resetState) {
        connector.resetState();
      }

      // Disconnect custom wallet if connected
      if (walletAddress) {
        await disconnectWallet();
      }

      // Sign out from Firebase if logged in
      if (user) {
        await logOut();
      }

      // Clear all local storage
      localStorage.clear();

      // Force reload to clear all states
      window.location.reload();
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, [connector, walletAddress, disconnectWallet, user, logOut]);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleButtonClick = useCallback(() => {
    if (account || walletAddress || isGoogleUser || isGuest) {
      onClick?.();
    } else {
      handleOpenModal();
    }
  }, [account, walletAddress, isGoogleUser, isGuest, onClick, handleOpenModal]);

  const formatAddress = (address: string) => {
    if (!address) return 'Connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Show connected state if any type of connection exists
  if (account || walletAddress || isGoogleUser || isGuest) {
    let displayText = 'Connected';
    
    if (isGuest) {
      displayText = 'Guest';
    } else if (isGoogleUser && user?.email) {
      displayText = user.email.split('@')[0]; // Show username part of email
    } else if (account) {
      displayText = formatAddress(account);
    } else if (walletAddress) {
      displayText = formatAddress(walletAddress);
    }
    
    return (
      <div className="relative">
        <button
          onClick={handleButtonClick}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] hover:bg-[#2D3B4F] rounded-lg transition-colors"
        >
          <span className="text-white">{displayText}</span>
          {account && (
            <Image
              src="/metamask-fox.svg"
              alt="MetaMask"
              width={20}
              height={20}
            />
          )}
          {isGoogleUser && (
            <Image
              src="/google-icon.svg"
              alt="Google"
              width={20}
              height={20}
            />
          )}
          {isGuest && (
            <div className="w-5 h-5 flex items-center justify-center text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleButtonClick}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2 text-white"
      >
        <span>Connect Wallet</span>
      </button>
      
      <WalletConnect 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
} 