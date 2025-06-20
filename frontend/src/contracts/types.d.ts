declare module '*.json' {
  const value: any;
  export default value;
}

declare module '*/HotelBooking.json' {
  const value: {
    abi: any[];
    networks: {
      [key: string]: {
        address: string;
      };
    };
  };
  export default value;
}

declare module '*/TestUSDT.json' {
  const value: {
    abi: any[];
    networks: {
      [key: string]: {
        address: string;
      };
    };
  };
  export default value;
} 