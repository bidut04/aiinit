import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@workspace/auth";
import db from "@workspace/database";
import { 
  getCachedCategories,
  invalidateCategoryCache,
  invalidateRestaurantCache,
  setCachedCategories 
} from "@/app/lib/cache-utils";

// GET: Fetch all categories for a restaurant
export async function GET(
  req: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    // Check cache first
    const cachedData = await getCachedCategories(params.restaurantId);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        status: 200,
        headers: {
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch from database
    const categories = await db.category.findMany({
      where: {
        restaurantId: params.restaurantId,
        isActive: true,
      },
      include: {
        menuItems: {
          where: {
            isAvailable: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    // Cache the result
    await setCachedCategories(params.restaurantId, categories);

    // Return response with cache miss header
    return NextResponse.json(categories, {
      status: 200, // ✅ FIXED: Changed from 201 to 200 (GET should return 200, not 201)
      headers: {
        'X-Cache': 'MISS',
      },
    });

  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST: Create a new category
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await context.params;

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Get the RestaurantOwner record for this user
    const restaurantOwner = await db.restaurantOwner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!restaurantOwner) {
      return NextResponse.json(
        { error: "Restaurant owner profile not found" },
        { status: 403 }
      );
    }

    // Verify the restaurant belongs to this restaurant owner
    const restaurant = await db.restaurant.findFirst({
      where: {
        id: restaurantId,
        ownerId: restaurantOwner.id,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found or you don't have permission" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Get the last sort order
    const lastCategory = await db.category.findFirst({
      where: { restaurantId },
      orderBy: { sortOrder: "desc" },
    });

    const nextSortOrder = lastCategory ? lastCategory.sortOrder + 1 : 0;

    // Create new category
    const category = await db.category.create({
      data: {
        restaurantId,
        name: body.name,
        description: body.description || null,
        sortOrder: body.sortOrder ?? nextSortOrder,
        isActive: body.isActive ?? true,
      },
      include: { menuItems: true },
    });

    // Invalidate caches
    await Promise.all([
      invalidateRestaurantCache(restaurantId),
      invalidateCategoryCache(category.id, restaurantId), // ✅ ADDED: Also invalidate category cache
    ]);

    return NextResponse.json(category, { status: 201 });

  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// PATCH: Update a category
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ restaurantId: string }> } // ✅ FIXED: params should be a Promise
) {
  try {
    const { restaurantId } = await context.params; // ✅ FIXED: await params

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { categoryId, ...updateData } = body;

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // ✅ FIXED: Get RestaurantOwner record first
    const restaurantOwner = await db.restaurantOwner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!restaurantOwner) {
      return NextResponse.json(
        { error: "Restaurant owner profile not found" },
        { status: 403 }
      );
    }

    // Verify ownership
    const category = await db.category.findFirst({
      where: {
        id: categoryId,
        restaurantId: restaurantId,
      },
      include: {
        restaurant: {
          select: { ownerId: true },
        },
      },
    });

    // ✅ FIXED: Compare with restaurantOwner.id
    if (!category || category.restaurant.ownerId !== restaurantOwner.id) {
      return NextResponse.json(
        { error: "Category not found or unauthorized" },
        { status: 403 }
      );
    }

    // Update category
    const updatedCategory = await db.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        menuItems: true,
      },
    });

    // Invalidate caches
    await Promise.all([
      invalidateCategoryCache(categoryId, restaurantId),
      invalidateRestaurantCache(restaurantId), // ✅ ADDED: Also invalidate restaurant cache
    ]);

    return NextResponse.json(updatedCategory);

  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a category
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ restaurantId: string }> } // ✅ FIXED: params should be a Promise
) {
  try {
    const { restaurantId } = await context.params; // ✅ FIXED: await params

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // ✅ FIXED: Get RestaurantOwner record first
    const restaurantOwner = await db.restaurantOwner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!restaurantOwner) {
      return NextResponse.json(
        { error: "Restaurant owner profile not found" },
        { status: 403 }
      );
    }

    // Verify ownership
    const category = await db.category.findFirst({
      where: {
        id: categoryId,
        restaurantId: restaurantId,
      },
      include: {
        restaurant: {
          select: { ownerId: true },
        },
      },
    });

    // ✅ FIXED: Compare with restaurantOwner.id
    if (!category || category.restaurant.ownerId !== restaurantOwner.id) {
      return NextResponse.json(
        { error: "Category not found or unauthorized" },
        { status: 403 }
      );
    }

    // Soft delete (set isActive to false)
    await db.category.update({
      where: { id: categoryId },
      data: { isActive: false },
    });

    // Invalidate caches
    await Promise.all([
      invalidateCategoryCache(categoryId, restaurantId),
      invalidateRestaurantCache(restaurantId), // ✅ ADDED: Also invalidate restaurant cache
    ]);

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}