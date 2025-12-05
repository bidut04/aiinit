import db from '@workspace/database'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@workspace/auth"

export async function DELETE(
  req: NextRequest,
  { params }: { params: { menuitemId: string } }
) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: "Unauthorized",
          message: "You must be logged in to perform this action" 
        },
        { status: 401 }
      )
    }

    // 2. Validate menuitemId
    const { menuitemId } = params
    
    if (!menuitemId || menuitemId.trim() === "") {
      return NextResponse.json(
        { 
          error: "Bad Request",
          message: "Menu item ID is required" 
        },
        { status: 400 }
      )
    }

    // 3. Check if menu item exists and get restaurant owner
    const existingMenuItem = await db.menuItem.findUnique({
      where: { id: menuitemId },
      select: {
        id: true,
        name: true,
        restaurantId: true,
        restaurant: {
          select: {
            name: true,
            owner: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingMenuItem) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Menu item not found",
        },
        { status: 404 }
      );
    }

    // ✅ Safe optional chaining to avoid runtime errors
    const ownerUserId = existingMenuItem.restaurant?.owner?.user?.id;

    console.log("Owner user id:", ownerUserId);
    console.log("Session user id:", session.user.id);

    // 4. Authorization check - verify user owns the restaurant
    if (!ownerUserId || ownerUserId !== session.user.id) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You don't have permission to delete this menu item",
        },
        { status: 403 }
      );
    }

    // 5. Delete the menu item (cascades will handle related records)
    await db.menuItem.delete({
      where: { id: menuitemId }
    })

    // 6. Return success response
    return NextResponse.json(
      { 
        success: true,
        message: `Menu item "${existingMenuItem.name}" deleted successfully`,
        data: {
          deletedItemId: menuitemId,
          restaurantId: existingMenuItem.restaurantId
        }
      },
      { status: 200 }
    )

  } catch (error) {
    // 7. Error logging and handling
    console.error("Error deleting menu item:", error)
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      // Prisma record not found error
      if (error.message.includes("Record to delete does not exist")) {
        return NextResponse.json(
          { 
            error: "Not Found",
            message: "Menu item not found" 
          },
          { status: 404 }
        )
      }

      // Foreign key constraint error
      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          { 
            error: "Conflict",
            message: "Cannot delete menu item due to existing dependencies" 
          },
          { status: 409 }
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: "Internal Server Error",
        message: "An error occurred while deleting the menu item" 
      },
      { status: 500 }
    )
  }
}