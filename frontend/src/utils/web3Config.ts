import { initializeConnector } from '@web3-react/core';
import { MetaMask } from '@web3-react/metamask';
import { Web3Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';

// Initialize MetaMask connector
export const [metaMask, hooks] = initializeConnector<MetaMask>(
  (actions) => new MetaMask({ actions })
);

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