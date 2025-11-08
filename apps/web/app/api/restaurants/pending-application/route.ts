import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/getUserFromServer";
import db from '@workspace/database'

export const GET = async (req: NextRequest) => {
  try {
    const profile = await getCurrentUser();
    
    if (!profile) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

      const pendingApplications = await db.restaurantApplication.findMany({
      where: {
        status: "PENDING"
      },
      select: {
        id: true,
        applicationNumber: true,
        restaurantName: true,
        ownerFirstName: true,
        ownerLastName: true,
        ownerEmail: true,
        ownerPhone: true,
        fssaiNumber: true,
        
        // Restaurant Address Fields
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        pincode: true,
        landmark: true,
        
        // Other useful fields
        restaurantType: true,
        cuisineTypes: true,
        seatingCapacity: true,
        submittedAt: true,
        status: true,
        
        // Relations
        restaurantOwner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone:true
          }
        },
        documents: true,
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });
    const formattedApplications = pendingApplications.map(app => ({
      ...app,
      fullAddress: `${app.addressLine1}${app.addressLine2 ? ', ' + app.addressLine2 : ''}, ${app.city}, ${app.state} - ${app.pincode}${app.landmark ? ' (Near ' + app.landmark + ')' : ''}`
    }));

    return NextResponse.json({
      success: true,
      data: formattedApplications,
      count: formattedApplications.length
    });

  } catch (error) {
    console.error("Error fetching pending applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

