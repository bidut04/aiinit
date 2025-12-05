// ============================================
// 3. Food Detail Page - app/foodItem/[fooditemId]/page.tsx
// ============================================
'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Card } from "@workspace/ui/components/card";
import { 
  ArrowLeft, Star, Clock, Plus, Minus, 
  Flame, Leaf, ShoppingCart, Heart 
} from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/app/store/cartStore";

export default function FoodItemPage() {
  const router = useRouter();
  const params = useParams();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const fooditemId = Array.isArray(params.fooditemId) 
          ? params.fooditemId[0] 
          : params.fooditemId;
        
        if (!fooditemId) {
          toast.error("Invalid food item");
          router.push('/');
          return;
        }

        const res = await fetch(`/api/foodItem/${fooditemId}`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.success) {
          setItem(data.data);
        } else {
          toast.error(data.message || "Food item not found");
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching food item:', error);
        toast.error("Failed to load food item");
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    if (params.fooditemId) {
      fetchItem();
    }
  }, [params.fooditemId, router]);

  const handleAddToCart = () => {
    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity,
      restaurant: item.restaurant,
    };

    addToCart(cartItem);
    
    toast.success(`${quantity}x ${item.name} added to cart!`, {
      description: `Total: ₹${item.price * quantity}`
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full p-3 shadow-lg hover:scale-110 transition-transform"
              >
                <Heart
                  className={`h-5 w-5 ${
                    isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
                  }`}
                />
              </button>
            </div>

            {/* Restaurant Info Card */}
            {item.restaurant && (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-1">From</p>
                <h3 className="font-bold text-lg">{item.restaurant.name}</h3>
              </Card>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Title & Rating */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{item.name}</h1>
                <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{item.rating}</span>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {item.isVeg ? (
                <Badge className="bg-emerald-500 text-white">
                  <Leaf className="h-3 w-3 mr-1" />
                  Vegetarian
                </Badge>
              ) : (
                <Badge className="bg-red-500 text-white">
                  🍗 Non-Vegetarian
                </Badge>
              )}
              
              {item.isSpicy && (
                <Badge className="bg-orange-500 text-white">
                  <Flame className="h-3 w-3 mr-1" />
                  Spicy
                </Badge>
              )}

              {item.category && (
                <Badge variant="outline">{item.category.name}</Badge>
              )}

              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {item.preparationTime} mins
              </Badge>
            </div>

            {/* Price */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold text-primary">₹{item.price}</span>
                {item.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{item.originalPrice}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Per serving</p>
            </Card>

            {/* Quantity Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  disabled={quantity >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleAddToCart}
                size="lg"
                className="w-full gap-2 text-lg h-14 shadow-xl hover:shadow-2xl transition-all"
              >
                <ShoppingCart className="h-5 w-5" />
                Add {quantity} to Cart - ₹{item.price * quantity}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Free delivery on orders above ₹299
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}