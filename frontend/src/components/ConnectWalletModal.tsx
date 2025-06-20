import { useCallback } from 'react';
import Image from 'next/image';
import { IoClose, IoPerson } from 'react-icons/io5';
import { useWalletConnect } from '../hooks/useWalletConnect';

interface ConnectWalletModalProps {
  onClose: () => void;
}

export default function ConnectWalletModal({ onClose }: ConnectWalletModalProps) {
  const { connectWallet, isConnecting } = useWalletConnect();

  const handleConnect = useCallback(async (provider: 'metamask' | 'google' | 'guest') => {
    try {
      await connectWallet(provider);
      onClose();
    } catch (error) {
      console.error('Connection error:', error);
    }
  }, [connectWallet, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-[#1a1b1f] rounded-2xl w-[400px] relative">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-2xl font-semibold text-white">Sign in</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* MetaMask */}
          <button
            onClick={() => handleConnect('metamask')}
            disabled={isConnecting}
            className="w-full flex items-center gap-3 px-4 py-4 bg-[#2a2b2f] hover:bg-[#2f3033] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center gap-3 flex-1">
              <Image
                src="/metamask-fox.svg"
                alt="MetaMask"
                width={28}
                height={28}
              />
              <div className="text-left">
                <p className="text-white font-medium text-lg">MetaMask</p>
                <p className="text-gray-500 text-sm">Popular</p>
              </div>
            </div>
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 text-gray-500 bg-[#1a1b1f]">or</span>
            </div>
          </div>

          {/* Google */}
          <button
            onClick={() => handleConnect('google')}
            disabled={isConnecting}
            className="w-full flex items-center gap-3 px-4 py-4 bg-[#2a2b2f] hover:bg-[#2f3033] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image
              src="/google-icon.svg"
              alt="Google"
              width={24}
              height={24}
            />
            <p className="flex-1 text-left text-white font-medium text-lg">Continue with Google</p>
          </button>

          {/* Guest */}
          <button
            onClick={() => handleConnect('guest')}
            disabled={isConnecting}
            className="w-full flex items-center gap-3 px-4 py-4 bg-[#2a2b2f] hover:bg-[#2f3033] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <IoPerson className="w-5 h-5 text-gray-400" />
            </div>
            <p className="flex-1 text-left text-white font-medium text-lg">Continue as guest</p>
          </button>
        </div>

        <div className="p-6 pt-2 text-center">
          <p className="text-sm text-gray-500">
            Powered by <span className="text-gray-400">Travel.go</span>
          </p>
        </div>
      </div>
    </div>
  );
} 