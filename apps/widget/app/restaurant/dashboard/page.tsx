'use client';
import React, { useState, useEffect } from 'react';
import Order_popup_Component from '@/components/Order_popup_Component';

const RestaurantDashboardPage = () => {
    const [currentOrder, setCurrentOrder] = useState(null);

    // Simulate receiving a new order (replace with WebSocket/API)
    useEffect(() => {
        // Demo: Show popup after 3 seconds
        const timer = setTimeout(() => {
            const newOrder = {
                orderId: '#ORD-12345',
                userName: 'John Doe',
                userPhone: '+91 98765 43210',
                address: '123 Main Street, Apartment 4B, New Delhi, Delhi - 110001',
                foodName: 'Margherita Pizza',
                quantity: 2,
                price: 899,
                orderTime: new Date().toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                specialInstructions: 'Extra cheese, no onions'
            };
            
            setCurrentOrder(newOrder);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    // Real WebSocket implementation (uncomment in production):
    /*
    useEffect(() => {
        const ws = new WebSocket('ws://your-backend-url/orders');
        
        ws.onmessage = (event) => {
            const newOrder = JSON.parse(event.data);
            setCurrentOrder(newOrder);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => ws.close();
    }, []);
    */

    const handleAcceptOrder = async () => {
        if (!currentOrder) return;

        try {
            // API call to accept order
            // const response = await fetch('/api/orders/accept', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ orderId: currentOrder.orderId })
            // });

            console.log('Order accepted:', currentOrder.orderId);
            
            // Close popup after accepting
            setCurrentOrder(null);
        } catch (error) {
            console.error('Error accepting order:', error);
        }
    };

    const handleRejectOrder = async () => {
        if (!currentOrder) return;

        try {
            // API call to reject order
            // const response = await fetch('/api/orders/reject', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ orderId: currentOrder.orderId })
            // });

            console.log('Order rejected:', currentOrder.orderId);
            
            // Close popup after rejecting
            setCurrentOrder(null);
        } catch (error) {
            console.error('Error rejecting order:', error);
        }
    };

    const handleClosePopup = () => {
        setCurrentOrder(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Your Dashboard Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    Restaurant Dashboard
                </h1>
                
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
                    <p className="text-gray-600">
                        Welcome to your restaurant dashboard. A new order popup will appear shortly (demo mode).
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-2">48</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm font-medium text-gray-500">Revenue Today</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-2">₹12,450</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-sm font-medium text-gray-500">Pending Orders</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <p className="font-semibold">#ORD-12344</p>
                                <p className="text-sm text-gray-600">Jane Smith - Chicken Biryani</p>
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                Completed
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <p className="font-semibold">#ORD-12343</p>
                                <p className="text-sm text-gray-600">Mike Johnson - Paneer Tikka</p>
                            </div>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                                Preparing
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Popup Component - Conditionally Rendered */}
            {currentOrder && (
                <Order_popup_Component 
                    order={currentOrder}
                    onAccept={handleAcceptOrder}
                    onReject={handleRejectOrder}
                    onClose={handleClosePopup}
                />
            )}
        </div>
    );
};

export default RestaurantDashboardPage;