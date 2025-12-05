// ============================================
// 1. ZUSTAND STORE - The Single Source of Truth
// File: app/store/cartStore.ts
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  restaurant?: {
    id: string;
    name: string;
  };
  customizations?: {
    spiceLevel?: string;
    extraCheese?: boolean;
    extraToppings?: boolean;
    specialInstructions?: string;
  };
}

interface CartStore {
  // State
  items: CartItem[];
  isModalOpen: boolean;
  selectedItem: any | null;
  
  // Computed values
  itemCount: number;
  subtotal: number;
  
  // Actions
  openModal: (item: any) => void;
  closeModal: () => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Private helpers
  _calculateTotals: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial State
      items: [],
      isModalOpen: false,
      selectedItem: null,
      itemCount: 0,
      subtotal: 0,

      // Open modal with selected item
      openModal: (item) => {
        set({ isModalOpen: true, selectedItem: item });
      },

      // Close modal
      closeModal: () => {
        set({ isModalOpen: false, selectedItem: null });
      },

      // Add item to cart
      addToCart: (newItem) => {
        const items = get().items;
        const existingItemIndex = items.findIndex(
          (item) => 
            item.id === newItem.id && 
            JSON.stringify(item.customizations) === JSON.stringify(newItem.customizations)
        );

        if (existingItemIndex > -1) {
          // Item exists with same customizations - increase quantity
          const updatedItems = [...items];
          const existingItem = updatedItems[existingItemIndex];
          if (existingItem) {
            existingItem.quantity += newItem.quantity;
          }
          set({ items: updatedItems });
        } else {
          // New item - add to cart
          set({ items: [...items, newItem] });
        }
        
        get()._calculateTotals();
        get().closeModal();
      },

      // Remove item from cart
      removeFromCart: (itemId) => {
        set({ items: get().items.filter((item) => item.id !== itemId) });
        get()._calculateTotals();
      },

      // Update item quantity
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }
        
        const updatedItems = get().items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
        set({ items: updatedItems });
        get()._calculateTotals();
      },

      // Clear entire cart
      clearCart: () => {
        set({ items: [], itemCount: 0, subtotal: 0 });
      },

      // Calculate totals
      _calculateTotals: () => {
        const items = get().items;
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        set({ itemCount, subtotal });
      },
    }),
    {
      name: 'foodhub-cart', // localStorage key
      storage: createJSONStorage(() => localStorage), // persist to localStorage
      partialize: (state) => ({ 
        items: state.items // only persist items, not modal state
      }),
    }
  )
);