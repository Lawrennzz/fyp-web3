import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { IoWallet, IoGlobe, IoInformation, IoWarning, IoLogOut, IoMail, IoPerson } from 'react-icons/io5';
import { hooks, metaMask } from '../utils/web3Config';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { useAuth } from '../contexts/FirebaseContext';
import Image from 'next/image';

interface WalletDetailsProps {
  onClose?: () => void;
}

// Extend the Window interface to include ethereum
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

export default function WalletDetails({ onClose }: WalletDetailsProps) {
  const { useAccount, useProvider, useIsActive, useChainId } = hooks;
  const account = useAccount();
  const provider = useProvider();
  const isActive = useIsActive();
  const chainId = useChainId();
  const { disconnectWallet } = useWalletConnect();
  const { user, logOut } = useAuth();
  const { connector } = useWeb3React();
  const isGuest = localStorage.getItem('isGuest') === 'true';
  const guestId = localStorage.getItem('guestId');
  
  const [balance, setBalance] = useState<string>('0');
  const [network, setNetwork] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

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
  }, [account, chainId]);

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

    ethereum.on('chainChanged', handleChainChanged);
    ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      ethereum.removeListener('chainChanged', handleChainChanged);
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
          {account ? 'Wallet Details' : user ? 'Google Account' : 'Guest Session'}
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
            <Image
              src="/google-icon.svg"
              alt="Google"
              width={24}
              height={24}
              className="opacity-80"
            />
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-3 flex items-center gap-2 text-red-200">
          <IoWarning className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* MetaMask Details */}
      {account && (
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
        </div>
      )}

      {/* Google Account Details */}
      {user && (
        <div className={`${account ? 'mt-6 pt-6 border-t border-gray-800' : ''} space-y-4`}>
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

      {/* Guest Session Details */}
      {isGuest && !user && !account && (
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
                : 'Disconnect Guest Session'}
            </span>
          </>
        )}
      </button>
    </div>
  );
}