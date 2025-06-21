import { useCallback, useState } from 'react';
import Image from 'next/image';
import { IoClose, IoPerson, IoMail } from 'react-icons/io5';
import { useWalletConnect } from '../hooks/useWalletConnect';

interface ConnectWalletModalProps {
  onClose: () => void;
}

export default function ConnectWalletModal({ onClose }: ConnectWalletModalProps) {
  const { connectWallet, isConnecting } = useWalletConnect();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleConnect = useCallback(async (provider: 'metamask' | 'google' | 'guest' | 'email', payload?: any) => {
    try {
      setEmailError('');
      await connectWallet(provider, payload);
      onClose();
    } catch (error: any) {
      console.error('Connection error:', error);
      if (provider === 'email') {
        setEmailError(error.message || 'Failed to authenticate with email');
      }
    }
  }, [connectWallet, onClose]);

  const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setEmailError('Please enter both email and password');
      return;
    }
    await handleConnect('email', { email, password });
  }, [email, password, handleConnect]);

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
          {!showEmailForm ? (
            <>
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

              {/* Email */}
              <button
                onClick={() => setShowEmailForm(true)}
                disabled={isConnecting}
                className="w-full flex items-center gap-3 px-4 py-4 bg-[#2a2b2f] hover:bg-[#2f3033] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <IoMail className="w-5 h-5 text-gray-400" />
                </div>
                <p className="flex-1 text-left text-white font-medium text-lg">Continue with Email</p>
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
            </>
          ) : (
            /* Email Form */
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Email Authentication</h3>
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Back
                </button>
              </div>

              {emailError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                  {emailError}
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a2b2f] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a2b2f] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isConnecting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                )}
                Sign In / Sign Up
              </button>

              <p className="text-xs text-gray-500 text-center">
                We'll create an account if one doesn't exist
              </p>
            </form>
          )}
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