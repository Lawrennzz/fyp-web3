import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { IoWallet, IoGlobe, IoInformation, IoWarning } from 'react-icons/io5';
import { config } from '../config';
import { hooks } from '../utils/web3Config';

export default function WalletDetails() {
  const { useAccount, useProvider, useIsActive } = hooks;
  const account = useAccount();
  const provider = useProvider();
  const isActive = useIsActive();
  
  const [balance, setBalance] = useState<string>('0');
  const [network, setNetwork] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletDetails = async () => {
      if (!account || !provider || !isActive) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Get balance
        const balance = await provider.getBalance(account);
        setBalance(ethers.utils.formatEther(balance));

        // Get network
        const network = await provider.getNetwork();
        
        // Check if we're on the correct network
        if (network.chainId !== config.NETWORK_ID) {
          setError('Please switch to the Ganache network');
          setNetwork('Wrong Network');
        } else {
          setNetwork(network.name === 'unknown' ? 'Ganache' : network.name);
        }
      } catch (error) {
        console.error('Error fetching wallet details:', error);
        setError('Failed to fetch wallet details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletDetails();
    // Set up an interval to refresh the balance
    const interval = setInterval(fetchWalletDetails, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [account, provider, isActive]);

  if (!isActive || !account) {
    return (
      <div className="bg-[#1E293B] rounded-lg p-6 text-center">
        <p className="text-gray-400">No wallet connected</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-[#1E293B] rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-6 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] rounded-lg p-6 space-y-4 border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <IoInformation className="w-5 h-5" />
        Wallet Details
      </h3>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-3 flex items-center gap-2 text-red-200">
          <IoWarning className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
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
          <p className="text-gray-400 text-sm">Address</p>
          <p className="text-white font-mono text-sm break-all">
            {account}
          </p>
        </div>
      </div>
    </div>
  );
} 