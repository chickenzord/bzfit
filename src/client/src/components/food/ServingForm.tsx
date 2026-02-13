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

interface ServingFormData {
  name: string;
  servingSize: number;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  status: 'VERIFIED' | 'NEEDS_REVIEW' | 'USER_CREATED';
  isEstimated: boolean;
  isDefault: boolean;
}

interface ServingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ServingFormData) => void;
  onDelete?: () => void;
  initialData?: Partial<ServingFormData>;
  isEdit?: boolean;
  canDelete?: boolean;
}

/**
 * ServingForm - Create/Edit serving
 *
 * Features:
 * - Serving details
 * - Nutrition fields
 * - Status dropdown
 * - Default toggle
 * - Delete option
 */
export default function ServingForm({
  open,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  isEdit = false,
  canDelete = true,
}: ServingFormProps) {
  const [formData, setFormData] = useState<ServingFormData>({
    name: initialData?.name || '',
    servingSize: initialData?.servingSize || 100,
    calories: initialData?.calories,
    carbs: initialData?.carbs,
    protein: initialData?.protein,
    fat: initialData?.fat,
    status: initialData?.status || 'USER_CREATED',
    isEstimated: initialData?.isEstimated || false,
    isDefault: initialData?.isDefault || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Serving name is required';
    }

    if (formData.servingSize <= 0) {
      newErrors.servingSize = 'Serving size must be greater than 0';
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

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Serving' : 'Add New Serving'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update serving information'
              : 'Add a new serving size for this food'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Serving Name */}
          <div>
            <Label htmlFor="name">Serving Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Small (71g)"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          {/* Serving Size */}
          <div>
            <Label htmlFor="servingSize">Serving Size (g) *</Label>
            <Input
              id="servingSize"
              type="number"
              value={formData.servingSize}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  servingSize: Number(e.target.value),
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                value={formData.calories || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    calories: e.target.value ? Number(e.target.value) : undefined,
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
                value={formData.carbs || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    carbs: e.target.value ? Number(e.target.value) : undefined,
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
                value={formData.protein || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    protein: e.target.value ? Number(e.target.value) : undefined,
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
                value={formData.fat || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fat: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="0"
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as ServingFormData['status'],
                })
              }
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="VERIFIED">Verified</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="USER_CREATED">User Created</option>
            </select>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isEstimated"
                checked={formData.isEstimated}
                onChange={(e) =>
                  setFormData({ ...formData, isEstimated: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="isEstimated" className="font-normal">
                Mark as estimated
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="isDefault" className="font-normal">
                Set as default serving
              </Label>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isEdit && canDelete && !showDeleteConfirm && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto sm:mr-auto"
              >
                Delete
              </Button>
            )}

            {showDeleteConfirm && (
              <div className="w-full sm:mr-auto flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  Confirm Delete
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            )}

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 sm:flex-none">
                {isEdit ? 'Save' : 'Add Serving'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
