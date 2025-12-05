import db from '@workspace/database'
import { NextRequest, NextResponse } from 'next/server'

// Type for the params (Next.js 13+ App Router)
type Params = {
  params: {
    restaurantsId: string
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ restaurantsId: string }> }
) {
  try {
    // ✅ await the params Promise
    const { restaurantsId } = await context.params;

    // Validate restaurantsId
    if (!restaurantsId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }

    // Fetch restaurant with relations
    const restaurant = await db.restaurant.findUnique({
      where: {
        id: restaurantsId
      },
      include: {
        menuItems: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        menu: true,
        addresses: true,
        reviews: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10, // Limit reviews for performance
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      }
    })

    // Check if restaurant exists
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Calculate average rating if reviews exist
    const avgRating = restaurant.reviews && restaurant.reviews.length > 0
      ? restaurant.reviews.reduce((acc, review) => acc + review.rating, 0) / restaurant.reviews.length
      : 0

    // Format response
    const response = {
      ...restaurant,
      averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
      reviewCount: restaurant.reviews?.length || 0,
      isCurrentlyOpen: checkIfOpen(restaurant.openingTime, restaurant.closingTime)
    }

    return NextResponse.json(
      { data: response },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
        }
      }
    )

  } catch (error) {
    console.error('Error fetching restaurant:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? (error as Error).message 
          : 'Failed to fetch restaurant'
      },
      { status: 500 }
    )
  }
}

// Helper function to check if restaurant is currently open
function checkIfOpen(openingTime: string | null, closingTime: string | null): boolean {
  if (!openingTime || !closingTime) return false

  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const [openHour, openMin] = openingTime.split(':').map(Number)
  const [closeHour, closeMin] = closingTime.split(':').map(Number)

  const openTimeMin = openHour * 60 + openMin
  const closeTimeMin = closeHour * 60 + closeMin

  // Handle overnight restaurants (e.g., 10 PM - 2 AM)
  if (closeTimeMin < openTimeMin) {
    return currentTime >= openTimeMin || currentTime <= closeTimeMin
  }

  return currentTime >= openTimeMin && currentTime <= closeTimeMin
}