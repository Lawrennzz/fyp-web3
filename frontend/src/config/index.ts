export const config = {
  // Contract addresses - using newly deployed Hardhat addresses
  HOTEL_BOOKING_CONTRACT: '0xe5998cDD7dF5025eC86018bBEaF29Fc2Bc36A0e4',
  USDT_CONTRACT: '0x718874d3349dd5ab7332364B182dcD8fA224683d',

  // Network configuration
  NETWORK_ID: 1337, // Local Network
  RPC_URL: 'http://127.0.0.1:7545', // Local RPC URL
  CHAIN_NAME: 'Local Network',
  CHAIN_SYMBOL: 'ETH',
  CHAIN_DECIMALS: 18,

  // API endpoints
  API_URL: 'http://localhost:3001',

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

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'; 