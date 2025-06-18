import React from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { metaMask } from '../utils/web3Config';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { account, provider } = useWeb3React();
  const [loading, setLoading] = useState(false);

  // Check if wallet is connected
  const isConnected = !!account;

  async function connect() {
    try {
      setLoading(true);
      await metaMask.activate();
    } catch (error: unknown) {
      console.error('Error connecting wallet:', error instanceof Error ? error.message : error);
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    try {
      if (metaMask?.deactivate) {
        await metaMask.deactivate();
      } else {
        await metaMask.resetState();
      }
    } catch (error: unknown) {
      console.error('Error disconnecting wallet:', error instanceof Error ? error.message : error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Travel.go
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/hotels" className="hover:text-gray-300">
                Hotels
              </Link>
              <Link href="/bookings" className="hover:text-gray-300">
                My Bookings
              </Link>
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </span>
                  <button
                    onClick={disconnect}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connect}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-gray-800 border-t border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>© 2024 Travel.go - Web3 Hotel Booking Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 