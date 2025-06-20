import { useState, useEffect, useCallback } from 'react';
import WalletConnect from './WalletConnect';
import WalletDetails from './WalletDetails';
import { IoPersonCircle, IoWallet, IoChevronDown, IoLogOut, IoLogoGoogle } from 'react-icons/io5';
import { hooks, metaMask } from '../utils/web3Config';
import { formatAddress } from '../utils/web3';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useAuth } from '../contexts/FirebaseContext';
import Image from 'next/image';

export default function ConnectWalletButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { useAccount, useIsActive } = hooks;
  const account = useAccount();
  const isActive = useIsActive();
  const { user, logOut } = useAuth();

  // Close modal when wallet is connected or user is signed in
  useEffect(() => {
    if ((isActive && account) || user) {
      setIsModalOpen(false);
    }
  }, [isActive, account, user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.wallet-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Clear error when dropdown closes
  useEffect(() => {
    if (!isDropdownOpen) {
      setError(null);
    }
  }, [isDropdownOpen]);

  const handleConnectMetaMask = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConnectingMetaMask) return;

    try {
      setIsConnectingMetaMask(true);
      setError(null);

      // Check if MetaMask is installed
      if (typeof window === 'undefined' || !window.ethereum || !window.ethereum.isMetaMask) {
        window.open('https://metamask.io/download/', '_blank');
        throw new Error('Please install MetaMask first. A new tab has been opened for you to download it.');
      }

      // Try to activate MetaMask
      await metaMask.activate();
      
      // Wait for connection to be established
      const connected = await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 10000); // 10 second timeout
        
        const checkConnection = setInterval(() => {
          const provider = metaMask.provider as { selectedAddress?: string } | undefined;
          if (provider?.selectedAddress) {
            clearTimeout(timeout);
            clearInterval(checkConnection);
            resolve(true);
          }
        }, 100);
      });

      if (!connected) {
        throw new Error('Connection timeout. Please try again.');
      }

      console.log('Successfully connected to MetaMask');
    } catch (error: any) {
      console.error('Failed to connect MetaMask:', error);
      setError(error.message || 'Failed to connect MetaMask');
    } finally {
      setIsConnectingMetaMask(false);
    }
  };

  const handleDisconnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisconnecting) return;

    try {
      setIsDisconnecting(true);
      
      // Handle Web3 wallet disconnect
      if (metaMask.deactivate) {
        await metaMask.deactivate();
      } else if (metaMask.resetState) {
        metaMask.resetState();
      }

      // Handle Google sign out
      if (user) {
        await logOut();
      }

      setIsDropdownOpen(false);
      // Force page reload to clear any cached provider state
      window.location.reload();
    } catch (error) {
      console.error('Error disconnecting:', error);
      setIsDisconnecting(false);
    }
  };

  const handleModalOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    if (!isActive && !user) {
      setIsModalOpen(false);
    }
  }, [isActive, user]);

  // If user is signed in with Google or wallet is connected, show the user info
  if (user || (isActive && account)) {
    const isGoogleUser = !!user;
    const displayName = user?.displayName || user?.email || formatAddress(account || '');
    const hasMetaMask = isActive && account;
    
    return (
      <div className="relative wallet-dropdown">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          {isGoogleUser ? (
            user?.photoURL ? (
              <div className="w-5 h-5 rounded-full overflow-hidden">
                <Image
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  width={20}
                  height={20}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <IoLogoGoogle className="w-5 h-5" />
            )
          ) : (
            <IoWallet className="w-5 h-5" />
          )}
          <span className="font-medium max-w-[150px] truncate">{displayName}</span>
          <IoChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-80 py-2 bg-[#1E293B] rounded-lg shadow-xl border border-gray-700">
            <div className="px-4 py-2">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                  {error}
                </div>
              )}
              
              {isGoogleUser ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    {user.photoURL ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <IoLogoGoogle className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-white">{user.displayName || 'Google User'}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </div>
                  
                  {/* Show MetaMask connection status */}
                  <div 
                    className={`mb-4 p-3 rounded-xl bg-gray-800 border border-gray-700 ${!hasMetaMask ? 'cursor-pointer hover:bg-gray-700 transition-colors' : ''}`}
                    onClick={!hasMetaMask ? handleConnectMetaMask : undefined}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Image
                        src="/metamask-fox.svg"
                        alt="MetaMask"
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                      <span className="text-sm font-medium text-white">MetaMask Status</span>
                    </div>
                    {hasMetaMask ? (
                      <div className="flex items-center gap-2 text-sm text-green-400">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        Connected: {formatAddress(account || '')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-yellow-400">
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        {isConnectingMetaMask ? 'Connecting...' : 'Not connected - Click here to connect'}
                        {!window.ethereum?.isMetaMask && (
                          <span className="block text-xs mt-1 text-gray-400">
                            MetaMask not detected. Click to install.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <WalletDetails />
              )}
            </div>
            <div className="border-t border-gray-700 mt-2">
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className={`w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 flex items-center gap-2 ${isDisconnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <IoLogOut className="w-5 h-5" />
                {isDisconnecting ? 'Disconnecting...' : 'Sign Out'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If not signed in, show the sign in button
  return (
    <>
      <button
        onClick={handleModalOpen}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <IoPersonCircle className="w-5 h-5" />
        Sign In
      </button>

      <WalletConnect
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </>
  );
} 