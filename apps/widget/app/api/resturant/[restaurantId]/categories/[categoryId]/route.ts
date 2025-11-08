import { NextRequest,NextResponse } from "next/server";
import db from "@workspace/database";
export async function GET(
  request: NextRequest,
  { params }: { params: { restaurantId: string; categoryId: string } }
) {
  try {
    const category = await db.category.findFirst({
      where: {
        id: params.categoryId,
        restaurantId: params.restaurantId
      },
      include: {
        menuItems: true
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PUT /api/restaurants/:restaurantId/categories/:categoryId
export async function PUT(
  request: NextRequest,
  { params }: { params: { restaurantId: string; categoryId: string } }
) {
  try {
    const body = await request.json()

    const category = await db.category.updateMany({
      where: {
        id: params.categoryId,
        restaurantId: params.restaurantId
      },
      data: {
        name: body.name,
        description: body.description,
        sortOrder: body.sortOrder,
        isActive: body.isActive
      }
    })

    if (category.count === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/restaurants/:restaurantId/categories/:categoryId
export async function DELETE(
  request: NextRequest,
  { params }: { params: { restaurantId: string; categoryId: string } }
) {
  try {
    await db.category.deleteMany({
      where: {
        id: params.categoryId,
        restaurantId: params.restaurantId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}