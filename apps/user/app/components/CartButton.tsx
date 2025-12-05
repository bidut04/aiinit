'use client';

import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/app/store/cartStore";

export function CartButton() {
  const router = useRouter();
  const itemCount = useCartStore((state) => state.itemCount);

  return (
    <button 
      onClick={() => router.push('/cart')}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <ShoppingCart className="text-gray-700" size={24} />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-in zoom-in">
          {itemCount}
        </span>
      )}
    </button>
  );
}