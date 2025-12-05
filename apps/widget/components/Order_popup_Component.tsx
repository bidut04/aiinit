import React, { useState } from 'react';
import { X, User, MapPin, Package, DollarSign, Clock } from 'lucide-react';

function Order_popup_Component() {
  const [isOpen, setIsOpen] = useState(true);
  const [orderStatus, setOrderStatus] = useState('pending');

  // Sample order data
  const orderData = {
    orderId: '#ORD-12345',
    userName: 'John Doe',
    userPhone: '+91 98765 43210',
    address: '123 Main Street, Apartment 4B, New Delhi, Delhi - 110001',
    foodName: 'Margherita Pizza',
    quantity: 2,
    price: 899,
    orderTime: '2:30 PM',
    specialInstructions: 'Extra cheese, no onions'
  };

  const handleAccept = () => {
    setOrderStatus('accepted');
    setTimeout(() => setIsOpen(false), 1500);
  };

  const handleReject = () => {
    setOrderStatus('rejected');
    setTimeout(() => setIsOpen(false), 1500);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <button 
          onClick={() => setIsOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Show Order Popup
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <h2 className="text-2xl font-bold mb-1">New Order</h2>
          <p className="text-orange-100 text-sm">{orderData.orderId}</p>
        </div>

        {/* Order Details */}
        <div className="p-6 space-y-4">
          {/* User Info */}
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-semibold text-gray-900">{orderData.userName}</p>
              <p className="text-sm text-gray-600">{orderData.userPhone}</p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Delivery Address</p>
              <p className="text-sm text-gray-900">{orderData.address}</p>
            </div>
          </div>

          {/* Food Details */}
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Order Items</p>
              <div className="flex justify-between items-center mt-1">
                <p className="font-semibold text-gray-900">{orderData.foodName}</p>
                <span className="text-sm text-gray-600">x{orderData.quantity}</span>
              </div>
              {orderData.specialInstructions && (
                <p className="text-xs text-gray-500 mt-1 italic">Note: {orderData.specialInstructions}</p>
              )}
            </div>
          </div>

          {/* Price & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-lg font-bold text-gray-900">₹{orderData.price}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Time</p>
                <p className="text-lg font-bold text-gray-900">{orderData.orderTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {orderStatus !== 'pending' && (
          <div className={`mx-6 mb-4 p-3 rounded-lg text-center font-semibold ${
            orderStatus === 'accepted' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {orderStatus === 'accepted' ? '✓ Order Accepted!' : '✗ Order Rejected'}
          </div>
        )}

        {/* Action Buttons */}
        {orderStatus === 'pending' && (
          <div className="p-6 pt-0 flex space-x-3">
            <button
              onClick={handleReject}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Accept Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Order_popup_Component;