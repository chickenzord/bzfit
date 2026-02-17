import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FoodFormData {
  name: string;
  description?: string;
  defaultServing: {
    name: string;
    servingSize: number;
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
    isEstimated: boolean;
  };
}

interface FoodFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FoodFormData) => void;
  initialData?: Partial<FoodFormData>;
  isEdit?: boolean;
}

/**
 * FoodForm - Create/Edit food with default serving
 *
 * Features:
 * - Food name and description
 * - Default serving fields
 * - Validation
 * - Save/Cancel buttons
 */
export default function FoodForm({
  open,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
}: FoodFormProps) {
  const [formData, setFormData] = useState<FoodFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    defaultServing: {
      name: initialData?.defaultServing?.name || '',
      servingSize: initialData?.defaultServing?.servingSize || 100,
      calories: initialData?.defaultServing?.calories,
      carbs: initialData?.defaultServing?.carbs,
      protein: initialData?.defaultServing?.protein,
      fat: initialData?.defaultServing?.fat,
      isEstimated: initialData?.defaultServing?.isEstimated || false,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Food name is required';
    }

    if (!isEdit) {
      if (!formData.defaultServing.name.trim()) {
        newErrors.servingName = 'Serving name is required';
      }

      if (formData.defaultServing.servingSize <= 0) {
        newErrors.servingSize = 'Serving size must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Food' : 'Add New Food'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update food information'
              : 'Add a new food with a default serving size'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Food Name */}
          <div>
            <Label htmlFor="name">Food Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., French Fries"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Additional notes"
            />
          </div>

          {!isEdit && (
            <>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Default Serving</h4>

                {/* Serving Name */}
                <div className="mb-3">
                  <Label htmlFor="servingName">Serving Name *</Label>
                  <Input
                    id="servingName"
                    value={formData.defaultServing.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultServing: {
                          ...formData.defaultServing,
                          name: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g., Small (71g)"
                  />
                  {errors.servingName && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.servingName}
                    </p>
                  )}
                </div>

                {/* Serving Size */}
                <div className="mb-3">
                  <Label htmlFor="servingSize">Serving Size (g) *</Label>
                  <Input
                    id="servingSize"
                    type="number"
                    value={formData.defaultServing.servingSize}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultServing: {
                          ...formData.defaultServing,
                          servingSize: Number(e.target.value),
                        },
                      })
                    }
                    placeholder="100"
                  />
                  {errors.servingSize && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.servingSize}
                    </p>
                  )}
                </div>

                {/* Nutrition Fields */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={formData.defaultServing.calories || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultServing: {
                            ...formData.defaultServing,
                            calories: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      value={formData.defaultServing.carbs || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultServing: {
                            ...formData.defaultServing,
                            carbs: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      value={formData.defaultServing.protein || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultServing: {
                            ...formData.defaultServing,
                            protein: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      value={formData.defaultServing.fat || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultServing: {
                            ...formData.defaultServing,
                            fat: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Estimated Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isEstimated"
                    checked={formData.defaultServing.isEstimated}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultServing: {
                          ...formData.defaultServing,
                          isEstimated: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isEstimated" className="font-normal">
                    Mark as estimated
                  </Label>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save Changes' : 'Add Food'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
