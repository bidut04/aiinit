import { prisma } from '@workspace/database';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { RejectionDialog } from '../../../../components/actions/RejectionDialog';
import { ApproveButton } from '../../../../components/actions/ApproveButton';

interface ApplicationProps {
  params: Promise<{
    applicationId: string;
  }>;
}

export default async function ApplicationDetailPage({
  params
}: ApplicationProps) {
  const session = await getServerSession();
  console.log("from session applicationId",session);
  
  // Check if user is super admin (matches Prisma schema)
  // if (session?.user?.role !== 'SUPERADMIN') {
  //   redirect('/');
  // }

  // Await params in Next.js 15
  const { applicationId } = await params;
  
  const application = await prisma.restaurantApplication.findUnique({
    where: { id: applicationId },
    include: {
      restaurantOwner: {
        select: { name: true, email: true, phone: true }
      },
      documents: true
    }
  });

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application not found</h1>
          <p className="text-gray-600">The application you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Helper function to get document URL by type
  const getDocumentUrl = (type: string) => {
    return application.documents.find(doc => doc.documentType === type)?.fileUrl || '#';
  };

  // Get restaurant photos from documents
  const restaurantPhotos = application.documents
    .filter(doc => doc.documentType === 'RESTAURANT_PHOTO')
    .map(doc => doc.fileUrl);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">{application.restaurantName}</h1>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              application.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              application.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {application.status}
            </span>
          </div>

          {/* Owner Details */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Owner Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <p className="font-medium">{application.ownerFirstName} {application.ownerLastName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="font-medium">{application.ownerEmail}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p className="font-medium">{application.ownerPhone}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">PAN Number</label>
                <p className="font-medium">{application.panNumber}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Aadhar Number</label>
                <p className="font-medium">{application.aadharNumber}</p>
              </div>
            </div>
          </section>

          {/* Restaurant Details */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Restaurant Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Type</label>
                <p className="font-medium">{application.restaurantType}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Cuisines</label>
                <p className="font-medium">{application.cuisineTypes.join(', ')}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">FSSAI License</label>
                <p className="font-medium">{application.fssaiNumber}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Seating Capacity</label>
                <p className="font-medium">{application.seatingCapacity}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">GST Number</label>
                <p className="font-medium">{application.gstNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Establishment Type</label>
                <p className="font-medium">{application.establishmentType}</p>
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Address</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">
                {application.addressLine1}
                {application.addressLine2 && `, ${application.addressLine2}`}
              </p>
              <p className="font-medium mt-1">
                {application.city}, {application.state} - {application.pincode}
              </p>
              {application.landmark && (
                <p className="text-sm text-gray-600 mt-1">
                  Landmark: {application.landmark}
                </p>
              )}
            </div>
          </section>

          {/* Operational Details */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Operational Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Opening Time</label>
                <p className="font-medium">{application.openingTime}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Closing Time</label>
                <p className="font-medium">{application.closingTime}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Pure Veg</label>
                <p className="font-medium">{application.isPureVeg ? '✓ Yes' : '✗ No'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Parking Available</label>
                <p className="font-medium">{application.hasParking ? '✓ Yes' : '✗ No'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">WiFi Available</label>
                <p className="font-medium">{application.hasWifi ? '✓ Yes' : '✗ No'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">AC Available</label>
                <p className="font-medium">{application.hasAC ? '✓ Yes' : '✗ No'}</p>
              </div>
            </div>
          </section>

          {/* Documents */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Documents</h2>
            <div className="grid grid-cols-3 gap-4">
              <a 
                href={getDocumentUrl('AADHAR')} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-4 border rounded hover:bg-gray-50 text-center"
              >
                📄 Aadhar Card
              </a>
              <a 
                href={getDocumentUrl('PAN')} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-4 border rounded hover:bg-gray-50 text-center"
              >
                📄 PAN Card
              </a>
              <a 
                href={getDocumentUrl('FSSAI')} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-4 border rounded hover:bg-gray-50 text-center"
              >
                📄 FSSAI License
              </a>
            </div>
          </section>

          {/* Restaurant Photos */}
          {restaurantPhotos.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Restaurant Photos</h2>
              <div className="grid grid-cols-4 gap-4">
                {restaurantPhotos.map((photo, idx) => (
                  <img 
                    key={idx} 
                    src={photo} 
                    alt={`Restaurant ${idx + 1}`}
                    className="w-full h-32 object-cover rounded border"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Banking Details */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Banking Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Account Name</label>
                <p className="font-medium">{application.accountName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Account Number</label>
                <p className="font-medium">{application.accountNumber}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">IFSC Code</label>
                <p className="font-medium">{application.ifscCode}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Bank Name</label>
                <p className="font-medium">{application.bankName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Branch Name</label>
                <p className="font-medium">{application.branchName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Account Type</label>
                <p className="font-medium">{application.accountType}</p>
              </div>
            </div>
          </section>

          {/* Commission Details */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Commission Agreement</h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium text-blue-900">
                Commission Rate: {application.commissionRate}%
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Terms Accepted: {application.termsAccepted ? '✓ Yes' : '✗ No'}
              </p>
              <p className="text-sm text-blue-700">
                Commission Agreed: {application.commissionAgreed ? '✓ Yes' : '✗ No'}
              </p>
            </div>
          </section>

          {/* Application Timeline */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Application Timeline</h2>
            <div className="space-y-2">
              <div>
                <label className="text-sm text-gray-600">Submitted At</label>
                <p className="font-medium">{new Date(application.submittedAt).toLocaleString()}</p>
              </div>
              {application.reviewedAt && (
                <div>
                  <label className="text-sm text-gray-600">Reviewed At</label>
                  <p className="font-medium">{new Date(application.reviewedAt).toLocaleString()}</p>
                </div>
              )}
              {application.approvedAt && (
                <div>
                  <label className="text-sm text-gray-600">Approved At</label>
                  <p className="font-medium">{new Date(application.approvedAt).toLocaleString()}</p>
                </div>
              )}
              {application.rejectedAt && (
                <div>
                  <label className="text-sm text-gray-600">Rejected At</label>
                  <p className="font-medium">{new Date(application.rejectedAt).toLocaleString()}</p>
                </div>
              )}
              {application.reviewedBy && (
                <div>
                  <label className="text-sm text-gray-600">Reviewed By</label>
                  <p className="font-medium">{application.reviewedBy}</p>
                </div>
              )}
              {application.rejectionReason && (
                <div>
                  <label className="text-sm text-gray-600">Rejection Reason</label>
                  <p className="font-medium text-red-600">{application.rejectionReason}</p>
                </div>
              )}
            </div>
          </section>

          {/* Approval Actions */}
          {application.status === 'PENDING' && (
            <div className="flex gap-4 mt-8 pt-8 border-t">
              <ApproveButton applicationId={application.id} />
              <RejectionDialog applicationId={application.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}