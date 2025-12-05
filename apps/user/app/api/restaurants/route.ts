import db from '@workspace/database'
import { NextRequest, NextResponse } from 'next/server'

export const GET = async (req: NextRequest) => {
  console.log('🔵 API Route /api/restaurants called');
  
  try {
    console.log('🔵 Attempting to fetch restaurants from database...');
    
    const restaurants = await db.restaurant.findMany({
      include: {
        categories: true,
      }
    });
    
    console.log('✅ Successfully fetched restaurants:', restaurants.length);
    console.log('✅ First restaurant:', restaurants[0]);
    
    return NextResponse.json({ 
      success: true, 
      data: restaurants 
    });
    
  } catch (error) {
    console.error('🔴 Error fetching restaurants:', error);
    console.error('🔴 Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('🔴 Error message:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch restaurants',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}