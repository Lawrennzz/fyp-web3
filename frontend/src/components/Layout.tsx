import React, { ReactNode, useEffect, useState } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { metaMask } from '../utils/web3Config';
import Link from 'next/link';
import Image from 'next/image';
import ConnectWalletButton from './ConnectWalletButton';
import BackendStatus from './BackendStatus';
import WalletDetails from './WalletDetails';
import { useAuth } from '../contexts/FirebaseContext';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { useRouter } from 'next/router';
import { hooks } from '../utils/web3Config';
import ConnectWalletModal from './ConnectWalletModal';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { useAccount, useIsActive } = hooks;
  const account = useAccount();
  const isActive = useIsActive();
  const { user } = useAuth();
  const { walletAddress } = useWalletConnect();
  const isGoogleUser = user && localStorage.getItem('lastProvider') === 'google';
  const isGuest = localStorage.getItem('isGuest') === 'true';
  const isMetaMaskConnected = isActive && account;
  const isConnected = isMetaMaskConnected || !!walletAddress || isGoogleUser || isGuest;
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Create modal root on mount if it doesn't exist
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let modalRoot = document.getElementById('modal-root');
      if (!modalRoot) {
        modalRoot = document.createElement('div');
        modalRoot.id = 'modal-root';
        modalRoot.className = 'relative z-50';
        document.body.appendChild(modalRoot);
      }
    }
  }, []);

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const walletDetails = document.getElementById('wallet-details');
      const connectModal = document.getElementById('connect-modal');
      
      if (walletDetails && !walletDetails.contains(target) && 
          !target.closest('.wallet-button')) {
        setShowWalletDetails(false);
      }
      
      if (connectModal && !connectModal.contains(target) && 
          !target.closest('.connect-button')) {
        setShowConnectModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayAddress = () => {
    if (isMetaMaskConnected && account) {
      return `${account.slice(0, 6)}...${account.slice(-4)}`;
    }
    if (user) {
      return user.email?.split('@')[0] || 'User';
    }
    if (isGuest) {
      return 'Guest';
    }
    return null;
  };

  const getAccountIcon = () => {
    if (isMetaMaskConnected) {
      return (
        <Image
          src="/metamask-fox.svg"
          alt="MetaMask"
          width={24}
          height={24}
          className="mr-2"
        />
      );
    }
    if (user) {
      return (
        <Image
          src="/google-icon.svg"
          alt="Google"
          width={24}
          height={24}
          className="mr-2"
        />
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <nav className="bg-[#1E293B] border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-500 hover:text-blue-400 transition-colors">
                Travel.go
              </Link>
              <div className="hidden md:block ml-10">
                <div className="flex items-center space-x-4">
                  <Link
                    href="/"
                    className={`${
                      router.pathname === '/'
                        ? 'text-white'
                        : 'text-gray-300 hover:text-white'
                    } px-3 py-2 rounded-md text-sm font-medium transition-colors`}
                  >
                    Home
                  </Link>
                  <Link
                    href="/hotels"
                    className={`${
                      router.pathname.startsWith('/hotels')
                        ? 'text-white'
                        : 'text-gray-300 hover:text-white'
                    } px-3 py-2 rounded-md text-sm font-medium transition-colors`}
                  >
                    Hotels
                  </Link>
                  <Link
                    href="/bookings"
                    className={`${
                      router.pathname.startsWith('/bookings')
                        ? 'text-white'
                        : 'text-gray-300 hover:text-white'
                    } px-3 py-2 rounded-md text-sm font-medium transition-colors`}
                  >
                    My Bookings
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center relative">
              {getDisplayAddress() ? (
                <button
                  onClick={() => setShowWalletDetails(!showWalletDetails)}
                  className="wallet-button flex items-center px-4 py-2 text-sm font-medium text-white bg-[#2a2b2f] hover:bg-[#2f3033] rounded-xl transition-colors relative"
                >
                  {getAccountIcon()}
                  {getDisplayAddress()}
                </button>
              ) : (
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="connect-button flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                >
                  Connect Wallet
                </button>
              )}
              {showWalletDetails && (
                <div id="wallet-details" className="absolute top-12 right-0 mt-2 z-50 w-96 shadow-xl">
                  <WalletDetails onClose={() => setShowWalletDetails(false)} />
                </div>
              )}
              {showConnectModal && (
                <div id="connect-modal">
                  <ConnectWalletModal onClose={() => setShowConnectModal(false)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
} 