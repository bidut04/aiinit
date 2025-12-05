import { Restaurant } from "@prisma/client";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  isVeg: boolean;
  preparationTime: number;
  restaurant:Restaurant
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
}
