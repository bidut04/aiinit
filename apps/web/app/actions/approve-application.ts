'use server';

import { prisma } from '@workspace/database';
import { getServerSession } from 'next-auth';
import { redis, publishNotification, incrementUnreadCount, CHANNELS } from '@workspace/lib';
import { revalidatePath } from 'next/cache';
import { generateOTP } from '@workspace/lib';
import { sendEmail, isValidEmail, sendRestaurantApplicationApproved } from '@workspace/lib/email';

export default async function approveRestaurantApplication(applicationId: string) {
  const session = await getServerSession();
  console.log(session);
  
  // if (session?.user?.role !== 'SUPERADMIN') {
  //   throw new Error('Unauthorized');
  // }

  try {
    // 1. Get application details
    const application = await prisma.restaurantApplication.findUnique({
      where: { id: applicationId },
      include: { 
        restaurantOwner: true 
      }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'PENDING' && application.status !== 'UNDER_REVIEW') {
      throw new Error('Application already processed');
    }

    // 2. Create restaurant slug
    const slug = application.restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // 3. Check if RestaurantOwner exists, if not create one
    console.log(application);
    
    let restaurantOwnerId = application.restaurantOwnerId;
    
    if (!restaurantOwnerId) {
      throw new Error('Restaurant owner not found in application');
    }

    // 4. Start transaction: Update application + Create RestaurantOwner + Create restaurant
    const result = await prisma.$transaction(async (tx) => {
      // Create or get RestaurantOwner (if the model requires it)
      let restaurantOwner = null;
      let ownerIdForRestaurant = null;

      try {
        restaurantOwner = await tx.restaurantOwner.findUnique({
          where: { userId: restaurantOwnerId! }
        });

        if (!restaurantOwner) {
          // Create RestaurantOwner with required fields from application
          restaurantOwner = await tx.restaurantOwner.create({
            data: {
              userId: restaurantOwnerId!,
              email: application.ownerEmail,
              phone: application.ownerPhone,
              firstName: application.ownerFirstName,
              lastName: application.ownerLastName
            }
          });
        }
        
        ownerIdForRestaurant = restaurantOwner.id;
      } catch (error) {
        // If RestaurantOwner model doesn't exist or has issues, skip it
        console.log('RestaurantOwner creation skipped:', error);
        // Use the userId directly if RestaurantOwner is not required
        ownerIdForRestaurant = restaurantOwnerId;
      }

      // Create restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: application.restaurantName,
          slug: `${slug}-${Date.now().toString(36)}`,
          cuisine: application.cuisineTypes,
          status: 'PENDING', // Restaurant needs setup before going active
          isPureVeg: application.isPureVeg,
          
          // Business details
          fssaiNumber: application.fssaiNumber,
          gstNumber: application.gstNumber,
          businessLicense: application.businessLicense,
          panNumber: application.panNumber,
          
          // Operations
          openingTime: application.openingTime,
          closingTime: application.closingTime,
          
          // Commission
          commission: application.commissionRate,
          
          // Link to owner (use the resolved ownerId)
          ownerId: ownerIdForRestaurant!,
          menu:{
create:{
  isActive:true,
}
          }
        }
      });

      // Create restaurant address
      await tx.restaurantAddress.create({
        data: {
          restaurantId: restaurant.id,
          addressLine1: application.addressLine1,
          addressLine2: application.addressLine2,
          city: application.city,
          state: application.state,
          pincode: application.pincode,
          landmark: application.landmark,
          latitude: 0, // Default to 0, can be updated later
          longitude: 0, // Default to 0, can be updated later
          isPrimary: true
        }
      });

      // Create bank details
      await tx.bankDetails.create({
        data: {
          restaurantId: restaurant.id,
          accountName: application.accountName,
          accountNumber: application.accountNumber,
          ifscCode: application.ifscCode,
          bankName: application.bankName,
          branchName: application.branchName,
          accountType: application.accountType
        }
      });

      // Update application status and link to restaurant
      const updatedApplication = await tx.restaurantApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          approvedAt: new Date(),
          reviewedBy: session?.user.id,
          restaurantId: restaurant.id
        }
      });

      // Upgrade user role to RESTAURANT_OWNER (if User model has role field)
      if (restaurantOwnerId) {
        await tx.user.update({
          where: { id: restaurantOwnerId },
          data: { role: 'RESTAURANT_OWNER' }
        }).catch(() => {
          // Silently fail if User model doesn't have role field
          console.log('User role update skipped');
        });
      }

      // Create notification for restaurant owner
      await tx.notification.create({
        data: {
          userId: restaurantOwnerId!,
          type: 'APPLICATION_APPROVED',
          title: '🎉 Application Approved!',
          message: `Your restaurant "${application.restaurantName}" has been approved. Complete your menu setup to go live!`,
            data: {
restaurantId: restaurant.id,
            restaurantName: application.restaurantName
            }
          }
      }).catch(() => {
        // Silently fail if Notification model structure is different
        console.log('Notification creation skipped');
      });

      return { updatedApplication, restaurant };
    });

    // 5. Increment unread count for owner
    if (application.restaurantOwnerId) {
      await incrementUnreadCount(application.restaurantOwnerId);
    }

    // 6. Publish notification event
    await publishNotification(CHANNELS.APPLICATION_UPDATE, {
      applicationId,
      status: 'APPROVED',
      restaurantId: result.restaurant.id,
      ownerId: application.restaurantOwnerId,
      restaurantName: application.restaurantName
    });

    // 7. Send email notification with OTP
    if (isValidEmail(application.ownerEmail)) {
  const otp = await generateOTP();
  console.log("Generated OTP for owner notification:", otp);

  await sendRestaurantApplicationApproved(
    application.ownerEmail,
    application.restaurantName,
    otp,
    'approved',
    10
  );
}
    // 8. Revalidate pages
    revalidatePath('/admin/applications');
    revalidatePath(`/admin/applications/${applicationId}`);

    return { 
      success: true, 
      restaurantId: result.restaurant.id,
      message: 'Application approved and restaurant created successfully'
    };

  } catch (error) {
    console.error('Error approving application:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to approve application');
  }
}

export async function rejectRestaurantApplication(
  applicationId: string, 
  reason: string
) {
  const session = await getServerSession();
  
  if (session?.user?.role !== 'SUPERADMIN') {
    throw new Error('Unauthorized');
  }

  try {
    const application = await prisma.restaurantApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        rejectedAt: new Date(),
        reviewedBy: session.user.id,
        rejectionReason: reason
      },
      include: { restaurantOwner: true }
    });

    // Create notification
    if (application.restaurantOwnerId) {
      await prisma.notification.create({
        data: {
          userId: application.restaurantOwnerId,
          type: 'APPLICATION_REJECTED',
          title: 'Application Rejected',
          message: `Your application for "${application.restaurantName}" was rejected. Reason: ${reason}`,
          data: {
            applicationId: applicationId,
            restaurantName: application.restaurantName
          }
        }
      }).catch(() => {
        console.log('Notification creation skipped');
      });

      await incrementUnreadCount(application.restaurantOwnerId);

      await publishNotification(CHANNELS.APPLICATION_UPDATE, {
        applicationId,
        status: 'REJECTED',
        ownerId: application.restaurantOwnerId,
        reason
      });
    }

    revalidatePath('/admin/applications');
    revalidatePath(`/admin/applications/${applicationId}`);

    return { success: true };
  } catch (error) {
    console.error('Error rejecting application:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to reject application');
  }
}