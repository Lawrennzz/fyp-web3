export const config = {
  // Contract addresses
  HOTEL_BOOKING_CONTRACT: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // This will be updated after deployment
  USDT_CONTRACT: '0x259a4EFe4Ca2e33E3C088835E4167D4100', // This will be updated after deployment
  
  // Network configuration
  NETWORK_ID: 1337, // Ganache Network
  RPC_URL: 'http://127.0.0.1:7545', // Ganache default RPC URL
  CHAIN_NAME: 'Ganache',
  CHAIN_SYMBOL: 'ETH',
  CHAIN_DECIMALS: 18,
  
  // API endpoints
  API_URL: 'http://localhost:3003/api',
  
  // Currency
  DEFAULT_CURRENCY: 'USDT',
  
  // Image paths
  DEFAULT_HOTEL_IMAGE: '/images/default-hotel.jpg',
  DEFAULT_ROOM_IMAGE: '/images/default-room.jpg',
  
  // Pagination
  ITEMS_PER_PAGE: 10,
  
  // Date format
  DATE_FORMAT: 'yyyy-MM-dd',
  
  // Search
  MIN_SEARCH_CHARS: 3,
  
  // Booking
  MIN_BOOKING_DAYS: 1,
  MAX_BOOKING_DAYS: 30,
  MAX_GUESTS_PER_ROOM: 4,
  
  // Reviews
  MIN_RATING: 1,
  MAX_RATING: 10,
  
  // Cache
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
}; 