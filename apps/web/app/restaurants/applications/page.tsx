'use client'
import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, Eye, Mail, Phone, MapPin, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Define proper TypeScript interfaces matching your API
interface Document {
  id: string;
  applicationId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RestaurantOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ApiApplication {
  id: string;
  applicationNumber: string;
  restaurantName: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  fssaiNumber: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  restaurantType: string;
  cuisineTypes: string[];
  seatingCapacity: number;
  submittedAt: string;
  status: string;
  restaurantOwner: RestaurantOwner;
  documents: Document[];
  fullAddress: string;
}

interface ApiResponse {
  success: boolean;
  data: ApiApplication[];
  count: number;
}

interface Restaurant {
  id: string;
  image: string;
  name: string;
  email: string;
  phone: string;
  fssaiNumber: string;
  address: string;
  fssaiDoc: string;
  applicationNumber: string;
  status: string;
  ownerFirstName: string;
  ownerLastName: string;
  restaurantType: string;
  cuisineTypes: string[];
  submittedAt: string;
  fullAddress: string;
  seatingCapacity: number;
  documents: Document[];
  restaurantOwner: RestaurantOwner;
}

export default function RestaurantManagement() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch applications from API
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/restaurants/pending-application');
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const data: ApiResponse = await response.json();
      console.log('API Response:', data);
      
      // Transform API data to match component structure
      const transformedData: Restaurant[] = data.data.map((app) => ({
        id: app.id,
        image: '🍽️',
        name: app.restaurantName,
        email: app.ownerEmail,
        phone: app.ownerPhone,
        fssaiNumber: app.fssaiNumber,
        address: app.fullAddress,
        fssaiDoc: app.documents.find(doc => doc.documentType === 'FSSAI')?.fileName || 'No FSSAI document',
        applicationNumber: app.applicationNumber,
        status: app.status,
        ownerFirstName: app.ownerFirstName,
        ownerLastName: app.ownerLastName,
        restaurantType: app.restaurantType,
        cuisineTypes: app.cuisineTypes,
        submittedAt: app.submittedAt,
        fullAddress: app.fullAddress,
        seatingCapacity: app.seatingCapacity,
        documents: app.documents,
        restaurantOwner: app.restaurantOwner
      }));
      
      setRestaurants(transformedData);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = (applicationId: string) => {
    router.push(`/restaurants/applications/${applicationId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-l-4 border-orange-500">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Restaurant Applications
              </h1>
              <p className="text-gray-600">Review and manage restaurant applications</p>
            </div>
            <button
              onClick={fetchApplications}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <p className="text-gray-600 text-sm mb-1">Total Applications</p>
              <p className="text-3xl font-bold text-gray-800">{restaurants.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <p className="text-gray-600 text-sm mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">
                {restaurants.filter(r => r.status === 'PENDING').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <p className="text-gray-600 text-sm mb-1">Approved</p>
              <p className="text-3xl font-bold text-green-600">
                {restaurants.filter(r => r.status === 'APPROVED').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <p className="text-gray-600 text-sm mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-600">
                {restaurants.filter(r => r.status === 'REJECTED').length}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 mb-8 text-center">
            <Loader2 size={48} className="animate-spin mx-auto text-orange-500 mb-4" />
            <p className="text-gray-600 text-lg">Loading applications...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <X size={24} className="text-red-500" />
              <div>
                <h3 className="font-bold text-red-800">Error Loading Applications</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchApplications}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && restaurants.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <FileText size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No Applications Found</h3>
            <p className="text-gray-500">There are no restaurant applications at the moment.</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && restaurants.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Restaurant</th>
                    <th className="px-6 py-4 text-left font-semibold">Owner</th>
                    <th className="px-6 py-4 text-left font-semibold">Contact</th>
                    <th className="px-6 py-4 text-left font-semibold">FSSAI</th>
                    <th className="px-6 py-4 text-left font-semibold">Status</th>
                    <th className="px-6 py-4 text-left font-semibold">Submitted</th>
                    <th className="px-6 py-4 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map((restaurant, index) => (
                    <tr
                      key={restaurant.id}
                      className={`${
                        index % 2 === 0 ? 'bg-orange-50' : 'bg-white'
                      } hover:bg-orange-100 transition-colors border-b border-gray-200`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-2xl shadow-md flex-shrink-0">
                            {restaurant.image}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{restaurant.name}</p>
                            <p className="text-xs text-gray-500">{restaurant.restaurantType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{restaurant.ownerFirstName} {restaurant.ownerLastName}</p>
                        <p className="text-sm text-gray-500">{restaurant.applicationNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail size={14} className="text-orange-500" />
                          <p className="text-sm text-gray-600">{restaurant.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-orange-500" />
                          <p className="text-sm text-gray-600">{restaurant.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{restaurant.fssaiNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          restaurant.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          restaurant.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {restaurant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(restaurant.submittedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewApplication(restaurant.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105 shadow-md"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}