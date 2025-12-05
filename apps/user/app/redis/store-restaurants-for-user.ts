// ============================================
// Redis Cache Helper - lib/cache.ts or app/lib/cache.ts
// ============================================
// 'use server';

// app/redis/store-restaurants-for-user.ts

// import { redis } from "@workspace/lib";
import { redis } from '../lib/redis';
// import { redis } from "@workspace/lib/src/redis";
// Add this debug line right after the import

// app/redis/store-restaurants-for-user.ts

// import * as LibModule from "@workspace/lib";

// console.log('🔍 Full lib module:', LibModule);
// console.log('🔍 Redis from lib:', LibModule.redis);
// console.log('🔍 Keys in lib:', Object.keys(LibModule));
// console.log('🔍 Cache file - redis client:', redis);
// console.log('🔍 Cache file - redis type:', typeof redis);

// ... rest of your code
// import { redis } from '@workspace/lib/redis';

// 'use server';

// import { redis } from "@workspace/lib/dist/redis";  // ← FIXED


// Cache TTL in seconds
const CACHE_TTL = {
  RESTAURANTS: 3600,    // 1 hour
  MENU_ITEMS: 3600,     // 1 hour
  ALL_MENU_ITEMS: 1800, // 30 minutes (for list of all items)
} as const;

// Generate cache keys
export const getCacheKey = {
  restaurant: (restaurantId: string) => `restaurant:${restaurantId}`,
  menuItem: (menuItemId: string) => `menuitem:${menuItemId}`,
  allMenuItems: () => `menuitems:all`,
  restaurantMenuItems: (restaurantId: string) => `restaurant:${restaurantId}:menuitems`,
} as const;

// ============================================
// Menu Item Cache Functions
// ============================================

/**
 * Get a single menu item from cache
 */
export async function getCachedMenuItem(menuItemId: string) {
  try {
    const cached = await redis.get(getCacheKey.menuItem(menuItemId));
    
    if (cached) {
      console.log(`✅ Cache HIT: MenuItem ${menuItemId}`);
      return JSON.parse(cached as string);
    }
    
    console.log(`❌ Cache MISS: MenuItem ${menuItemId}`);
    return null;
  } catch (error) {
    console.error('Error getting cached menu item:', error);
    return null;
  }
}

/**
 * Get all menu items from cache
 */
export async function getCachedAllMenuItems() {
  try {
    const cached = await redis.get(getCacheKey.allMenuItems());
    
    if (cached) {
      console.log(`✅ Cache HIT: All menu items`);
      return JSON.parse(cached as string);
    }
    
    console.log(`❌ Cache MISS: All menu items`);
    return null;
  } catch (error) {
    console.error('Error getting cached all menu items:', error);
    return null;
  }
}

/**
 * Set a single menu item in cache
 */
export async function setCachedMenuItem(menuItemId: string, menuItem: any) {
  try {
    await redis.set(
      getCacheKey.menuItem(menuItemId),
      JSON.stringify(menuItem),
       {
        ex: CACHE_TTL.MENU_ITEMS
      }
    );
    console.log(`✅ Cached menu item: ${menuItemId}`);
  } catch (error) {
    console.error('Error caching menu item:', error);
  }
}

/**
 * Set all menu items in cache
 */
export async function setCachedAllMenuItems(menuItems: any[]) {
  try {
    await redis.set(
      getCacheKey.allMenuItems(),
      JSON.stringify(menuItems),
      {
      ex:CACHE_TTL.ALL_MENU_ITEMS
      }
    );
    console.log(`✅ Cached ${menuItems.length} menu items`);
  } catch (error) {
    console.error('Error caching all menu items:', error);
  }
}

/**
 * Invalidate a single menu item cache
 */
export async function invalidateMenuItemCache(menuItemId: string) {
  try {
    await redis.del(getCacheKey.menuItem(menuItemId));
    console.log(`🗑️ Invalidated cache for menu item: ${menuItemId}`);
  } catch (error) {
    console.error('Error invalidating menu item cache:', error);
  }
}

/**
 * Invalidate all menu items cache
 */
export async function invalidateAllMenuItemsCache() {
  try {
    await redis.del(getCacheKey.allMenuItems());
    console.log(`🗑️ Invalidated all menu items cache`);
  } catch (error) {
    console.error('Error invalidating all menu items cache:', error);
  }
}

/**
 * Invalidate both single item and list cache
 */
export async function invalidateMenuItemCaches(menuItemId: string) {
  try {
    await Promise.all([
      redis.del(getCacheKey.menuItem(menuItemId)),
      redis.del(getCacheKey.allMenuItems())
    ]);
    console.log(`🗑️ Invalidated caches for menu item: ${menuItemId}`);
  } catch (error) {
    console.error('Error invalidating menu item caches:', error);
  }
}

// ============================================
// Restaurant Cache Functions
// ============================================

export async function getCachedRestaurant(restaurantId: string) {
  try {
    const cached = await redis.get(getCacheKey.restaurant(restaurantId));
    
    if (cached) {
      console.log(`✅ Cache HIT: Restaurant ${restaurantId}`);
      return JSON.parse(cached as string);
    }
    
    console.log(`❌ Cache MISS: Restaurant ${restaurantId}`);
    return null;
  } catch (error) {
    console.error('Error getting cached restaurant:', error);
    return null;
  }
}

export async function setCachedRestaurant(restaurantId: string, restaurant: any) {
  try {
    await redis.set(
      getCacheKey.restaurant(restaurantId),
      JSON.stringify(restaurant),
      {
      ex:CACHE_TTL.RESTAURANTS
      }
    );
    console.log(`✅ Cached restaurant: ${restaurantId}`);
  } catch (error) {
    console.error('Error caching restaurant:', error);
  }
}

export async function invalidateRestaurantCache(restaurantId: string) {
  try {
    await redis.del(getCacheKey.restaurant(restaurantId));
    console.log(`🗑️ Invalidated cache for restaurant: ${restaurantId}`);
  } catch (error) {
    console.error('Error invalidating restaurant cache:', error);
  }
}

