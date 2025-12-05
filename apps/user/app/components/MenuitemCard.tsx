import { MenuItem } from "@/app/types/menu";
import { Card } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Plus, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
interface MenuItemCardProps {
  item: MenuItem;
}

export const MenuItemCard = ({ item }: MenuItemCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
const router=useRouter()
  const handleAddToCart = () => {
    setIsAdding(true);
    setTimeout(() => {
      toast.success(`${item.name} added to cart!`);
      setIsAdding(false);
    }, 500);
  };
  const fooditemId=item.id;
const handlelick=async()=>{
router.push(`/foodItem/${fooditemId}`)

}
  return (
    <Card onClick={handlelick} className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/50">
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
        />
        
        {/* Rating Badge */}
        <div className="absolute top-2 right-2 z-20">
          <div className="bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-lg">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-gray-900">{item.rating}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Name */}
        <h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {item.name}
        </h3>

        {/* Restaurant Name */}
        {item.restaurant && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {item.restaurant.name}
          </p>
        )}

        {/* Price and Add Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            ₹{item.price}
          </span>
          
          <Button
            onClick={handleAddToCart}
            disabled={isAdding}
            size="sm"
            className="gap-1.5 shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:scale-100"
          >
            <Plus className={`h-4 w-4 transition-transform ${isAdding ? 'rotate-90' : ''}`} />
            {isAdding ? "Adding..." : "Add"}
          </Button>
        </div>
      </div>
    </Card>
  ); 
};