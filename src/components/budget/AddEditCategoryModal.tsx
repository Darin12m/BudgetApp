"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Save, X, Tag, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useDeviceDetection } from '@/hooks/use-device-detection';
import ColorPicker from '@/components/common/ColorPicker';
import EmojiPicker from '@/components/common/EmojiPicker';

// Predefined colors and emojis for selection
const CATEGORY_COLORS = [
  'hsl(var(--blue))', 'hsl(var(--emerald))', 'hsl(var(--lilac))',
  '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899'
];
const CATEGORY_EMOJIS = [
  '🍔', '🏠', '🚗', '💡', '🛒', '🎉', '📚', '🏥', '🐾', '🎁', '✈️', '☕'
];

interface Category {
  id?: string;
  name: string;
  budgeted: number;
  spent: number;
  color: string;
  emoji: string;
  ownerUid?: string;
}

interface AddEditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<Category, 'spent' | 'ownerUid'>) => void;
  categoryToEdit?: Category | null;
}

const AddEditCategoryModal: React.FC<AddEditCategoryModalProps> = ({ isOpen, onClose, onSave, categoryToEdit }) => {
  const { isMobile } = useDeviceDetection();
  const [name, setName] = useState('');
  const [budgeted, setBudgeted] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [emoji, setEmoji] = useState(CATEGORY_EMOJIS[0]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setName(categoryToEdit.name);
        setBudgeted(categoryToEdit.budgeted.toString());
        setColor(categoryToEdit.color);
        setEmoji(categoryToEdit.emoji);
      } else {
        setName('');
        setBudgeted('');
        setColor(CATEGORY_COLORS[0]);
        setEmoji(CATEGORY_EMOJIS[0]);
      }
      setErrors({});
    }
  }, [isOpen, categoryToEdit]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Category name is required.';
    const parsedBudgeted = parseFloat(budgeted);
    if (isNaN(parsedBudgeted) || parsedBudgeted < 0) newErrors.budgeted = 'Budgeted amount must be a non-negative number.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    onSave({
      name: name.trim(),
      budgeted: parseFloat(budgeted),
      color,
      emoji,
    });
    onClose();
  };

  const FormContent = (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Name
        </Label>
        <div className="col-span-3">
          <Input
            id="name"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
            placeholder="e.g., Groceries"
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="budgeted" className="text-right">
          Budgeted
        </Label>
        <div className="col-span-3">
          <Input
            id="budgeted"
            type="number"
            step="0.01"
            value={budgeted}
            onChange={(e) => { setBudgeted(e.target.value); setErrors(prev => ({ ...prev, budgeted: '' })); }}
            placeholder="e.g., 300.00"
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          />
          {errors.budgeted && <p className="text-destructive text-xs mt-1">{errors.budgeted}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">
          Color
        </Label>
        <div className="col-span-3">
          <ColorPicker colors={CATEGORY_COLORS} selectedColor={color} onSelect={setColor} />
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">
          Emoji
        </Label>
        <div className="col-span-3">
          <EmojiPicker emojis={CATEGORY_EMOJIS} selectedEmoji={emoji} onSelect={setEmoji} />
        </div>
      </div>

      <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none bg-muted/50 border-none hover:bg-muted transition-transform hover:scale-[1.02] active:scale-98 min-h-[44px]">
          <X className="h-4 w-4 mr-2" /> Cancel
        </Button>
        <Button type="submit" className="flex-1 sm:flex-none bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-[1.02] active:scale-98 min-h-[44px]">
          <Save className="h-4 w-4 mr-2" /> Save Category
        </Button>
      </DialogFooter>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="safe-top safe-bottom bg-card backdrop-blur-lg">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center">
              {categoryToEdit ? 'Edit Category' : 'Add New Category'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            {FormContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card text-foreground card-shadow backdrop-blur-lg" onPointerDown={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {categoryToEdit ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
};

export default AddEditCategoryModal;