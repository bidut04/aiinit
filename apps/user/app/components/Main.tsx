import React, { useState, useEffect } from 'react';
import { Clock, Star, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Restaurant {
  id: string;
  name: string;
  logo: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  image: string;
}

const defaultRestaurants: Restaurant[] = [];

const RestaurantCard: React.FC<{ restaurant: Restaurant }> = ({ restaurant }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/restaurants/${restaurant.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 text-4xl bg-white rounded-full w-14 h-14 flex items-center justify-center shadow-md">
          {restaurant.logo}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-800 mb-1">{restaurant.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{restaurant.cuisine}</p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-semibold text-gray-800">{restaurant.rating}</span>
            <span className="text-gray-500">({restaurant.reviewCount})</span>
          </div>

          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{restaurant.deliveryTime} min</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RestaurantGrid() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(defaultRestaurants);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/restaurants', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          // FIX: Check if response has content before parsing
          const text = await res.text();
          let errorMessage = 'Failed to fetch restaurants';
          
          if (text) {
            try {
              const errorData = JSON.parse(text);
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              console.error('Error response is not valid JSON:', text);
            }
          }
          
          throw new Error(errorMessage);
        }

        // FIX: Safely parse successful response
        const text = await res.text();
        if (!text) {
          throw new Error('Empty response from server');
        }

        const data = JSON.parse(text);
        console.log('API Response:', data);
        console.log('Extracted data:', data.data);

        // Fix the nested array issue
        setRestaurants(data.data.flat());

      } catch (error) {
        console.error('Error fetching restaurants:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurants Near You</h1>
          <p className="text-gray-600">Discover amazing food from local restaurants</p>
          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              ⚠️ Using sample data (API error: {error})
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-lg text-gray-600">Loading restaurants...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}