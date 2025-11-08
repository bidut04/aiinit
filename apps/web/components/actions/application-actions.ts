'use server';

import { prisma } from '@workspace/database';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function approveRestaurantApplication(formData: FormData) {
  const session = await getServerSession();
  console.log(session);
  
  // Check if user is super admin
  if (session?.user?.role !== 'SUPERADMIN') {
    throw new Error('Unauthorized: Only super admins can approve applications');
  }

  const applicationId = formData.get('applicationId') as string;

  if (!applicationId) {
    throw new Error('Application ID is required');
  }

  try {
    // Get the application
    const application = await prisma.restaurantApplication.findUnique({
      where: { id: applicationId },
      include: {
        restaurantOwner: true
      }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'PENDING') {
      throw new Error('Only pending applications can be approved');
    }

    // Validate required fields
    if (!application.restaurantOwnerId) {
      throw new Error('Restaurant owner ID is missing');
    }

    if (!application.restaurantOwner) {
      throw new Error('Restaurant owner not found');
    }

    // Start a transaction to create restaurant and update application
    await prisma.$transaction(async (tx) => {
      // Create the restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: application.restaurantName,
          ownerId: application.restaurantOwnerId,
          type: application.restaurantType,
          cuisineTypes: application.cuisineTypes,
          addressLine1: application.addressLine1,
          addressLine2: application.addressLine2,
          city: application.city,
          state: application.state,
          pincode: application.pincode,
          landmark: application.landmark,
          phone: application.ownerPhone,
          email: application.ownerEmail,
          fssaiNumber: application.fssaiNumber,
          gstNumber: application.gstNumber,
          seatingCapacity: application.seatingCapacity,
          establishmentType: application.establishmentType,
          openingTime: application.openingTime,
          closingTime: application.closingTime,
          isPureVeg: application.isPureVeg,
          hasParking: application.hasParking,
          hasWifi: application.hasWifi,
          hasAC: application.hasAC,
          commissionRate: application.commissionRate,
          isActive: true,
          isVerified: true,
          // Banking details
          accountName: application.accountName,
          accountNumber: application.accountNumber,
          ifscCode: application.ifscCode,
          bankName: application.bankName,
          branchName: application.branchName,
          accountType: application.accountType,
        }
      });

      // Update the application status
      await tx.restaurantApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          approvedAt: new Date(),
          reviewedBy: session.user?.email || session.user?.name || 'Unknown Admin',
          restaurantId: restaurant.id
        }
      });

      // Update user role to RESTAURANT_OWNER if not already
      if (application.restaurantOwner.role !== 'RESTAURANT_OWNER') {
        await tx.user.update({
          where: { id: application.restaurantOwnerId },
          data: { role: 'RESTAURANT_OWNER' }
        });
      }
    });

    // Revalidate the applications page
    revalidatePath('/restaurants/applications');
    revalidatePath(`/restaurants/applications/${applicationId}`);
    
  } catch (error) {
    console.error('Error approving application:', error);
    throw new Error('Failed to approve application');
  }

  // Redirect to applications list
  redirect('/restaurants/applications');
}

export async function rejectRestaurantApplication(formData: FormData) {
  const session = await getServerSession();
  
  // Check if user is super admin
  if (session?.user?.role !== 'SUPERADMIN') {
    throw new Error('Unauthorized: Only super admins can reject applications');
  }

  const applicationId = formData.get('applicationId') as string;
  const rejectionReason = formData.get('rejectionReason') as string;

  if (!applicationId) {
    throw new Error('Application ID is required');
  }

  if (!rejectionReason || rejectionReason.trim().length === 0) {
    throw new Error('Rejection reason is required');
  }

  try {
    const application = await prisma.restaurantApplication.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'PENDING') {
      throw new Error('Only pending applications can be rejected');
    }

    // Update the application status
    await prisma.restaurantApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        rejectedAt: new Date(),
        reviewedBy: session.user?.email || session.user?.name || 'Unknown Admin',
        rejectionReason: rejectionReason.trim()
      }
    });

    // Revalidate the applications page
    revalidatePath('/restaurants/applications');
    revalidatePath(`/restaurants/applications/${applicationId}`);
    
  } catch (error) {
    console.error('Error rejecting application:', error);
    throw new Error('Failed to reject application');
  }

  // Redirect to applications list
  redirect('/restaurants/applications');
}