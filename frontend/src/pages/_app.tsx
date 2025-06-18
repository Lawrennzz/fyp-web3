import type { AppProps } from 'next/app';
import { Web3ReactProvider, type Web3ReactHooks } from '@web3-react/core';
import { metaMask, hooks } from '../utils/web3Config';
import { AuthProvider } from '../contexts/FirebaseContext';
import '../styles/globals.css';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/datepicker.css';

const connectors: [typeof metaMask, Web3ReactHooks][] = [[metaMask, hooks]];

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Web3ReactProvider connectors={connectors}>
        <Component {...pageProps} />
      </Web3ReactProvider>
    </AuthProvider>
  );
} 