// This file is no longer needed since we're using inline type declarations
// to avoid conflicts with MetaMask's detect-provider types

import { ethers } from 'ethers';
import { NETWORKS } from './networks';

export async function getCurrentNetwork() {
    if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        if (network.chainId === NETWORKS.ganache.chainId) return NETWORKS.ganache;
        if (network.chainId === NETWORKS.sepolia.chainId) return NETWORKS.sepolia;
    }
    return null;
}

export async function getLocalTransactionDetails(txHash: string) {
    // Only for Ganache
    const provider = new ethers.providers.JsonRpcProvider(NETWORKS.ganache.rpcUrl);
    const tx = await provider.getTransaction(txHash);
    return tx;
}

export { }; 