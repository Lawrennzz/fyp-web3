import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { IoClose } from 'react-icons/io5';
import { useWalletConnect, WalletProvider } from '../hooks/useWalletConnect';
import { useAuth } from '../contexts/FirebaseContext';
import QRCode from 'qrcode';
import { metaMask } from '../utils/web3Config';
import { config } from '../config';
import { switchToGanacheNetwork } from '../utils/web3';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';

interface WalletConnectProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletOptionProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  isLoading?: boolean;
}

// Memoize the WalletOption component to prevent unnecessary re-renders
const WalletOption = memo<WalletOptionProps>(({
  icon,
  label,
  sublabel,
  onClick,
  isLoading
}) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className="w-full bg-[#2d2d2d] hover:bg-[#333333] p-4 rounded-xl flex items-center gap-3 mb-3 group transition-all disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <div className="w-10 h-10 relative flex-shrink-0 rounded-xl flex items-center justify-center">
      {icon}
    </div>
    <div className="flex-1 text-left">
      <span className="font-medium text-white block">{label}</span>
      {sublabel && <span className="text-sm text-gray-400">{sublabel}</span>}
    </div>
    {isLoading && (
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
    )}
  </button>
));

WalletOption.displayName = 'WalletOption';

const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const modalRoot = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let element = document.getElementById('modal-root');
      if (!element) {
        element = document.createElement('div');
        element.id = 'modal-root';
        element.className = 'relative z-[9999]';
        document.body.appendChild(element);
      }
      modalRoot.current = element;
      setMounted(true);
    }

    return () => {
      if (modalRoot.current?.parentElement && modalRoot.current.childNodes.length === 0) {
        modalRoot.current.parentElement.removeChild(modalRoot.current);
      }
    };
  }, []);

  if (!mounted || !modalRoot.current) return null;
  return createPortal(children, modalRoot.current);
};

export default function WalletConnect({ isOpen, onClose }: WalletConnectProps) {
  const { connectWallet, isConnecting, error: walletError, walletAddress } = useWalletConnect();
  const { signInWithGoogle, user } = useAuth();
  const [activeProvider, setActiveProvider] = useState<WalletProvider | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const web3React = useWeb3React<Web3Provider>();

  // Use a ref to track if the component is mounted
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if ((walletAddress || user) && isMounted.current) {
      onClose();
      setActiveProvider(null);
    }
  }, [walletAddress, user, onClose]);

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleConnect = useCallback(async (provider: WalletProvider, payload?: any) => {
    if (!isMounted.current || isProcessing) return;
    
    try {
      setGoogleError(null);
      setActiveProvider(provider);
      setIsProcessing(true);

      if (provider === 'google') {
        try {
          const user = await signInWithGoogle();
          console.log('Successfully signed in with Google:', user);
          
          // Store the provider type
          localStorage.setItem('lastProvider', 'google');
          
          onClose();
        } catch (err: any) {
          console.error('Google sign-in error:', err);
          if (err.message.includes('popup-blocked')) {
            setGoogleError('Please enable popups for this website to sign in with Google');
          } else if (err.message.includes('popup-closed-by-user')) {
            setGoogleError('Google sign in was cancelled');
          } else if (err.message.includes('unauthorized-domain')) {
            setGoogleError('This domain is not authorized for Google sign in. Please try again later.');
          } else {
            setGoogleError(err.message || 'Failed to sign in with Google');
          }
          throw err;
        }
      } else if (provider === 'metamask') {
        try {
          // Check if MetaMask is installed
          if (typeof window === 'undefined' || !window.ethereum || !window.ethereum.isMetaMask) {
            window.open('https://metamask.io/download/', '_blank');
            throw new Error('Please install MetaMask first. A new tab has been opened for you to download it.');
          }

          console.log('Connecting to MetaMask...');
          
          // Try to connect MetaMask
          try {
            // First connect the wallet
            await connectWallet('metamask');
            console.log('Wallet connected');
            
            // Then activate MetaMask
            await metaMask.activate();
            console.log('MetaMask activated');
            
            // Store the provider type
            localStorage.setItem('lastProvider', 'metamask');
            
            onClose();
          } catch (error: any) {
            console.error('MetaMask connection error:', error);
            if (error.code === 4001) {
              throw new Error('Please accept the connection request in your MetaMask extension.');
            }
            throw error;
          }
        } catch (error: any) {
          console.error('MetaMask error:', error);
          throw error;
        }
      } else if (provider === 'guest') {
        try {
          // Generate a random guest ID
          const guestId = Math.random().toString(36).substring(2, 15);
          
          // Store guest info in localStorage
          localStorage.setItem('isGuest', 'true');
          localStorage.setItem('guestId', guestId);
          localStorage.setItem('lastProvider', 'guest');
          
          // Close the modal
          onClose();
          
          // Force reload to update the UI
          window.location.reload();
        } catch (error: any) {
          console.error('Guest mode error:', error);
          throw error;
        }
      } else {
        await connectWallet(provider, payload);
        onClose();
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      setGoogleError(err.message || 'Failed to connect');
    } finally {
      if (isMounted.current) {
        setActiveProvider(null);
        setIsProcessing(false);
      }
    }
  }, [connectWallet, signInWithGoogle, isMounted, onClose, isProcessing]);

  const handleClose = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!isProcessing) {
      setGoogleError(null);
      onClose();
    }
  }, [isProcessing, onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div 
        className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
        onClick={handleClose}
      >
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
        />
        
        <div 
          className="relative bg-[#1c1c1c] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 pb-4">
            <h2 className="text-2xl font-bold text-white">Sign in</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={isProcessing}
            >
              <IoClose size={24} />
            </button>
          </div>

          <div className="p-6 pt-2">
            {(walletError || googleError) && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                {walletError || googleError}
              </div>
            )}

            <WalletOption
              icon={
                <Image
                  src="/metamask-fox.svg"
                  alt="MetaMask"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              }
              label="MetaMask"
              sublabel="Popular"
              onClick={() => handleConnect('metamask')}
              isLoading={isProcessing && activeProvider === 'metamask'}
            />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-sm text-gray-500 bg-[#1c1c1c]">or</span>
              </div>
            </div>

            <WalletOption
              icon={
                <Image
                  src="/google-icon.svg"
                  alt="Google"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              }
              label="Continue with Google"
              onClick={() => handleConnect('google')}
              isLoading={isProcessing && activeProvider === 'google'}
            />

            <WalletOption
              icon={
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              }
              label="Continue as guest"
              onClick={() => handleConnect('guest')}
              isLoading={isProcessing && activeProvider === 'guest'}
            />

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Powered by{' '}
                <span className="font-medium">Travel.go</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
} 