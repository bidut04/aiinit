'use client';

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import { 
  ArrowLeft, Plus, Minus, Trash2, ShoppingBag, 
  Truck, Clock, MapPin, Tag, Gift, ChevronRight,
  Percent, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/app/store/cartStore";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { getUserSocket} from "../socketComponent/client";

export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, updateQuantity, removeFromCart, subtotal, clearCart } = useCartStore();
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const deliveryFee = subtotal >= 299 ? 0 : 40;
  const discount = appliedPromo ? appliedPromo.discount : 0;
  const total = subtotal + deliveryFee - discount;

  const handleApplyPromo = () => {
    // Mock promo codes
    const promoCodes: Record<string, number> = {
      'SAVE50': 50,
      'FIRST100': 100,
      'WELCOME20': 20,
    };

    const discountAmount = promoCodes[promoCode.toUpperCase()];
    
    if (discountAmount) {
      setAppliedPromo({ code: promoCode.toUpperCase(), discount: discountAmount });
      toast.success(`Promo code applied! ₹${discountAmount} off`);
    } else {
      toast.error("Invalid promo code");
    }
  };

const handleCheckout = async () => {
  if (status === "loading") {
    return;
  }

  if (!session) {
    toast.error("Please login to place an order");
    router.push('/auth/signin?callbackUrl=/cart');
    return;
  }

  if (total < 100) {
    toast.error("Minimum order amount is ₹100");
    return;
  }

  if (items.length === 0) {
    toast.error("Your cart is empty");
    return;
  }

  setIsCheckingOut(true);
  
  try {
    const restaurantId = items[0]?.restaurant?.id;

    if (!restaurantId) {
      toast.error("Invalid cart items. Please try again.");
      setIsCheckingOut(false);
      return;
    }

    const allSameRestaurant = items.every(item => item.restaurant?.id === restaurantId);
    if (!allSameRestaurant) {
      toast.error("All items must be from the same restaurant");
      setIsCheckingOut(false);
      return;
    }

    const orderPayload = {
      items: items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        customizations: item.customizations || null
      })),
      restaurantId,
      deliveryAddress: {
        street: "123 Main St",
        city: "Mumbai",
        state: "Maharashtra",
        zipCode: "400001",
        coordinates: { lat: 19.0760, lng: 72.8777 }
      },
      specialInstructions: null,
      promoCode: appliedPromo?.code || null,
      tipAmount: 0,
      deliveryType: "DELIVERY"
    };

    console.log('📦 Placing order:', orderPayload);

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });

    // ✅ FIXED: Get response text once and handle all cases
    const responseText = await response.text();
    console.log('📥 Raw response:', responseText);

    // Check if response is empty
    if (!responseText || responseText.trim() === '') {
      console.error('❌ Empty response from server');
      throw new Error('Server returned empty response');
    }

    // Try to parse the response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse response:', responseText);
      throw new Error('Invalid JSON response from server');
    }

    // Check if request was successful
    if (!response.ok) {
      console.error('❌ API returned error status:', response.status);
      throw new Error(data.message || data.error || 'Failed to place order');
    }

  const socket = getUserSocket();
      
      if (socket?.isConnected()) {
        socket.placeOrder({
          orderId: data.order.id,
          restaurantId: data.order.restaurantId,
          userId: session.user.id,
          items: data.order.items,
          total: data.order.total,
          deliveryAddress: data.order.deliveryAddress,
        });
      } else {
        console.warn('Socket not connected, order placed but no real-time notification');
      }
    // Check for success flag in response
    if (!data.success) {
      throw new Error(data.message || 'Failed to place order');
    }

    console.log('✅ Order created:', data);

    // Success
    toast.success("Order placed successfully!", {
      description: `Order #${data.data.orderNumber}`,
      duration: 5000
    });
    
    clearCart();
    const orderId=data.data.id
    setTimeout(() => {
      router.push(`/orders/${orderId}`);
    }, 1000);
    
  } catch (error: any) {
    console.error('❌ Checkout error:', error);
    toast.error(error.message || "Failed to place order. Please try again.");
  } finally {
    setIsCheckingOut(false);
  }
};

  const freeDeliveryProgress = Math.min((subtotal / 299) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-600 hover:text-red-700">
              Clear Cart
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Your Cart</h1>
              <Badge variant="secondary" className="text-sm">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>

            {items.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingBag className="h-20 w-20 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">Add some delicious items to get started</p>
                <Button onClick={() => router.push('/')} size="lg">
                  Browse Menu
                </Button>
              </Card>
            ) : (
              <>
                {/* Free Delivery Progress */}
                {subtotal < 299 && (
                  <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <div className="flex items-start gap-3">
                      <Truck className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">
                          Add ₹{299 - subtotal} more for FREE delivery
                        </p>
                        <div className="mt-2 bg-white rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-green-500 h-full transition-all duration-500"
                            style={{ width: `${freeDeliveryProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Cart Items */}
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <Card key={`${item.id}-${index}`} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex gap-4">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-24 h-24 rounded-lg object-cover" 
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base line-clamp-1">{item.name}</h3>
                          {item.restaurant && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {item.restaurant.name}
                            </p>
                          )}
                          
                          {/* Customizations */}
                          {item.customizations && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.customizations.spiceLevel && (
                                <Badge variant="outline" className="text-xs capitalize">
                                  {item.customizations.spiceLevel} spice
                                </Badge>
                              )}
                              {item.customizations.extraCheese && (
                                <Badge variant="outline" className="text-xs">Extra Cheese</Badge>
                              )}
                              {item.customizations.extraToppings && (
                                <Badge variant="outline" className="text-xs">Extra Toppings</Badge>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-lg font-bold text-primary">₹{item.price}</p>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-semibold">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end justify-between">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <p className="font-bold text-lg">₹{item.price * item.quantity}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Order Summary Section */}
          {items.length > 0 && (
            <div className="lg:col-span-1 space-y-4">
              {/* Authentication Warning */}
              {!session && status !== "loading" && (
                <Card className="p-4 bg-amber-50 border-amber-200">
                  <p className="text-sm text-amber-800 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    Please login to place your order
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => router.push('/auth/signin?callbackUrl=/cart')}
                  >
                    Login Now
                  </Button>
                </Card>
              )}

              {/* Delivery Info */}
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Delivery in 30-40 mins</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm">Mumbai 400001</span>
                  <Button variant="link" size="sm" className="ml-auto p-0 h-auto text-xs">
                    Change
                  </Button>
                </div>
              </Card>

              {/* Promo Code */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-orange-500" />
                  <h3 className="font-semibold text-sm">Apply Promo Code</h3>
                </div>
                
                {!appliedPromo ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="text-sm"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleApplyPromo}
                      disabled={!promoCode}
                    >
                      Apply
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-semibold text-green-900">{appliedPromo.code}</p>
                        <p className="text-xs text-green-700">-₹{appliedPromo.discount}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setAppliedPromo(null);
                        setPromoCode("");
                      }}
                      className="h-8 text-xs"
                    >
                      Remove
                    </Button>
                  </div>
                )}
                
                <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200">
                  <p className="text-xs text-amber-800 flex items-start gap-1">
                    <Gift className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    Try: SAVE50, FIRST100, WELCOME20
                  </p>
                </div>
              </Card>

              {/* Bill Summary */}
              <Card className="p-4 sticky top-24">
                <h3 className="font-bold mb-4">Bill Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Item Total</span>
                    <span className="font-medium">₹{subtotal}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className={`font-medium ${deliveryFee === 0 ? "text-green-600" : ""}`}>
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>
                  
                  {appliedPromo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Discount</span>
                      <span className="font-medium text-green-600">-₹{discount}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3 flex justify-between text-base">
                    <span className="font-bold">To Pay</span>
                    <span className="font-bold text-xl text-primary">₹{total}</span>
                  </div>
                </div>

                {total < 100 && (
                  <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-800 flex items-start gap-1">
                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      Minimum order: ₹100. Add ₹{Math.max(0, 100 - total)} more.
                    </p>
                  </div>
                )}

                <Button 
                  className="w-full mt-4 text-base h-12" 
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isCheckingOut || total < 100 || status === "loading" || !session}
                >
                  {isCheckingOut ? (
                    <>
                      <span className="animate-pulse">Processing...</span>
                    </>
                  ) : !session ? (
                    <>Login to Order</>
                  ) : (
                    <>
                      Place Order
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-3">
                  By placing order, you agree to our terms
                </p>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}