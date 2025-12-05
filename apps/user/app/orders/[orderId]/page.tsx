'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { 
  ArrowLeft, Package, Clock, CheckCircle, 
  XCircle, Truck, MapPin 
} from "lucide-react";
import { toast } from "sonner";

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [params.orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.orderId}`);
      const data = await response.json();

      if (data.success) {
        setOrder(data.data);
      } else {
        toast.error("Order not found");
        router.push('/orders');
      }
    } catch (error) {
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const response = await fetch(`/api/orders/${params.orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'cancel',
          reason: 'Customer requested cancellation'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Order cancelled");
        fetchOrder(); // Refresh order
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to cancel order");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!order) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'ACCEPTED': return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'PREPARING': return <Package className="h-5 w-5 text-orange-500" />;
      case 'READY': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'OUT_FOR_DELIVERY': return <Truck className="h-5 w-5 text-purple-500" />;
      case 'DELIVERED': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'CANCELLED': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* Order Header */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
                <p className="text-sm text-muted-foreground">
                  Placed on {new Date(order.orderDate).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                <Badge className="text-base capitalize">
                  {order.status.toLowerCase().replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {/* Cancel Button */}
            {['PENDING', 'ACCEPTED'].includes(order.status) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelOrder}
              >
                Cancel Order
              </Button>
            )}
          </Card>

          {/* Order Items */}
          <Card className="p-6">
            <h2 className="font-bold text-lg mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <img
                    src={item.menuItem.image}
                    alt={item.menuItem.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.menuItem.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × ₹{item.price}
                    </p>
                  </div>
                  <p className="font-bold">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Bill Summary */}
          <Card className="p-6">
            <h2 className="font-bold text-lg mb-4">Bill Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>₹{order.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>₹{order.taxAmount}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>₹{order.totalAmount}</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}