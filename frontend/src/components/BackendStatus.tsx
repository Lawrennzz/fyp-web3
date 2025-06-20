import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface BackendStatusProps {
  className?: string;
}

interface StatusInfo {
  isConnected: boolean;
  apiLatency: number;
  contractAddress: string | null;
  networkName: string;
  blockNumber: number;
  gasPrice: string;
  nodeVersion: string;
}

export default function BackendStatus({ className }: BackendStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<StatusInfo>({
    isConnected: false,
    apiLatency: 0,
    contractAddress: null,
    networkName: '',
    blockNumber: 0,
    gasPrice: '',
    nodeVersion: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check API connection and latency
        const startTime = Date.now();
        const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`);
        const apiLatency = Date.now() - startTime;
        const isConnected = apiResponse.ok;

        // Get blockchain network information
        let networkInfo = {
          networkName: '',
          blockNumber: 0,
          gasPrice: '',
          nodeVersion: ''
        };

        try {
          if (typeof window !== 'undefined' && window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
            const network = await provider.getNetwork();
            const blockNumber = await provider.getBlockNumber();
            const gasPrice = ethers.utils.formatUnits(await provider.getGasPrice(), 'gwei');
            
            networkInfo = {
              networkName: network.name,
              blockNumber,
              gasPrice: `${parseFloat(gasPrice).toFixed(2)} Gwei`,
              nodeVersion: 'Web3' // Simplified version info
            };
          }
        } catch (error) {
          console.error('Error fetching blockchain info:', error);
        }

        setStatus({
          isConnected,
          apiLatency,
          contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || null,
          ...networkInfo
        });
      } catch (error) {
        console.error('Error checking backend status:', error);
        setStatus(prev => ({ ...prev, isConnected: false }));
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (isConnected: boolean) => {
    return isConnected ? 'bg-green-500' : 'bg-red-500';
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-green-500';
    if (latency < 300) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className={`fixed bottom-4 left-4 bg-[#1c1c1c] rounded-xl shadow-lg ${className}`}>
        <div className="p-4 flex items-center space-x-3">
          <div className="animate-pulse flex items-center space-x-2">
            <div className="h-2.5 w-2.5 bg-[#2d2d2d] rounded-full"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="animate-pulse h-4 w-24 bg-[#2d2d2d] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed bottom-4 left-4 bg-[#1c1c1c] rounded-xl shadow-lg ${className} z-[100]`}
    >
      <div 
        className="p-4 cursor-pointer flex items-center space-x-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(status.isConnected)}`}></div>
        <span className="text-white font-medium text-sm">
          Backend Status
        </span>
        <button className="ml-2 text-gray-400 hover:text-white transition-colors">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-[#2d2d2d] min-w-[300px]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="text-gray-400">Connection:</div>
            <div className={status.isConnected ? 'text-green-500' : 'text-red-500'}>
              {status.isConnected ? 'Connected' : 'Disconnected'}
            </div>

            <div className="text-gray-400">Latency:</div>
            <div className={getLatencyColor(status.apiLatency)}>
              {status.apiLatency}ms
            </div>

            <div className="text-gray-400">Network:</div>
            <div className="text-gray-200">
              {status.networkName || 'Not connected'}
            </div>

            <div className="text-gray-400">Block:</div>
            <div className="text-gray-200">
              #{status.blockNumber || 'N/A'}
            </div>

            <div className="text-gray-400">Gas Price:</div>
            <div className="text-gray-200">
              {status.gasPrice || 'N/A'}
            </div>

            <div className="text-gray-400">Node Version:</div>
            <div className="text-gray-200">
              {status.nodeVersion || 'N/A'}
            </div>

            {status.contractAddress && (
              <>
                <div className="text-gray-400">Contract:</div>
                <div className="text-gray-200 truncate" title={status.contractAddress}>
                  {`${status.contractAddress.slice(0, 6)}...${status.contractAddress.slice(-4)}`}
                </div>
              </>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.reload();
            }}
            className="mt-4 w-full px-4 py-2 bg-[#3898FF] hover:bg-[#3898FF]/90 text-white rounded-xl transition-colors text-sm"
          >
            Refresh Connection
          </button>
        </div>
      )}
    </div>
  );
} 