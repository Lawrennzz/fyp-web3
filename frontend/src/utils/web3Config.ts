import { initializeConnector } from '@web3-react/core';
import { MetaMask } from '@web3-react/metamask';
import { Web3Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';

// Initialize MetaMask connector with options
export const [metaMask, hooks] = initializeConnector<MetaMask>(
  (actions) => new MetaMask({
    actions,
    options: {
      // Allow eager connection if previously connected
      mustBeMetaMask: true,
      // Show errors in console
      silent: false,
      // Timeout after 30 seconds
      timeout: 30000
    }
  })
);

// Only deactivate if explicitly disconnected
if (typeof window !== 'undefined') {
  const isDisconnected = localStorage.getItem('isDisconnected') === 'true';
  if (isDisconnected) {
    metaMask.deactivate?.();
  }
}

export const getContract = (
  address: string,
  abi: any,
  signerOrProvider: Web3Provider | any
): Contract => {
  return new Contract(address, abi, signerOrProvider);
};

export type Web3ContextType = {
  active: boolean;
  account: string | null | undefined;
  provider: Web3Provider | undefined;
  connector: MetaMask | undefined;
  activate: (connector: MetaMask) => Promise<void>;
  deactivate: () => void;
}; 