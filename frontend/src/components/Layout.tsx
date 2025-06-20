import React, { ReactNode, useEffect } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { metaMask } from '../utils/web3Config';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ConnectWalletButton from './ConnectWalletButton';
import BackendStatus from './BackendStatus';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { account } = useWeb3React();
  const isConnected = !!account;

  // Create modal root on mount if it doesn't exist
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let modalRoot = document.getElementById('modal-root');
      if (!modalRoot) {
        modalRoot = document.createElement('div');
        modalRoot.id = 'modal-root';
        modalRoot.className = 'relative z-50';
        document.body.appendChild(modalRoot);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1120] relative">
      {/* Navigation - z-index 10 */}
      <nav className="bg-[#1E293B] shadow-lg relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-500">
                Travel.go
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-300 hover:text-white">
                Home
              </Link>
              <Link href="/hotels" className="text-gray-300 hover:text-white">
                Hotels
              </Link>
              <Link href="/bookings" className="text-gray-300 hover:text-white">
                My Bookings
              </Link>
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main content - z-index 1 */}
      <main className="relative z-[1]">{children}</main>

      {/* Backend status - z-index 20 */}
      <div className="relative z-20">
        <BackendStatus />
      </div>
    </div>
  );
} 