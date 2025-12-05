import { MenuCategory } from "@/app/types/menu";
import { Button } from '@workspace/ui/components/button'
import { cn } from "@/app/lib/utils";

interface CategoryFilterProps {
  categories: MenuCategory[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export const CategoryFilter = ({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            "whitespace-nowrap gap-2 transition-all",
            selectedCategory === category.id && "shadow-md"
          )}
        >
          <span className="text-lg">{category.icon}</span>
          {category.name}
        </Button>
      ))}
    </div>
  );
};
