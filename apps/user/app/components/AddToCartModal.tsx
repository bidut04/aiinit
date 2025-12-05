'use client';

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Plus, Minus, Star, Clock, Flame, Leaf } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/app/store/cartStore";

export function AddToCartModal() {
  const { isModalOpen, selectedItem, closeModal, addToCart } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [customizations, setCustomizations] = useState({
    spiceLevel: "medium",
    extraCheese: false,
    extraToppings: false,
  });

  if (!selectedItem) return null;

  const handleAddToCart = () => {
    const cartItem = {
      id: selectedItem.id,
      name: selectedItem.name,
      price: selectedItem.price,
      image: selectedItem.image,
      quantity,
      restaurant: selectedItem.restaurant,
      customizations,
    };

    addToCart(cartItem);
    
    toast.success(`${quantity}x ${selectedItem.name} added to cart!`, {
      description: `Total: ₹${selectedItem.price * quantity}`,
    });
    
    // Reset for next time
    setQuantity(1);
    setCustomizations({
      spiceLevel: "medium",
      extraCheese: false,
      extraToppings: false,
    });
  };

  const totalPrice = selectedItem.price * quantity;

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-0">
        {/* Image Header */}
        <div className="relative h-48 w-full">
          <img
            src={selectedItem.image}
            alt={selectedItem.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge className="bg-white/95 backdrop-blur-sm text-gray-900">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-1" />
              {selectedItem.rating}
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Title & Info */}
          <div>
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedItem.name}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {selectedItem.description}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedItem.isVeg ? (
                <Badge className="bg-emerald-500 text-white">
                  <Leaf className="h-3 w-3 mr-1" />
                  Veg
                </Badge>
              ) : (
                <Badge className="bg-red-500 text-white">🍗 Non-Veg</Badge>
              )}
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {selectedItem.preparationTime} mins
              </Badge>
              {selectedItem.isSpicy && (
                <Badge className="bg-orange-500 text-white">
                  <Flame className="h-3 w-3 mr-1" />
                  Spicy
                </Badge>
              )}
            </div>
          </div>

          {/* Customizations */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-semibold text-sm">Customize Your Order</h4>
            
            {/* Spice Level */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Spice Level</label>
              <div className="flex gap-2">
                {["mild", "medium", "hot"].map((level) => (
                  <Button
                    key={level}
                    variant={customizations.spiceLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCustomizations({ ...customizations, spiceLevel: level })}
                    className="flex-1 capitalize"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Add-ons (+₹20 each)</label>
              <div className="flex gap-2">
                <Button
                  variant={customizations.extraCheese ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCustomizations({ ...customizations, extraCheese: !customizations.extraCheese })}
                  className="flex-1"
                >
                  Extra Cheese
                </Button>
                <Button
                  variant={customizations.extraToppings ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCustomizations({ ...customizations, extraToppings: !customizations.extraToppings })}
                  className="flex-1"
                >
                  Extra Toppings
                </Button>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between border-t pt-4">
            <span className="font-semibold">Quantity</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-xl font-bold w-8 text-center">{quantity}</span>
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
          <div className="space-y-2 pt-2">
            <Button
              onClick={handleAddToCart}
              size="lg"
              className="w-full gap-2 text-lg h-12"
            >
              Add to Cart - ₹{totalPrice}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Free delivery on orders above ₹299
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}