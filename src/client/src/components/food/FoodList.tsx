import React from 'react';
import FoodCard from './FoodCard';

interface Serving {
  id: string;
  name: string;
  isDefault: boolean;
}

interface Food {
  id: string;
  name: string;
  servings: Serving[];
}

interface FoodListProps {
  foods: Food[];
  onFoodClick: (foodId: string) => void;
  isLoading?: boolean;
}

/**
 * FoodList - List of food cards
 *
 * Features:
 * - Grid layout
 * - Loading state
 * - Empty state
 */
export default function FoodList({ foods, onFoodClick, isLoading }: FoodListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (foods.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No foods found</p>
        <p className="text-sm mt-1">Try adjusting your search or add a new food</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {foods.map((food) => (
        <FoodCard key={food.id} food={food} onClick={onFoodClick} />
      ))}
    </div>
  );
}
