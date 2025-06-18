export const config = {
  // Contract addresses
  HOTEL_BOOKING_CONTRACT: '0x197ed06Cb269f1725D456701C0a1A33FAaD124eD',
  USDT_CONTRACT: '0x259a4EFe4Ca2e33E3C088835E4167D4100',
  
  // Network configuration
  NETWORK_ID: 1337, // Ganache
  RPC_URL: 'http://127.0.0.1:7545',
  
  // API endpoints
  API_URL: 'http://localhost:3000/api',
  
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