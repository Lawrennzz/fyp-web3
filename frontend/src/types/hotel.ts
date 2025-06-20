export interface Room {
  _id: string;
  type: string;
  description?: string;
  beds: {
    count: number;
    type: string;
  };
  pricePerNight: number;
  available: boolean;
  amenities?: string[];
  maxGuests: number;
  images?: {
    url: string;
    alt?: string;
  }[];
}

export interface Hotel {
  _id: string;
  name: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  description: string;
  image: string;
  images: {
    url: string;
    alt?: string;
  }[];
  rooms: Room[];
  rating: number;
  amenities: string[];
  reviews: {
    user: string;
    rating: number;
    comment: string;
    date: string;
  }[];
} 