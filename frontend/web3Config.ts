import { InjectedConnector } from '@web3-react/injected-connector';
import { Web3Provider } from '@ethersproject/providers';

export const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 1337] // Add the chain IDs you want to support
});

export const getWeb3Instance = (provider: Web3Provider) => {
  return provider;
};