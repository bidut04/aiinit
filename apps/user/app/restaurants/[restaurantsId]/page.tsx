'use client'
import React,{useState,useEffect} from 'react'
import { useParams,useRouter } from 'next/navigation'
import { Star, Clock, MapPin, Phone, ArrowLeft } from 'lucide-react'
interface Review{
id:string,
rating:number,
 comment:string,
 createdAt:string,
 user:{
    id:string,
    name:string,
    image:string|null
 }
}
interface MenuItem{
    id:string,
    name:string,
    description:string,
    price:number,
    image:string|null,
    category:string,
    isvalid:boolean

}
interface Restaurant {
  id: string
  name: string
  description: string
  image: string
  logo?: string
  cuisine: string
  openingTime: string | null
  closingTime: string | null
  phone: string | null
  email: string | null
  averageRating: number
  reviewCount: number
  isCurrentlyOpen: boolean
  menuItems: MenuItem[]
  addresses: any[]
  reviews: Review[]
}
export default function RestaurantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.restaurantsId as string

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/restaurants/${restaurantId}`)

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to fetch restaurant')
        }

        const result = await res.json()
        console.log('Restaurant data:', result)
        
        setRestaurant(result.data) // Extract from { data: {...} }

      } catch (err) {
        console.error('Error fetching restaurant:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (restaurantId) {
      fetchRestaurant()
    }
  }, [restaurantId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading restaurant...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg">Error: {error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back Home
          </button>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Restaurant not found</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Restaurant Header */}
      <div className="relative h-80 overflow-hidden">
        <img 
          src={restaurant.image} 
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end gap-4">
              <div className="text-6xl bg-white rounded-2xl w-20 h-20 flex items-center justify-center shadow-lg">
                {restaurant.logo}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
                <p className="text-lg opacity-90">{restaurant.cuisine}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-full ${restaurant.isCurrentlyOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <Clock className="w-5 h-5 inline mr-2" />
                {restaurant.isCurrentlyOpen ? 'Open Now' : 'Closed'}
              </div>
              <span className="text-gray-600">
                {restaurant.openingTime} - {restaurant.closingTime}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="font-semibold text-lg">{restaurant.averageRating}</span>
              <span className="text-gray-500">({restaurant.reviewCount} reviews)</span>
            </div>

            {restaurant.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-5 h-5" />
                <span>{restaurant.phone}</span>
              </div>
            )}
          </div>

          {restaurant.description && (
            <p className="mt-4 text-gray-700 border-t pt-4">{restaurant.description}</p>
          )}
        </div>

        {/* Menu Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Menu</h2>
          {restaurant.menuItems && restaurant.menuItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurant.menuItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      {!item.isAvailable && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Unavailable
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-green-600">
                        ${item.price.toFixed(2)}
                      </span>
                      <button 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        disabled={!item.isAvailable}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No menu items available</p>
          )}
        </div>

        {/* Reviews Section */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          {restaurant.reviews && restaurant.reviews.length > 0 ? (
            <div className="space-y-4">
              {restaurant.reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-white">
                      {review.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg">{review.user.name}</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No reviews yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
