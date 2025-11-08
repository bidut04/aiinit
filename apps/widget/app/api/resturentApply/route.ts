import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@workspace/auth";
import { PrismaClient } from "@workspace/database";
import { CHANNELS, incrementUnreadCount, publishNotification, redis } from "@workspace/lib";

export const POST = async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  console.log("resturant apply :",session);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    ownerFirstName,
    ownerLastName,
    ownerEmail,
    ownerPhone,
    aadharNumber,
    panNumber,
    restaurantName,
    restaurantType,
    cuisineTypes,
    establishmentType,
    fssaiNumber,
    gstNumber,
    businessLicense,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    landmark,
    openingTime,
    closingTime,
    seatingCapacity,
    isPureVeg,
    hasParking,
    hasWifi,
    hasAC,
    accountName,
    accountNumber,
    confirmAccountNumber,
    ifscCode,
    bankName,
    branchName,
    accountType,
    documents,
    termsAccepted,
    commissionAgreed,
    sessionId
  } = body;

  // Validation
  if (!ownerFirstName || !ownerLastName || !ownerEmail || !ownerPhone || 
      !aadharNumber || !panNumber || !restaurantName || !restaurantType || 
      !cuisineTypes || !establishmentType || !fssaiNumber || !addressLine1 || 
      !city || !state || !pincode || !openingTime || !closingTime || 
      seatingCapacity === undefined || isPureVeg === undefined || 
      hasParking === undefined || hasWifi === undefined || hasAC === undefined || 
      !accountName || !accountNumber || !confirmAccountNumber || !ifscCode || 
      !bankName || !branchName || !accountType || !termsAccepted || 
      !commissionAgreed) {
    return NextResponse.json({ 
      error: "All required fields must be provided" 
    }, { status: 400 });
  }

  // Validate documents
  if (!documents || typeof documents !== 'object') {
    return NextResponse.json({ error: "Documents are required" }, { status: 400 });
  }

  if (!documents.aadhar) {
    return NextResponse.json({ error: "Aadhar document is required" }, { status: 400 });
  }

  if (!documents.pan) {
    return NextResponse.json({ error: "PAN document is required" }, { status: 400 });
  }

  if (!documents.fssai) {
    return NextResponse.json({ error: "FSSAI document is required" }, { status: 400 });
  }

  if (!documents.restaurantPhotos || documents.restaurantPhotos.length < 1) {
    return NextResponse.json({ 
      error: "At least 1 restaurant photo is required" 
    }, { status: 400 });
  }

  if (accountNumber !== confirmAccountNumber) {
    return NextResponse.json({ 
      error: "Account numbers do not match" 
    }, { status: 400 });
  }

  const prisma = new PrismaClient();

  try {
    // Check for existing application
    const hasRestaurantApplication = await prisma.restaurantApplication.findFirst({
      where: { ownerEmail: ownerEmail }
    });

    if (hasRestaurantApplication) {
      return NextResponse.json(
        { 
          error: "You have already applied for a restaurant",
          applicationId: hasRestaurantApplication.id,
          status: hasRestaurantApplication.status
        },
        { status: 409 }
      );
    }

    // ✅ Verify that the user exists and has a valid role
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
});

if (!user) {
  return NextResponse.json({ error: "User not found" }, { status: 404 });
}

// Optionally, update role if needed
if (user.role !== "RESTAURANT_OWNER") {
  await prisma.user.update({
    where: { id: user.id },
    data: { role: "RESTAURANT_OWNER" },
  });
}


    // ✅ Create application with documents in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create restaurant application
      const application = await tx.restaurantApplication.create({
        data: {
          restaurantOwnerId: session.user.id,
          status: "PENDING",
          
          // Owner Details
          ownerFirstName,
          ownerLastName,
          ownerEmail,
          ownerPhone,
          aadharNumber,
          panNumber,
          
          // Restaurant Details
          restaurantName,
          restaurantType,
          cuisineTypes,
          establishmentType,
          
          // Business Details
          fssaiNumber,
          gstNumber: gstNumber || null,
          businessLicense: businessLicense || null,
          
          // Address
          addressLine1,
          addressLine2: addressLine2 || null,
          city,
          state,
          pincode,
          landmark: landmark || null,
          
          // Operations
          openingTime,
          closingTime,
          seatingCapacity: parseInt(seatingCapacity),
          isPureVeg: Boolean(isPureVeg),
          hasParking: Boolean(hasParking),
          hasWifi: Boolean(hasWifi),
          hasAC: Boolean(hasAC),
          
          // Banking
          accountName,
          accountNumber,
          ifscCode,
          bankName,
          branchName,
          accountType,
          
          // Terms
          termsAccepted: Boolean(termsAccepted),
          commissionAgreed: Boolean(commissionAgreed),
        }
      });

      // ✅ Create document records
      const documentPromises = [];

      // Aadhar document
      documentPromises.push(
        tx.applicationDocument.create({
          data: {
            applicationId: application.id,
            documentType: 'AADHAR',
            fileName: 'aadhar.pdf',
            fileUrl: documents.aadhar,
            fileSize: 0, // You can extract this from upload response
            mimeType: 'application/pdf',
            status: 'PENDING'
          }
        })
      );

      // PAN document
      documentPromises.push(
        tx.applicationDocument.create({
          data: {
            applicationId: application.id,
            documentType: 'PAN',
            fileName: 'pan.pdf',
            fileUrl: documents.pan,
            fileSize: 0,
            mimeType: 'application/pdf',
            status: 'PENDING'
          }
        })
      );

      // FSSAI document
      documentPromises.push(
        tx.applicationDocument.create({
          data: {
            applicationId: application.id,
            documentType: 'FSSAI',
            fileName: 'fssai.pdf',
            fileUrl: documents.fssai,
            fileSize: 0,
            mimeType: 'application/pdf',
            status: 'PENDING'
          }
        })
      );

      // GST document (optional)
      if (documents.gst) {
        documentPromises.push(
          tx.applicationDocument.create({
            data: {
              applicationId: application.id,
              documentType: 'GST',
              fileName: 'gst.pdf',
              fileUrl: documents.gst,
              fileSize: 0,
              mimeType: 'application/pdf',
              status: 'PENDING'
            }
          })
        );
      }

      // Bank statement (optional)
      if (documents.bankStatement) {
        documentPromises.push(
          tx.applicationDocument.create({
            data: {
              applicationId: application.id,
              documentType: 'BANK_STATEMENT',
              fileName: 'bank_statement.pdf',
              fileUrl: documents.bankStatement,
              fileSize: 0,
              mimeType: 'application/pdf',
              status: 'PENDING'
            }
          })
        );
      }

      // Restaurant photos
      if (documents.restaurantPhotos && documents.restaurantPhotos.length > 0) {
        documents.restaurantPhotos.forEach((photoUrl: string, index: number) => {
          documentPromises.push(
            tx.applicationDocument.create({
              data: {
                applicationId: application.id,
                documentType: 'RESTAURANT_PHOTO',
                fileName: `restaurant_photo_${index + 1}.jpg`,
                fileUrl: photoUrl,
                fileSize: 0,
                mimeType: 'image/jpeg',
                status: 'PENDING'
              }
            })
          );
        });
      }

      // Create all documents
      await Promise.all(documentPromises);

      return application;
    });

    // Get super admins
    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPERADMIN' },
      select: { id: true, email: true, name: true }
    });

    // Create notifications and publish
    if (superAdmins.length > 0) {
      await Promise.all(
        superAdmins.map(admin => 
          prisma.notification.create({
            data: {
              userId: admin.id,
              type: 'NEW_APPLICATION',
              title: 'New Restaurant Application',
              message: `${restaurantName} by ${ownerFirstName} ${ownerLastName}`,
            }
          })
        )
      );

      await Promise.all(
        superAdmins.map(admin => incrementUnreadCount(admin.id))
      );

      await publishNotification(CHANNELS.NEW_APPLICATION, {
        applicationId: result.id,
        restaurantName: restaurantName,
        ownerName: `${ownerFirstName} ${ownerLastName}`,
        submittedAt: result.submittedAt,
        adminIds: superAdmins.map(admin => admin.id),
      });
    }

    // Clean up Redis session
  if (sessionId) {
  try {
    console.log(`Attempting to delete key: form:${sessionId}`);
    const deletedCount = await redis.del(`form:${sessionId}`); // ✅ Use different variable name
    console.log(`✅ Redis cleanup: ${deletedCount > 0 ? 'success' : 'key not found'}`);
  } catch (redisError) {
    // Don't fail the request if Redis cleanup fails
    console.error('❌ Redis cleanup failed:', redisError);
  }
}
    return NextResponse.json(
      { 
        success: true,
        message: "Restaurant application submitted successfully! You will be notified once reviewed.",
        applicationId: result.id 
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Restaurant application error:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A restaurant with this information already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create restaurant application",
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};