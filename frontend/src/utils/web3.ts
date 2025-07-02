import { ethers } from 'ethers';
import { config } from '../config';

// Define the Ethereum provider interface
interface EthereumProvider {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    isMetaMask?: boolean;
}

// Extend the Window interface
declare global {
    interface Window {
        ethereum?: EthereumProvider;
    }
}

export const switchToGanacheNetwork = async () => {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x539' }], // ChainId for Ganache (1337 in decimal)
        });
    } catch (error: any) {
        // If the network doesn't exist, add it
        if (error.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                    {
                        chainId: '0x539', // ChainId for Ganache (1337 in decimal)
                        chainName: config.CHAIN_NAME,
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: config.CHAIN_SYMBOL,
                            decimals: config.CHAIN_DECIMALS,
                        },
                        rpcUrls: [config.RPC_URL],
                    },
                ],
            });
        } else {
            throw error;
        }
    }
}; 