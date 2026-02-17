import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Serving {
  id: string;
  name: string | null;
  size: number;
  unit: string;
  isDefault: boolean;
}

interface Food {
  id: string;
  name: string;
  variant?: string | null;
  brand?: string | null;
  servings: Serving[];
}

interface FoodCardProps {
  food: Food;
  onClick: (foodId: string) => void;
}

/**
 * FoodCard - Flat list item displaying food summary
 *
 * Features:
 * - Food name (highlighted)
 * - Variant and brand as subtitle
 * - Servings as comma-separated list (default first)
 */
export default function FoodCard({ food, onClick }: FoodCardProps) {
  // Build subtitle from variant and brand
  const subtitle = [food.variant, food.brand].filter(Boolean).join(' · ');

  // Sort servings: default first, then others
  const sortedServings = [...food.servings].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  // Format servings as comma-separated list
  const servingsText = sortedServings
    .map((s) => s.name || `${s.size}${s.unit}`)
    .join(', ');

  return (
    <div
      className="py-3 px-4 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
      onClick={() => onClick(food.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{food.name}</h3>

          {subtitle && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {subtitle}
            </p>
          )}

          {servingsText && (
            <p className="text-sm text-muted-foreground truncate mt-1">
              {servingsText}
            </p>
          )}
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}
