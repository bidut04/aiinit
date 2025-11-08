
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@workspace/auth";
import db from "@workspace/database";
import { getCachedCategories,invalidateCategoryCache,invalidateRestaurantCache,invalidateMultipleCategoriesCache, setCachedCategories } from "@/app/lib/cache-utils";
// GET: Fetch all categories for a restaurant
export async function GET(
  req: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
const cachedData=await getCachedCategories(params.restaurantId)
if(cachedData){
  return NextResponse.json(cachedData,{
status:200,headers: {
          'X-Cache': 'HIT',
        },})
}


    const categories = await db.category.findMany({
      where: {
        restaurantId: params.restaurantId,
        isActive: true, // Only fetch active categories
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
 await setCachedCategories(params.restaurantId,categories);
 return NextResponse.json(categories,{
  status:201,
  headers:{
    'X-Cache':'MISS'
  },
 })
    return NextResponse.json(categories, { status: 200 });

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
    console.log(restaurantId);

    // ✅ Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }
    console.log(session?.user?.id);

    // ✅ FIXED: First get the RestaurantOwner record for this user
    const restaurantOwner = await db.restaurantOwner.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!restaurantOwner) {
      return NextResponse.json(
        { error: "Restaurant owner profile not found" },
        { status: 403 }
      );
    }

    // ✅ Now verify the restaurant belongs to this restaurant owner
    const restaurant = await db.restaurant.findFirst({
      where: {
        id: restaurantId,
        ownerId: restaurantOwner.id, // 👈 Use restaurantOwner.id instead of session.user.id
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found or you don't have permission" },
        { status: 403 }
      );
    }

    // ✅ Parse request body
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // ✅ Get the last sort order
    const lastCategory = await db.category.findFirst({
      where: { restaurantId },
      orderBy: { sortOrder: "desc" },
    });

    const nextSortOrder = lastCategory ? lastCategory.sortOrder + 1 : 0;

    // ✅ Create new category
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

    await invalidateRestaurantCache(restaurantId)

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
  { params }: { params: { restaurantId: string } }
) {
  try {
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

    // Verify ownership
    const category = await db.category.findFirst({
      where: {
        id: categoryId,
        restaurantId: params.restaurantId,
      },
      include: {
        restaurant: {
          select: { ownerId: true },
        },
      },
    });

    if (!category || category.restaurant.ownerId !== session.user.id) {
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
await invalidateCategoryCache(categoryId,params.restaurantId)
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
  { params }: { params: { restaurantId: string } }
) {
  try {
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

    // Verify ownership
    const category = await db.category.findFirst({
      where: {
        id: categoryId,
        restaurantId: params.restaurantId,
      },
      include: {
        restaurant: {
          select: { ownerId: true },
        },
      },
    });

    if (!category || category.restaurant.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Category not found or unauthorized" },
        { status: 403 }
      );
    }

    // Soft delete (set isActive to false) or hard delete
    await db.category.update({
      where: { id: categoryId },
      data: { isActive: false },
    });

    // Or hard delete:
    // await db.category.delete({ where: { id: categoryId } });
await invalidateCategoryCache(categoryId,params.restaurantId)
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
