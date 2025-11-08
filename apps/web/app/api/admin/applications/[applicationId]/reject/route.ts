// app/api/admin/applications/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from '@workspace/database'
import { getCurrentUser } from "@/lib/getUserFromServer";
import { rejectRestaurantApplication } from "@/app/actions/approve-application"; // Update this path

export const POST = async(req: NextRequest, {params}: {params: {id: string}}) => {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const applicationId = params.id;
    const { reason } = await req.json();

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: "Rejection reason must be at least 10 characters" },
        { status: 400 }
      );
    }

    // Get the application
    const application = await db.restaurantApplication.findUnique({
      where: { id: applicationId },
      include: {
        documents: true,
        restaurantOwner: true,
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Application is already ${application.status}` },
        { status: 400 }
      );
    }

    // Call your server action
    const result = await rejectRestaurantApplication(applicationId, reason);

    return NextResponse.json({
      success: true,
      message: "Application rejected successfully",
      data: result
    });

  } catch (error: any) {
    console.error("Error rejecting application:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject application" },
      { status: 500 }
    );
  }
}