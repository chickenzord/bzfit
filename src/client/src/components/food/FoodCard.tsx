import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

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

interface FoodCardProps {
  food: Food;
  onClick: (foodId: string) => void;
}

/**
 * FoodCard - Card displaying food summary
 *
 * Features:
 * - Food name
 * - Brief serving list (first 2-3)
 * - Default serving badge
 * - Click to view details
 */
export default function FoodCard({ food, onClick }: FoodCardProps) {
  const visibleServings = food.servings.slice(0, 3);
  const remainingCount = food.servings.length - visibleServings.length;
  const defaultServing = food.servings.find((s) => s.isDefault);

  return (
    <Card
      className="p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(food.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{food.name}</h3>

          <div className="mt-2 flex flex-wrap gap-1 items-center">
            {visibleServings.map((serving) => (
              <Badge
                key={serving.id}
                variant={serving.isDefault ? 'default' : 'outline'}
                className="text-xs"
              >
                {serving.name}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <span className="text-xs text-muted-foreground">
                +{remainingCount} more
              </span>
            )}
          </div>

          {defaultServing && (
            <p className="text-xs text-muted-foreground mt-1">
              Default: {defaultServing.name}
            </p>
          )}
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
      </div>
    </Card>
  );
}
