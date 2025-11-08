'use client'
import { useState, useEffect, useContext, createContext, ReactNode } from 'react'

type RestaurantContextType = {
    restaurantId: string | null
    loading: boolean
}

// Create context with undefined initially to catch usage outside provider
const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined)

// ✅ Custom hook with error checking
export const useRestaurant = () => {
    const context = useContext(RestaurantContext)
    
    // This will help you catch where the hook is being used incorrectly
    if (context === undefined) {
        throw new Error('useRestaurant must be used within a RestaurantProvider')
    }
    
    return context
}

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
    const [restaurantId, setRestaurantId] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        async function fetchRestaurant() {
            try {
                const response = await fetch('/api/restaurant/current', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                
                if (!response.ok) {
                    throw new Error('Failed to fetch restaurant')
                }
                
                const data = await response.json()
                console.log('From context - Fetched restaurant data:', data)
                setRestaurantId(data.restaurantId)
            } catch (error) {
                console.error('Error fetching restaurant:', error)
                setRestaurantId(null)
            } finally {
                setLoading(false)
            }
        }

        fetchRestaurant()
    }, [])

    return (
        <RestaurantContext.Provider value={{ restaurantId, loading }}>
            {children}
        </RestaurantContext.Provider>
    )
}