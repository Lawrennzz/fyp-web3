import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { hooks, metaMask } from '../utils/web3Config';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { useAuth } from '../contexts/FirebaseContext';
import Image from 'next/image';

interface ConnectWalletButtonProps {
  onConnect?: () => void;
}

export default function ConnectWalletButton({ onConnect }: ConnectWalletButtonProps) {
  const { useIsActive } = hooks;
  const isActive = useIsActive();
  const { connectWallet, isConnecting } = useWalletConnect();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clear error after 5 seconds
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleConnect = async () => {
    try {
      await connectWallet('metamask');
      if (onConnect) onConnect();
    } catch (err) {
      console.error('Connection error:', err);
      setError('Failed to connect wallet');
    }
  };

  // If already connected with MetaMask, show connected state
  if (isActive) {
    return (
      <button
        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-xl cursor-default"
      >
        <Image
          src="/metamask-fox.svg"
          alt="MetaMask"
          width={24}
          height={24}
          className="mr-2"
        />
        Connected
      </button>
    );
  }

  // If connected with Google, show option to connect MetaMask
  if (user) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#2a2b2f] hover:bg-[#2f3033] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            Connecting...
          </>
        ) : (
          <>
            <Image
              src="/metamask-fox.svg"
              alt="MetaMask"
              width={24}
              height={24}
              className="mr-2"
            />
            Connect MetaMask
          </>
        )}
      </button>
    );
  }

  // Default connect button
  return (
    <div className="space-y-2">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            Connecting...
          </>
        ) : (
          <>
            <Image
              src="/metamask-fox.svg"
              alt="MetaMask"
              width={24}
              height={24}
              className="mr-2"
            />
            Connect with MetaMask
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-3 text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
} 