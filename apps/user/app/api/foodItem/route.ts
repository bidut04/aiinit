import { NextRequest, NextResponse } from "next/server";
import db from '@workspace/database';
import { getCachedAllMenuItems,setCachedAllMenuItems } from "@/app/redis/store-restaurants-for-user";
export const GET = async (req: NextRequest) => {
  try {

 const cached = await getCachedAllMenuItems();
    if (cached) {
      return NextResponse.json(
        { success: true, data: cached, source: 'cache' },
        { status: 200 }
      );
    }

    const foodItems = await db.menuItem.findMany({
      include: {
        restaurant: true,
        category: true
      }
    });

     await setCachedAllMenuItems(foodItems);
    // Return consistent response structure
    return NextResponse.json(
      { 
        success: true, 
        data: foodItems 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error fetching food items:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch food items',
        data: [] 
      },
      { status: 500 }
    );
  }
};