import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { IoWallet, IoGlobe, IoInformation, IoWarning, IoLogOut, IoMail, IoPerson } from 'react-icons/io5';
import { hooks } from '../utils/web3Config';
import { useAuth } from '../contexts/FirebaseContext';
import Image from 'next/image';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { config } from '../config';

interface WalletDetailsProps {
  onClose?: () => void;
}

// Extend the Window interface to include ethereum
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

export default function WalletDetails({ onClose }: WalletDetailsProps) {
  const { connector } = useWeb3React<Web3Provider>();
  const { useAccount, useIsActive } = hooks;
  const account = useAccount();
  const isActive = useIsActive();
  const { user, logOut } = useAuth();
  const { connectWallet, isConnecting } = useWalletConnect();
  
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [lastProvider, setLastProvider] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);

  // Update lastProvider and guest state when localStorage changes
  useEffect(() => {
    const updateAuthState = () => {
      const provider = localStorage.getItem('lastProvider');
      const guestStatus = localStorage.getItem('isGuest') === 'true';
      const guestSessionId = localStorage.getItem('guestId');
      
      setLastProvider(provider);
      setIsGuest(guestStatus);
      setGuestId(guestSessionId);
    };

    // Initial load
    updateAuthState();

    // Listen for storage changes (in case of multiple tabs)
    window.addEventListener('storage', updateAuthState);

    return () => {
      window.removeEventListener('storage', updateAuthState);
    };
  }, []);

  // Re-check auth state when user state changes
  useEffect(() => {
    const provider = localStorage.getItem('lastProvider');
    const guestStatus = localStorage.getItem('isGuest') === 'true';
    const guestSessionId = localStorage.getItem('guestId');
    
    setLastProvider(provider);
    setIsGuest(guestStatus);
    setGuestId(guestSessionId);
    
    // Debug logging
    console.log('WalletDetails: Auth state changed', {
      user: !!user,
      userEmail: user?.email,
      lastProvider: provider,
      isGuest: guestStatus,
      guestId: guestSessionId,
      isEmailPrimary: provider === 'email' && user,
      isGooglePrimary: provider === 'google' && user,
      isGuestPrimary: guestStatus && !user && !account
    });

    // Force update when authentication is detected
    if ((provider === 'email' || provider === 'google') && user) {
      // Small delay to ensure auth state is fully settled
      setTimeout(() => {
        setIsLoading(false);
        // Force re-render by clearing and setting error state
        setError(null);
      }, 100);
    }
    
    // Also handle guest sessions
    if (guestStatus && !user && !account) {
      setIsLoading(false);
    }
  }, [user, account]);

  // Determine primary authentication method
  const isMetaMaskPrimary = lastProvider === 'metamask' || (!lastProvider && account);
  const isGooglePrimary = lastProvider === 'google' && user && !isMetaMaskPrimary;
  const isEmailPrimary = lastProvider === 'email' && user && !isMetaMaskPrimary;
  const isGuestPrimary = (isGuest && !user && !account) || (lastProvider === 'guest' && !user && !account);
  const hasMultipleConnections = account && user;

  // Debug logging for troubleshooting
  console.log('WalletDetails: State debug', {
    isGuest,
    guestId,
    user: !!user,
    account,
    lastProvider,
    isGuestPrimary,
    isMetaMaskPrimary,
    isGooglePrimary,
    isEmailPrimary,
    'localStorage.isGuest': localStorage.getItem('isGuest'),
    'localStorage.guestId': localStorage.getItem('guestId'),
    'localStorage.lastProvider': localStorage.getItem('lastProvider')
  });

  useEffect(() => {
    const fetchWalletDetails = async () => {
      if (!account || !window?.ethereum) {
        setIsLoading(false);
        return;
      }

      try {
        // Create a Web3Provider instance
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Get balance
        const balance = await web3Provider.getBalance(account);
        setBalance(ethers.utils.formatEther(balance));

        // Get network
        const network = await web3Provider.getNetwork();
        setNetwork(network.name === 'unknown' ? 'Ganache' : network.name);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching wallet details:', err);
        setError('Failed to fetch wallet details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletDetails();
  }, [account]);

  // Handle chain and account changes
  useEffect(() => {
    const ethereum = window?.ethereum;
    if (!ethereum) return;

    const handleChainChanged = () => {
      // Refresh wallet details instead of reloading
      setIsLoading(true);
    };

    const handleAccountsChanged = (accounts: string[]) => {
      // Refresh wallet details instead of reloading
      if (!accounts.length || (account && accounts[0].toLowerCase() !== account.toLowerCase())) {
        setIsLoading(true);
      }
    };

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
  }, [account]);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      if (connector?.deactivate) {
        await connector.deactivate();
      }
      if (user) {
        await logOut();
      }
      if (isGuest) {
        localStorage.removeItem('isGuest');
        localStorage.removeItem('guestId');
      }
      localStorage.removeItem('lastProvider');
      localStorage.setItem('isDisconnected', 'true');
      if (onClose) onClose();
      // Only reload after all disconnect operations are complete
      window.location.reload();
    } catch (err) {
      console.error('Error disconnecting:', err);
      setError('Failed to disconnect');
      setIsDisconnecting(false);
    }
  };

  // Handle MetaMask connection
  const handleConnectMetaMask = async () => {
    try {
      await connectWallet('metamask');
      // Refresh the component after connection
      window.location.reload();
    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
      setError('Failed to connect MetaMask. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#1a1b1f] rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1b1f] rounded-xl p-6 space-y-4 border border-gray-800">
      {/* Header with connection type icons */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <IoInformation className="w-5 h-5" />
          {isEmailPrimary ? 'Email Account' :
           isGooglePrimary ? 'Google Account' : 
           isGuestPrimary ? 'Guest Session' :
           account ? 'Wallet Details' : 'Account Details'}
        </h3>
        <div className="flex items-center gap-2">
          {account && (
            <Image
              src="/metamask-fox.svg"
              alt="MetaMask"
              width={24}
              height={24}
              className="opacity-80"
            />
          )}
          {user && (
            <div className="flex items-center gap-1">
              {isEmailPrimary && (
                <IoMail className="w-5 h-5 text-blue-400" />
              )}
              {isGooglePrimary && (
                <Image
                  src="/google-icon.svg"
                  alt="Google"
                  width={24}
                  height={24}
                  className="opacity-80"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-3 flex items-center gap-2 text-red-200">
          <IoWarning className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Google-Primary View */}
      {(isGooglePrimary || isEmailPrimary) && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <IoMail className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Email</p>
              <p className="text-white font-medium text-lg">{user.email}</p>
            </div>
          </div>

          {user.displayName && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <IoPerson className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Name</p>
                <p className="text-white font-medium text-lg">{user.displayName}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <IoInformation className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Authentication</p>
              <p className="text-white font-medium text-lg">
                {isEmailPrimary ? 'Email & Password' : 'Google OAuth'}
              </p>
            </div>
          </div>

          {/* MetaMask Connection Status */}
          {hasMultipleConnections && (
            <div className="bg-[#2a2b2f] rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src="/metamask-fox.svg"
                    alt="MetaMask"
                    width={24}
                    height={24}
                    className="opacity-80"
                  />
                  <div>
                    <p className="text-white font-medium">MetaMask Connected</p>
                    <p className="text-gray-400 text-sm">
                      {parseFloat(balance).toFixed(4)} ETH • {network}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFullDetails(!showFullDetails)}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-blue-500/10 transition-colors"
                >
                  <IoWallet className="w-4 h-4" />
                  {showFullDetails ? 'Hide' : 'View'} Details
                </button>
              </div>

              {/* Expandable Wallet Details */}
              {showFullDetails && account && (
                <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <IoWallet className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Balance</p>
                      <p className="text-white font-medium">
                        {parseFloat(balance).toFixed(4)} ETH
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <IoGlobe className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Network</p>
                      <p className="text-white font-medium capitalize">{network}</p>
                    </div>
                  </div>

                  <div className="bg-[#1a1b1f] rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Wallet Address</p>
                    <p className="text-white font-mono text-xs break-all">
                      {account}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No MetaMask Connection Hint */}
          {!hasMultipleConnections && !account && (
            <button
              onClick={handleConnectMetaMask}
              disabled={isConnecting}
              className="w-full bg-gray-800/30 hover:bg-gray-700/40 rounded-xl p-4 border border-gray-700/50 hover:border-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src="/metamask-fox.svg"
                    alt="MetaMask"
                    width={20}
                    height={20}
                    className={isConnecting ? "opacity-50" : "opacity-70"}
                  />
                  <div className="text-left">
                    <p className="text-gray-400 text-sm">
                      {isConnecting ? 'Connecting MetaMask...' : 'MetaMask not connected'}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {isConnecting ? 'Please check your MetaMask extension' : 'Click to connect MetaMask for Web3 features'}
                    </p>
                  </div>
                </div>
                {isConnecting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                ) : (
                  <div className="text-blue-400 text-sm font-medium">Connect</div>
                )}
              </div>
            </button>
          )}
        </div>
      )}

      {/* MetaMask-Primary View */}
      {isMetaMaskPrimary && account && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <IoWallet className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Balance</p>
              <p className="text-white font-medium text-lg">
                {parseFloat(balance).toFixed(4)} ETH
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <IoGlobe className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Network</p>
              <p className="text-white font-medium text-lg capitalize">
                {network}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <p className="text-gray-400 text-sm mb-2">Wallet Address</p>
            <p className="text-white font-mono text-sm break-all">
              {account}
            </p>
          </div>

          {/* Google Account Details for MetaMask Primary */}
          {user && (
            <div className="mt-6 pt-6 border-t border-gray-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <IoMail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white font-medium text-lg">{user.email}</p>
                </div>
              </div>

              {user.displayName && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <IoPerson className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Name</p>
                    <p className="text-white font-medium text-lg">{user.displayName}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Guest Session Details */}
      {isGuestPrimary && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <IoPerson className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Session Type</p>
              <p className="text-white font-medium text-lg">Temporary Guest</p>
            </div>
          </div>

          <div className="bg-amber-900/20 border border-amber-500/20 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 text-amber-200">
              <IoWarning className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">Guest sessions are temporary and will be lost when you disconnect or close the browser.</p>
            </div>
          </div>

          {guestId && (
            <div className="pt-4 border-t border-gray-800">
              <p className="text-gray-400 text-sm mb-2">User ID</p>
              <p className="text-white font-mono text-sm break-all">
                {guestId}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Fallback - No specific authentication detected */}
      {!isGuestPrimary && !isEmailPrimary && !isGooglePrimary && !isMetaMaskPrimary && (
        <div className="space-y-4">
          <div className="text-center text-gray-400 py-8">
            <IoInformation className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No Active Session</p>
            <p className="text-sm mt-2">Please connect a wallet or sign in to continue</p>
          </div>
        </div>
      )}

      <button
        onClick={handleDisconnect}
        disabled={isDisconnecting}
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDisconnecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-500"></div>
            <span>Disconnecting...</span>
          </>
        ) : (
          <>
            <IoLogOut className="w-5 h-5" />
            <span>
              {account && user
                ? 'Disconnect All'
                : account
                ? 'Disconnect MetaMask'
                : user
                ? 'Disconnect Google'
                : isGuest
                ? 'Disconnect Guest Session'
                : 'Disconnect'}
            </span>
          </>
        )}
      </button>
    </div>
  );
}