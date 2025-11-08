import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@workspace/database';
import { authOptions } from "@workspace/auth";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
  try {
    console.log("=== API Route Hit: /api/restaurant/current ===");
    
    const session = await getServerSession(authOptions);
    console.log("Session data:", {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role
    });

    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: "Unauthorized",
        hasRestaurant: false 
      }, { status: 401 });
    }

    // First, check if there's a RestaurantOwner record
    const restaurantOwner = await prisma.restaurantOwner.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    console.log("RestaurantOwner record:", restaurantOwner);

    // Try to find restaurant by both userId and restaurantOwnerId
    let restaurant = null;

    if (restaurantOwner) {
      // Try finding by restaurantOwner.id
      restaurant = await prisma.restaurant.findFirst({
        where: { ownerId: restaurantOwner.id },
        select: { 
          id: true, 
          name: true, 
          ownerId: true,
          status: true
        }
      });
      console.log("Found by restaurantOwnerId:", restaurant);
    }

    // If not found, try direct userId lookup
    if (!restaurant) {
      restaurant = await prisma.restaurant.findFirst({
        where: { ownerId: session.user.id },
        select: { 
          id: true, 
          name: true, 
          ownerId: true,
          status: true
        }
      });
      console.log("Found by userId:", restaurant);
    }

    // Debug: Show all restaurants
    const allRestaurants = await prisma.restaurant.findMany({
      select: { id: true, name: true, ownerId: true }
    });
    console.log("All restaurants in DB:", allRestaurants);

    if (!restaurant) {
      console.log("❌ No restaurant found for user:", session.user.id);
      return NextResponse.json({ 
        hasRestaurant: false,
        error: 'Restaurant not found',
        userId: session.user.id,
        restaurantOwnerId: restaurantOwner?.id,
        hint: 'Restaurant not yet created or application not approved'
      }, { status: 404 });
    }

    console.log("✅ Restaurant found:", restaurant.id);

    return NextResponse.json({ 
      hasRestaurant: true,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      status: restaurant.status
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error("❌ Error in /api/restaurant/current:", error);
    return NextResponse.json({ 
      hasRestaurant: false,
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 