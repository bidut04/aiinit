import { NextRequest,NextResponse } from "next/server";
import db from '@workspace/database'
import { getCurrentUser } from "@/lib/getUserFromServer";
import approveRestaurantApplication from '@/app/actions/approve-application'
export const POST = async(req: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) => {
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

    const {applicationId} =await params
console.log(applicationId);

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
    const result = await approveRestaurantApplication(applicationId);

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result
    });

  } catch (error: any) {
    console.error("Error approving application:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve application" },
      { status: 500 }
    );
  }
}