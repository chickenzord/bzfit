import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Edit, Plus } from 'lucide-react';

interface NutritionData {
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
}

interface Serving {
  id: string;
  name: string;
  servingSize: number;
  isDefault: boolean;
  isEstimated: boolean;
  status: 'VERIFIED' | 'NEEDS_REVIEW' | 'USER_CREATED';
  nutritionData: NutritionData;
}

interface Food {
  id: string;
  name: string;
  description?: string;
  servings: Serving[];
}

interface FoodDetailsProps {
  food: Food;
  onBack: () => void;
  onEditFood: (foodId: string) => void;
  onEditServing: (servingId: string) => void;
  onAddServing: (foodId: string) => void;
}

/**
 * FoodDetails - Detailed view with accordion for servings
 *
 * Features:
 * - Food information
 * - Accordion for servings (auto-open default)
 * - Edit buttons
 * - Add serving button
 */
export default function FoodDetails({
  food,
  onBack,
  onEditFood,
  onEditServing,
  onAddServing,
}: FoodDetailsProps) {
  const defaultServing = food.servings.find((s) => s.isDefault);
  const defaultValue = defaultServing ? `serving-${defaultServing.id}` : undefined;

  const getStatusBadge = (status: Serving['status']) => {
    const variants: Record<Serving['status'], { variant: 'success' | 'warning' | 'info'; label: string }> = {
      VERIFIED: { variant: 'success', label: 'Verified' },
      NEEDS_REVIEW: { variant: 'warning', label: 'Needs Review' },
      USER_CREATED: { variant: 'info', label: 'User Created' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold flex-1">{food.name}</h2>
        <Button variant="outline" size="sm" onClick={() => onEditFood(food.id)}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </div>

      {/* Description */}
      {food.description && (
        <Card className="p-3">
          <p className="text-sm text-muted-foreground">{food.description}</p>
        </Card>
      )}

      {/* Servings Accordion */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Servings</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddServing(food.id)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Serving
          </Button>
        </div>

        <Accordion type="single" collapsible defaultValue={defaultValue}>
          {food.servings.map((serving) => (
            <AccordionItem key={serving.id} value={`serving-${serving.id}`}>
              <AccordionTrigger>
                <div className="flex items-center gap-2 flex-1">
                  <span>{serving.name}</span>
                  {serving.isDefault && (
                    <Badge variant="default" className="text-xs">
                      Default
                    </Badge>
                  )}
                  {getStatusBadge(serving.status)}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Serving Size:</span>
                      <p className="font-medium">{serving.servingSize}g</p>
                    </div>
                    {serving.nutritionData.calories !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Calories:</span>
                        <p className="font-medium">{serving.nutritionData.calories}</p>
                      </div>
                    )}
                    {serving.nutritionData.carbs !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Carbs:</span>
                        <p className="font-medium">{serving.nutritionData.carbs}g</p>
                      </div>
                    )}
                    {serving.nutritionData.protein !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Protein:</span>
                        <p className="font-medium">{serving.nutritionData.protein}g</p>
                      </div>
                    )}
                    {serving.nutritionData.fat !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Fat:</span>
                        <p className="font-medium">{serving.nutritionData.fat}g</p>
                      </div>
                    )}
                  </div>

                  {serving.isEstimated && (
                    <p className="text-xs text-muted-foreground italic">
                      ⚠️ Estimated values
                    </p>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onEditServing(serving.id)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Serving
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
