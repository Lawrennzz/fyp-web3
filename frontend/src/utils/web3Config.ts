import { initializeConnector } from '@web3-react/core';
import { MetaMask } from '@web3-react/metamask';
import { Web3Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';

// Initialize MetaMask connector with options to prevent automatic connection
export const [metaMask, hooks] = initializeConnector<MetaMask>(
  (actions) => new MetaMask({ 
    actions,
    options: {
      // Don't connect eagerly on page load
      mustBeMetaMask: true,
      // Don't show errors silently
      silent: false,
      // Timeout after 30 seconds
      timeout: 30000
    }
  })
);

// Ensure MetaMask is deactivated on load
if (typeof window !== 'undefined') {
  metaMask.deactivate?.();
}

export const getContract = (
  address: string,
  abi: any,
  provider: Web3Provider
): Contract => {
  return new Contract(address, abi, provider.getSigner());
};

export type Web3ContextType = {
  active: boolean;
  account: string | null | undefined;
  library: Web3Provider | undefined;
  connector: MetaMask | undefined;
  activate: (connector: MetaMask) => Promise<void>;
  deactivate: () => void;
}; 