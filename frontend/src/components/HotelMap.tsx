import { useCallback, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

interface Location {
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  address: string;
  city: string;
  country: string;
}

interface Room {
  type: string;
  description: string;
  pricePerNight: number;
  maxGuests: number;
  amenities: string[];
  images: string[];
}

interface Hotel {
  _id: string;
  name: string;
  location: Location;
  description: string;
  image: string;
  images: string[];
  rating: number;
  amenities: string[];
  rooms: Room[];
}

interface HotelMapProps {
  hotels: Hotel[];
  onHotelClick: (hotelId: string) => void;
}

const containerStyle = {
  width: '100%',
  height: '600px' // Set a fixed height
};

// Default center (London)
const defaultCenter = {
  lat: 51.5074,
  lng: -0.1278
};

// Dark mode map styling
const darkModeMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

export default function HotelMap({ hotels, onHotelClick }: HotelMapProps) {
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filter hotels that have valid coordinates
  const hotelsWithCoordinates = hotels.filter(
    hotel => hotel.location?.coordinates?.lat && hotel.location?.coordinates?.lng
  );

  const getMapCenter = useCallback(() => {
    if (hotelsWithCoordinates.length === 0) return defaultCenter;
    
    // Calculate the center point of all hotels with coordinates
    const bounds = hotelsWithCoordinates.reduce(
      (acc, hotel) => {
        const { lat, lng } = hotel.location.coordinates!;
        return {
          minLat: Math.min(acc.minLat, lat),
          maxLat: Math.max(acc.maxLat, lat),
          minLng: Math.min(acc.minLng, lng),
          maxLng: Math.max(acc.maxLng, lng),
        };
      },
      {
        minLat: 90,
        maxLat: -90,
        minLng: 180,
        maxLng: -180,
      }
    );

    return {
      lat: (bounds.minLat + bounds.maxLat) / 2,
      lng: (bounds.minLng + bounds.maxLng) / 2,
    };
  }, [hotelsWithCoordinates]);

  const getZoomLevel = useCallback(() => {
    if (hotelsWithCoordinates.length === 0) return 12;
    if (hotelsWithCoordinates.length === 1) return 14;
    return 12;
  }, [hotelsWithCoordinates]);

  if (hotelsWithCoordinates.length === 0) {
    return (
      <div className="bg-[#1E293B] rounded-lg p-4 text-center text-gray-400">
        No hotels with location data available
      </div>
    );
  }

  return (
    <LoadScript 
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
      onLoad={() => setMapLoaded(true)}
    >
      <div className="w-full h-[600px] relative">
        {mapLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={getMapCenter()}
            zoom={getZoomLevel()}
            options={{
              styles: darkModeMapStyle,
              fullscreenControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              zoomControl: true
            }}
          >
            {hotelsWithCoordinates.map((hotel) => (
              <Marker
                key={hotel._id}
                position={{
                  lat: hotel.location.coordinates!.lat,
                  lng: hotel.location.coordinates!.lng
                }}
                onClick={() => setSelectedHotel(hotel)}
              />
            ))}

            {selectedHotel && (
              <InfoWindow
                position={{
                  lat: selectedHotel.location.coordinates!.lat,
                  lng: selectedHotel.location.coordinates!.lng
                }}
                onCloseClick={() => setSelectedHotel(null)}
              >
                <div className="bg-white p-4 rounded-lg max-w-xs">
                  <h3 className="font-semibold text-gray-900">{selectedHotel.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {selectedHotel.location.address}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {selectedHotel.location.city}, {selectedHotel.location.country}
                  </p>
                  <button
                    onClick={() => onHotelClick(selectedHotel._id)}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1E293B] rounded-lg">
            <div className="text-white">Loading map...</div>
          </div>
        )}
      </div>
    </LoadScript>
  );
} 