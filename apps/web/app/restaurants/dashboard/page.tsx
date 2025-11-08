
'use client'
import { TrendingUp, DollarSign, Users } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Welcome to Super Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your business today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Total Orders</h3>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">1,234</p>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <span>↑ 12%</span>
            <span className="text-gray-500">from last month</span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Revenue</h3>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">$45,678</p>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <span>↑ 8%</span>
            <span className="text-gray-500">from last month</span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Active Users</h3>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">8,901</p>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <span>↑ 15%</span>
            <span className="text-gray-500">from last month</span>
          </p>
        </div>
      </div>
    </div>
  );
}