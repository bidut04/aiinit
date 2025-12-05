import { NextRequest, NextResponse } from "next/server";
import db from '@workspace/database';
import { getCachedMenuItem,setCachedMenuItem } from "@/app/redis/store-restaurants-for-user";
export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ fooditemId: string }> }
) => {
  try {
    // Await params in Next.js 15+
    const { fooditemId } = await params;

    if (!fooditemId) {
      return NextResponse.json(
        { success: false, message: 'Food item ID is required' },
        { status: 400 }
      );
    }

 const cached = await getCachedMenuItem(fooditemId);
    if (cached) {
      return NextResponse.json(
        { success: true, data: cached, source: 'cache' },
        { status: 200 }
      );
    }

    const foodItem = await db.menuItem.findUnique({
      where: { id: fooditemId },
      include: {
        restaurant: true,
        category: true
      }
    });

    if (!foodItem) {
      return NextResponse.json(
        { success: false, message: 'Food item not found' },
        { status: 404 }
      );
    }
await setCachedMenuItem(fooditemId, foodItem);
    return NextResponse.json(
      { success: true, data: foodItem },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching food item:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch food item' },
      { status: 500 }
    );
  }
};