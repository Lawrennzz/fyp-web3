import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { IoWallet, IoGlobe, IoInformation, IoWarning, IoLogOut, IoMail, IoPerson, IoAdd } from 'react-icons/io5';
import { config } from '../config';
import { hooks, metaMask } from '../utils/web3Config';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { useAuth } from '../contexts/FirebaseContext';
import Image from 'next/image';

interface WalletDetailsProps {
  onClose?: () => void;
}

export default function WalletDetails({ onClose }: WalletDetailsProps) {
  const { useAccount, useProvider, useIsActive } = hooks;
  const account = useAccount();
  const provider = useProvider();
  const isActive = useIsActive();
  const { walletAddress, disconnectWallet, connectWallet } = useWalletConnect();
  const { user, logOut } = useAuth();
  const { connector } = useWeb3React();
  
  const [balance, setBalance] = useState<string>('0');
  const [network, setNetwork] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState(false);
  const isGuest = localStorage.getItem('isGuest') === 'true';
  const isGoogleOnly = localStorage.getItem('lastProvider') === 'google' && !account;
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Handle chain changes
  const handleChainChanged = useCallback(() => {
    // Force reload on chain change
    window.location.reload();
  }, []);

  // Handle account changes
  const handleAccountsChanged = useCallback(() => {
    // Force reload on account change
    window.location.reload();
  }, []);

  const handleConnectMetaMask = async () => {
    setIsConnectingMetaMask(true);
    try {
      // First activate MetaMask
      await metaMask.activate();
      
      // Wait for account to be available
      const accounts = await metaMask.provider?.request({ method: 'eth_requestAccounts' }) as string[];
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Then connect wallet
      await connectWallet('metamask');
      setError(null);

      // Force a refresh of the page to update all states
      window.location.reload();
    } catch (err: any) {
      console.error('MetaMask connection error:', err);
      if (err.code === 4001) {
        setError('Please accept the connection request in MetaMask');
      } else {
        setError(err.message || 'Failed to connect to MetaMask');
      }
    }
    setIsConnectingMetaMask(false);
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      // Disconnect MetaMask if connected
      if (connector?.deactivate) {
        await connector.deactivate();
      }
      
      // Disconnect Google if connected
      if (user) {
        await logOut();
      }
      
      // Clear guest session if active
      if (isGuest) {
        localStorage.removeItem('isGuest');
      }
      
      // Clear provider info
      localStorage.removeItem('lastProvider');
      localStorage.setItem('isDisconnected', 'true');
      
      // Close panel if callback provided
      if (onClose) onClose();
      
      // Force a refresh of the page to update all states
      window.location.reload();
    } catch (err) {
      setError('Failed to disconnect');
      console.error(err);
    }
    setIsDisconnecting(false);
  };

  useEffect(() => {
    const fetchWalletDetails = async () => {
      if (account && provider) {
        try {
          const balance = await provider.getBalance(account);
          setBalance(ethers.utils.formatEther(balance));
          const network = await provider.getNetwork();
          setNetwork(network.name);
          setError(null);
        } catch (err) {
          setError('Failed to fetch wallet details');
          console.error(err);
        }
      }
      setIsLoading(false);
    };

    fetchWalletDetails();
  }, [account, provider]);

  if (isLoading) {
    return (
      <div className="bg-[#1E293B] rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-6 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  const getDisconnectButtonText = () => {
    if (isGuest) return 'Disconnect Guest Session';
    if (account && user) return 'Disconnect All';
    if (account) return 'Disconnect MetaMask';
    if (user) return 'Disconnect Google Account';
    return 'Disconnect';
  };

  // Show MetaMask details first if connected
  if (account) {
    return (
      <div className="bg-[#1E293B] rounded-lg p-6 space-y-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <IoInformation className="w-5 h-5" />
            Wallet Details
          </h3>
          <Image
            src="/metamask-fox.svg"
            alt="MetaMask"
            width={24}
            height={24}
            className="opacity-50"
          />
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-3 flex items-center gap-2 text-red-200">
            <IoWarning className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <IoWallet className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-gray-400 text-sm">Balance</p>
            <p className="text-white font-medium">
              {parseFloat(balance).toFixed(4)} ETH
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <IoGlobe className={`w-5 h-5 ${error ? 'text-red-400' : 'text-green-400'}`} />
          <div>
            <p className="text-gray-400 text-sm">Network</p>
            <p className={`font-medium capitalize ${error ? 'text-red-400' : 'text-white'}`}>
              {network}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <p className="text-gray-400 text-sm">Wallet Address</p>
          <p className="text-white font-mono text-sm break-all">
            {account}
          </p>
        </div>

        {/* Show Google account details if also connected */}
        {user && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/google-icon.svg"
                alt="Google"
                width={20}
                height={20}
              />
              <h4 className="text-lg font-semibold text-white">Google Account</h4>
            </div>

            <div className="flex items-center gap-3">
              <IoMail className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white font-medium">{user.email}</p>
              </div>
            </div>

            {user.displayName && (
              <div className="flex items-center gap-3 mt-3">
                <IoPerson className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-gray-400 text-sm">Name</p>
                  <p className="text-white font-medium">{user.displayName}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDisconnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-500"></div>
              <span>Disconnecting...</span>
            </>
          ) : (
            <>
              <IoLogOut className="w-5 h-5" />
              <span>{getDisconnectButtonText()}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Show Google or Guest details if no MetaMask
  return (
    <div className="bg-[#1E293B] rounded-lg p-6 space-y-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <IoInformation className="w-5 h-5" />
          {isGuest ? 'Guest Session' : 'Google Account'}
        </h3>
        {user && (
          <Image
            src="/google-icon.svg"
            alt="Google"
            width={24}
            height={24}
            className="opacity-50"
          />
        )}
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-3 flex items-center gap-2 text-red-200">
          <IoWarning className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {user && (
        <>
          <div className="flex items-center gap-3">
            <IoMail className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">Email</p>
              <p className="text-white font-medium">{user.email}</p>
            </div>
          </div>

          {user.displayName && (
            <div className="flex items-center gap-3">
              <IoPerson className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Name</p>
                <p className="text-white font-medium">{user.displayName}</p>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-700">
            <p className="text-gray-400 text-sm">User ID</p>
            <p className="text-white font-mono text-sm break-all">{user.uid}</p>
          </div>
        </>
      )}

      {isGuest && (
        <>
          <div className="flex items-center gap-3">
            <IoPerson className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">Session Type</p>
              <p className="text-white font-medium">Temporary Guest</p>
            </div>
          </div>

          <div className="bg-yellow-900/50 border border-yellow-500/50 rounded-lg p-3 flex items-center gap-2 text-yellow-200 mt-4">
            <IoWarning className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Guest sessions are temporary and will be lost when you disconnect or close the browser.</p>
          </div>
        </>
      )}

      {/* Add MetaMask connection option for Google users */}
      {user && !account && (
        <div className="pt-4">
          <button
            onClick={handleConnectMetaMask}
            disabled={isConnectingMetaMask}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#2d2d2d] hover:bg-[#333333] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnectingMetaMask ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span className="text-white">Connecting MetaMask...</span>
              </>
            ) : (
              <>
                <IoAdd className="w-5 h-5 text-white" />
                <Image
                  src="/metamask-fox.svg"
                  alt="MetaMask"
                  width={20}
                  height={20}
                />
                <span className="text-white">Connect MetaMask</span>
              </>
            )}
          </button>
        </div>
      )}

      <button
        onClick={handleDisconnect}
        disabled={isDisconnecting}
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDisconnecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-500"></div>
            <span>Disconnecting...</span>
          </>
        ) : (
          <>
            <IoLogOut className="w-5 h-5" />
            <span>{getDisconnectButtonText()}</span>
          </>
        )}
      </button>
    </div>
  );
} 