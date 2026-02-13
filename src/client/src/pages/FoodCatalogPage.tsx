import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import FoodSearchBar from '@/components/food/FoodSearchBar';
import FoodList from '@/components/food/FoodList';
import FoodDetails from '@/components/food/FoodDetails';
import FoodForm from '@/components/food/FoodForm';
import ServingForm from '@/components/food/ServingForm';

// TODO: Replace with actual API calls
interface Serving {
  id: string;
  name: string;
  servingSize: number;
  isDefault: boolean;
  isEstimated: boolean;
  status: 'VERIFIED' | 'NEEDS_REVIEW' | 'USER_CREATED';
  nutritionData: {
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
  };
}

interface Food {
  id: string;
  name: string;
  description?: string;
  servings: Serving[];
}

/**
 * FoodCatalogPage - Main food catalog page
 *
 * Features:
 * - Search foods
 * - List view
 * - Detail view
 * - Create/Edit forms
 */
export default function FoodCatalogPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [showServingForm, setShowServingForm] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [editingServingId, setEditingServingId] = useState<string | null>(null);
  const [addingServingToFoodId, setAddingServingToFoodId] = useState<string | null>(null);

  // Mock data - TODO: Replace with API calls
  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      const mockFoods: Food[] = [
        {
          id: '1',
          name: 'French Fries',
          description: 'Classic fast food side',
          servings: [
            {
              id: 's1',
              name: 'Small (71g)',
              servingSize: 71,
              isDefault: true,
              isEstimated: false,
              status: 'VERIFIED',
              nutritionData: {
                calories: 222,
                carbs: 29,
                protein: 3,
                fat: 10,
              },
            },
            {
              id: 's2',
              name: 'Medium (111g)',
              servingSize: 111,
              isDefault: false,
              isEstimated: false,
              status: 'VERIFIED',
              nutritionData: {
                calories: 340,
                carbs: 44,
                protein: 4,
                fat: 16,
              },
            },
          ],
        },
        {
          id: '2',
          name: 'Banana',
          servings: [
            {
              id: 's3',
              name: 'Medium (118g)',
              servingSize: 118,
              isDefault: true,
              isEstimated: false,
              status: 'VERIFIED',
              nutritionData: {
                calories: 105,
                carbs: 27,
                protein: 1,
                fat: 0,
              },
            },
          ],
        },
        {
          id: '3',
          name: 'Nasi Goreng',
          description: 'Indonesian fried rice',
          servings: [
            {
              id: 's4',
              name: 'One Plate (250g)',
              servingSize: 250,
              isDefault: true,
              isEstimated: true,
              status: 'NEEDS_REVIEW',
              nutritionData: {
                calories: 450,
                carbs: 65,
                protein: 12,
                fat: 15,
              },
            },
          ],
        },
      ];
      setFoods(mockFoods);
      setFilteredFoods(mockFoods);
      setIsLoading(false);
    }, 500);
  }, []);

  // Search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredFoods(foods);
    } else {
      const filtered = foods.filter((food) =>
        food.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredFoods(filtered);
    }
  };

  // Food handlers
  const handleFoodClick = (foodId: string) => {
    setSelectedFoodId(foodId);
  };

  const handleBackToList = () => {
    setSelectedFoodId(null);
  };

  const handleAddFood = () => {
    setEditingFoodId(null);
    setShowFoodForm(true);
  };

  const handleEditFood = (foodId: string) => {
    setEditingFoodId(foodId);
    setShowFoodForm(true);
  };

  const handleFoodSubmit = (data: any) => {
    // TODO: API call to create/update food
    console.log('Food submit:', data);
    setShowFoodForm(false);
    setEditingFoodId(null);
  };

  // Serving handlers
  const handleAddServing = (foodId: string) => {
    setAddingServingToFoodId(foodId);
    setEditingServingId(null);
    setShowServingForm(true);
  };

  const handleEditServing = (servingId: string) => {
    setEditingServingId(servingId);
    setAddingServingToFoodId(null);
    setShowServingForm(true);
  };

  const handleServingSubmit = (data: any) => {
    // TODO: API call to create/update serving
    console.log('Serving submit:', data);
    setShowServingForm(false);
    setEditingServingId(null);
    setAddingServingToFoodId(null);
  };

  const handleServingDelete = () => {
    // TODO: API call to delete serving
    console.log('Serving delete');
    setShowServingForm(false);
    setEditingServingId(null);
  };

  const selectedFood = selectedFoodId
    ? foods.find((f) => f.id === selectedFoodId)
    : null;

  const editingFood = editingFoodId
    ? foods.find((f) => f.id === editingFoodId)
    : null;

  const editingServing = editingServingId
    ? foods
        .flatMap((f) => f.servings)
        .find((s) => s.id === editingServingId)
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {!selectedFoodId ? (
        <>
          {/* Search and Add Button */}
          <div className="flex gap-2">
            <div className="flex-1">
              <FoodSearchBar onSearch={handleSearch} />
            </div>
            <Button onClick={handleAddFood}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Results Count */}
          {searchQuery && (
            <p className="text-sm text-muted-foreground">
              {filteredFoods.length} result{filteredFoods.length !== 1 ? 's' : ''}{' '}
              for "{searchQuery}"
            </p>
          )}

          {/* Food List */}
          <FoodList
            foods={filteredFoods}
            onFoodClick={handleFoodClick}
            isLoading={isLoading}
          />
        </>
      ) : (
        <>
          {/* Food Details */}
          {selectedFood && (
            <FoodDetails
              food={selectedFood}
              onBack={handleBackToList}
              onEditFood={handleEditFood}
              onEditServing={handleEditServing}
              onAddServing={handleAddServing}
            />
          )}
        </>
      )}

      {/* Food Form Dialog */}
      <FoodForm
        open={showFoodForm}
        onClose={() => {
          setShowFoodForm(false);
          setEditingFoodId(null);
        }}
        onSubmit={handleFoodSubmit}
        initialData={
          editingFood
            ? {
                name: editingFood.name,
                description: editingFood.description,
              }
            : undefined
        }
        isEdit={!!editingFoodId}
      />

      {/* Serving Form Dialog */}
      <ServingForm
        open={showServingForm}
        onClose={() => {
          setShowServingForm(false);
          setEditingServingId(null);
          setAddingServingToFoodId(null);
        }}
        onSubmit={handleServingSubmit}
        onDelete={handleServingDelete}
        initialData={
          editingServing
            ? {
                name: editingServing.name,
                servingSize: editingServing.servingSize,
                calories: editingServing.nutritionData.calories,
                carbs: editingServing.nutritionData.carbs,
                protein: editingServing.nutritionData.protein,
                fat: editingServing.nutritionData.fat,
                status: editingServing.status,
                isEstimated: editingServing.isEstimated,
                isDefault: editingServing.isDefault,
              }
            : undefined
        }
        isEdit={!!editingServingId}
        canDelete={
          editingServing
            ? foods.find((f) =>
                f.servings.some((s) => s.id === editingServingId)
              )?.servings.length! > 1
            : true
        }
      />
    </div>
  );
}
