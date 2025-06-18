import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useWeb3React } from '@web3-react/core';
import { getContract } from '../../utils/web3Config';
import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';

interface Hotel {
  _id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  rating: number;
  price: number;
  amenities: string[];
}

interface Filters {
  rating: number[];
  stars: number[];
  facilities: string[];
}

export default function Hotels() {
  const router = useRouter();
  const { account } = useWeb3React<Web3Provider>();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    rating: [],
    stars: [],
    facilities: [],
  });

  const facilities = [
    { id: 'Gym', label: 'Gym', count: 75 },
    { id: 'Pet-friendly', label: 'Pet-friendly', count: 45 },
    { id: 'Spa & Wellness', label: 'Spa & Wellness', count: 15 },
    { id: 'Parking', label: 'Parking', count: 29 },
    { id: 'Kids-friendly', label: 'Kids-friendly', count: 10 },
  ];

  useEffect(() => {
    fetchHotels();
  }, [router.query]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotels`);
      if (!response.ok) {
        throw new Error('Failed to fetch hotels');
      }
      
      const data = await response.json();
      setHotels(data);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      setError('Failed to load hotels. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (type: keyof Filters, value: number | string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value as never)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }));
  };

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchHotels}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Reviews</h3>
              <div className="flex flex-wrap gap-2">
                {[7.0, 8.0, 9.0, 10.0].map(rating => (
                  <button
                    key={rating}
                    onClick={() => toggleFilter('rating', rating)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      filters.rating.includes(rating)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Hotel Stars</h3>
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4, 5].map(stars => (
                  <button
                    key={stars}
                    onClick={() => toggleFilter('stars', stars)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                      filters.stars.includes(stars)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {'★'.repeat(stars)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Facilities</h3>
              <div className="flex flex-col gap-2">
                {facilities.map(facility => (
                  <label
                    key={facility.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.facilities.includes(facility.id)}
                      onChange={() => toggleFilter('facilities', facility.id)}
                      className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">{facility.label}</span>
                    <span className="text-gray-500 text-sm">({facility.count})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hotels List */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {hotels.map(hotel => (
                <div
                  key={hotel._id}
                  className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors"
                >
                  <div className="flex">
                    <div className="w-1/3">
                      <img
                        src={hotel.image || '/placeholder-hotel.jpg'}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-medium mb-2">{hotel.name}</h3>
                          <p className="text-gray-400 mb-4">{hotel.location}</p>
                          <div className="flex gap-2">
                            {hotel.amenities.slice(0, 4).map(amenity => (
                              <span
                                key={amenity}
                                className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                              >
                                {amenity}
                              </span>
                            ))}
                            {hotel.amenities.length > 4 && (
                              <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
                                +{hotel.amenities.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-blue-500 text-white px-3 py-1 rounded-lg mb-2">
                            {hotel.rating}
                          </div>
                          <div className="text-2xl font-bold">
                            {hotel.price} USDT
                          </div>
                          <div className="text-sm text-gray-400">per night</div>
                          <button
                            onClick={() => router.push(`/hotels/${hotel._id}`)}
                            className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 