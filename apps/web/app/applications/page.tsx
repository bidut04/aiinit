import { prisma } from '@workspace/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@workspace/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { NotificationBell } from '@/components/NotificationBell';

export default async function AdminApplicationsPage() {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and is a super admin
  if (!session?.user?.id || session?.user?.role !== 'SUPERADMIN') {
    redirect('/');
  }

  const applications = await prisma.restaurantApplication.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' } // Changed from submittedAt to createdAt (more common)
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Restaurant Applications</h1>
          <NotificationBell />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No pending applications</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {applications.map(app => (
              <div key={app.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{app.restaurantName}</h3>
                    <p className="text-gray-600">
                      Owner: {app.ownerFirstName} {app.ownerLastName}
                    </p>
                    <p className="text-sm text-gray-500">{app.ownerEmail}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Applied: {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    Pending
                  </span>
                </div>
                <div className="mt-4 flex gap-3">
                  <Link
                    href={`/admin/applications/${app.id}`}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Review Application
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}