import { redis } from "@workspace/lib";
const CACHE_TTL={
CATEGORIES:3600,
MENU_ITEMS:3600,
RESTAURANT_MENU: 1800

}

export const getCacheKey={
    categories:(restaurantId:string)=>`restaurant:${restaurantId}:categories`,
    menuItems:(categoryId:string)=>`category:${categoryId}:menuItems`,
    fullMenu: (restaurantId: string) => `restaurant:${restaurantId}:fullMenu`
}


export async function getCachedCategories(restaurantId: string) {
  try {
    const cached = await redis.get(getCacheKey.fullMenu(restaurantId));
    if (cached) {
      console.log(`✅ Cache HIT: Restaurant ${restaurantId}`);
      return JSON.parse(cached as string);
    }
    console.log(`❌ Cache MISS: Restaurant ${restaurantId}`);
    return null;
  } catch (error) {
    console.error('Error getting cached categories:', error);
    return null;
  }
}

export async function setCachedCategories(restaurantId:string,categories:any){
    try{
await redis.set(getCacheKey.fullMenu(restaurantId),JSON.stringify(categories),{ex:CACHE_TTL.RESTAURANT_MENU})
console.log(`✅ Cached categories for restaurant ${restaurantId}`);
  } catch (error) {
    console.error('Error caching categories:', error);
    // Don't throw - cache failures shouldn't break the app
  }
}
export async function invalidateRestaurantCache(restaurantId:string){
    try {
        await redis.del(getCacheKey.fullMenu(restaurantId))
    await redis.del(getCacheKey.categories(restaurantId));
    console.log(`✅ Invalidated cache for restaurant ${restaurantId}`);
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}
export async function invalidateCategoryCache(categoryId: string, restaurantId: string) {
  try {
    await redis.del(getCacheKey.menuItems(categoryId));
    await invalidateRestaurantCache(restaurantId);
    console.log(`✅ Invalidated cache for category ${categoryId}`);
  } catch (error) {
    console.error('Error invalidating category cache:', error);
  }
}

// ✅ Batch invalidation for multiple categories
export async function invalidateMultipleCategoriesCache(
  categoryIds: string[],
  restaurantId: string
) {
  try {
    const keys = categoryIds.map(id => getCacheKey.menuItems(id));
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    await invalidateRestaurantCache(restaurantId);
    console.log(`✅ Invalidated cache for ${categoryIds.length} categories`);
  } catch (error) {
    console.error('Error invalidating multiple categories cache:', error);
  }
}