import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@workspace/auth"; // Fixed: authOptions not authOption
import db from "@workspace/database";

export async function POST(req: NextRequest) {
  try {
    console.log("=== Menu Item Creation Started ===");
    
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    console.log("👤 Session user ID:", session?.user?.id);

    if (!session?.user?.id) {
      console.log("❌ No session found");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    console.log("📦 Request body:", JSON.stringify(body, null, 2));

    // Validate required fields
    const { categoryId, name, price } = body;

    if (!categoryId) {
      console.log("❌ Missing categoryId");
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    if (!name || !price) {
      console.log("❌ Missing name or price");
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    // Check if category exists and belongs to user's restaurant
    console.log("🔍 Looking up category:", categoryId);
    const category = await db.category.findFirst({
      where: {
        id: categoryId,
      },
      include: {
        restaurant: {
          include: {
            owner: {
              select: {
                userId: true,  // ✅ Get userId from Owner table
              },
            },
          },
        },
      },
    });

    console.log("📂 Category found:", category ? "Yes" : "No");
    if (category) {
      console.log("🏪 Restaurant ID:", category.restaurant.id);
      console.log("👤 Owner's User ID:", category.restaurant.owner.userId);
      console.log("👤 Current User ID:", session.user.id);
      console.log("✅ Match:", category.restaurant.owner.userId === session.user.id);
    }

    if (!category) {
      console.log("❌ Category not found");
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // ✅ FIXED: Verify user owns the restaurant through Owner table
    if (category.restaurant.owner.userId !== session.user.id) {
      console.log("❌ PERMISSION DENIED - Owner mismatch!");
      console.log("Expected user:", category.restaurant.owner.userId);
      console.log("Actual user:", session.user.id);
      return NextResponse.json(
        { error: "You don't have permission to add items to this category" },
        { status: 403 }
      );
    }

    console.log("✅ Permission check passed");

    // Create menu item
    console.log("💾 Creating menu item...");
    const menuItem = await db.menuItem.create({
      data: {
        restaurantId: category.restaurantId,
        categoryId: categoryId,
        name: body.name,
        description: body.description || null,
        image: body.imageUrl || null,
        price: parseFloat(body.price),
        discountPrice: body.discountPrice ? parseFloat(body.discountPrice) : null,
        isVeg: body.veg ?? true,
        isAvailable: body.available ?? true,
        isBestseller: body.isBestseller ?? false,
        isRecommended: body.isRecommended ?? false,
        calories: body.calories ? parseInt(body.calories) : null,
        spiceLevel: body.spiceLevel || null,
        prepTime: body.prepTime ? parseInt(body.prepTime) : null,
        servingSize: body.servingSize || null,
        tags: body.tags || [],
        sortOrder: body.sortOrder ?? 0,
      },
    });

    console.log("✅ Menu item created:", menuItem.id);
    return NextResponse.json(menuItem, { status: 201 });

  } catch (error) {
    console.error("❌ Error creating menu item:", error);
    return NextResponse.json(
      { 
        error: "Failed to create menu item",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
// Optional: GET endpoint to fetch menu items
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const restaurantId = searchParams.get("restaurantId");

    if (!categoryId && !restaurantId) {
      return NextResponse.json(
        { error: "Either categoryId or restaurantId is required" },
        { status: 400 }
      );
    }

    const menuItems = await db.menuItem.findMany({
      where: {
        ...(categoryId && { categoryId }),
        ...(restaurantId && { restaurantId }),
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json(menuItems);

  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}