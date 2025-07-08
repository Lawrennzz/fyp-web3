export const NETWORKS = {
    ganache: {
        name: 'Ganache',
        chainId: 1337,
        rpcUrl: 'http://127.0.0.1:7545',
        explorer: null,
        contractAddress: '0xGANACHE_CONTRACT_ADDRESS', // Replace with your Ganache contract address
    },
    sepolia: {
        name: 'Sepolia',
        chainId: 11155111,
        rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY', // Replace with your Infura key
        explorer: 'https://sepolia.etherscan.io',
        contractAddress: '0xSEPOLIA_CONTRACT_ADDRESS', // Replace with your Sepolia contract address
    }
}; 