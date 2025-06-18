require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3001,
    mongoURI: 'mongodb://localhost:27017/travel_go',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    corsOptions: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
        optionsSuccessStatus: 200
    },

    // Email service configuration
    emailService: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD
    },

    // Blockchain configuration
    blockchain: {
        network: process.env.BLOCKCHAIN_NETWORK || 'sepolia',
        contractAddress: process.env.CONTRACT_ADDRESS,
        providerUrl: process.env.PROVIDER_URL || 'http://localhost:8545'
    },

    // Payment configuration
    payment: {
        supportedMethods: ['crypto', 'card', 'bank'],
        processingFee: 0.025, // 2.5%
        refundWindow: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        maxConcurrentTransactions: 10
    }
}; 