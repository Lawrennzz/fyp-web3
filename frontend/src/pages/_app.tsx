import '../styles/globals.css';
import '../styles/datepicker.css';
import type { AppProps } from 'next/app';
import { Web3ReactProvider } from '@web3-react/core';
import { MetaMask } from '@web3-react/metamask';
import { Web3ReactHooks } from '@web3-react/core';
import { metaMask, hooks } from '../utils/web3Config';
import { FirebaseProvider, AuthProvider } from '../contexts/FirebaseContext';
import { useEffect } from 'react';

const connectors: [MetaMask, Web3ReactHooks][] = [[metaMask, hooks]];

function MyApp({ Component, pageProps }: AppProps) {
  // Ensure MetaMask is deactivated on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      metaMask.deactivate?.();
    }
  }, []);

  return (
    <Web3ReactProvider connectors={connectors}>
      <FirebaseProvider>
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </FirebaseProvider>
    </Web3ReactProvider>
  );
}

export default MyApp; 