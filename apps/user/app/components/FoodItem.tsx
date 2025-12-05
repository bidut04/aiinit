import { useState, useMemo, useEffect } from "react";
import { MenuItemCard } from "@/app/components/MenuitemCard";
import { CategoryFilter } from "@/app/components/CategoryFliter";
import { UtensilsCrossed, Search, Filter, Sparkles, TrendingUp } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [foodItems, setFoodItems] = useState([]);
  const [categories, setCategories] = useState([{ id: "all", name: "All" }]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/foodItem');
      const response = await res.json();
      
      const data = response.data || [];
      setFoodItems(data);
      
      const uniqueCategories = [
        { id: "all", name: "All" },
        ...Array.from(
          new Map(
            data
              .filter(item => item.category)
              .map(item => [item.category.id, { id: item.category.id, name: item.category.name }])
          ).values()
        )
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching food items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    return foodItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category?.id === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, foodItems]);

  const topRated = useMemo(() => {
    return foodItems.filter(item => item.rating >= 4.5).slice(0, 3);
  }, [foodItems]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/80 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-md animate-pulse" />
                <div className="relative flex items-center justify-center h-11 w-11 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg">
                  <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                  FoodHub
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                </h1>
                <p className="text-xs text-muted-foreground">Premium meals delivered</p>
              </div>
            </div>

            {/* Compact Search */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 h-9 bg-muted/50 border-border/50 focus:bg-background transition-colors"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 space-y-4">
        {/* Top Rated Section - Compact */}
        {!isLoading && topRated.length > 0 && selectedCategory === "all" && !searchQuery && (
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Top Rated</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {topRated.map((item) => (
                <div key={item.id} className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-bold text-primary">₹{item.price}</span>
                        <span className="text-xs text-muted-foreground">⭐ {item.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories - Compact */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Categories</h2>
          </div>
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Menu Items - Compact Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {selectedCategory === "all"
                ? "All Dishes"
                : categories.find((c) => c.id === selectedCategory)?.name}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground px-3 py-1 bg-muted/50 rounded-full">
                {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-xl aspect-video mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed border-border">
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No items found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
                {searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="mt-2"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Stats Badge */}
      <div className="fixed bottom-4 right-4 bg-background/95 backdrop-blur-sm border border-border shadow-xl rounded-full px-4 py-2 text-xs font-medium text-muted-foreground">
        {foodItems.length} dishes available
      </div>
    </div>
  );
};

export default Index;