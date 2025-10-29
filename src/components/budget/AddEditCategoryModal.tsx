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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Category } from '@/hooks/use-finance-data';
import { useCurrency } from '@/context/CurrencyContext';
import { useTranslation } from 'react-i18next'; // Import useTranslation

// Predefined colors and emojis for selection
const CATEGORY_COLORS = [
  'hsl(var(--blue))', 'hsl(var(--emerald))', 'hsl(var(--lilac))',
  '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899'
];
const CATEGORY_EMOJIS = [
  '🍔', '🏠', '🚗', '💡', '🛒', '🎉', '📚', '🏥', '🐾', '🎁', '✈️', '☕'
];

interface AddEditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<Category, 'spent' | 'ownerUid' | 'id'>, id?: string) => void;
  categoryToEdit?: Category | null;
  existingCategoryNames: string[];
}

const AddEditCategoryModal: React.FC<AddEditCategoryModalProps> = ({ isOpen, onClose, onSave, categoryToEdit, existingCategoryNames }) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { isMobile } = useDeviceDetection();
  const { selectedCurrency, convertInputToUSD, convertUSDToSelected } = useCurrency();
  const [name, setName] = useState('');
  const [budgeted, setBudgeted] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [emoji, setEmoji] = useState(CATEGORY_EMOJIS[0]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setName(categoryToEdit.name);
        setBudgeted(convertUSDToSelected(categoryToEdit.budgeted).toString());
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
  }, [isOpen, categoryToEdit, convertUSDToSelected]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) {
      newErrors.name = t("budget.categoryNameRequired");
    } else {
      const isDuplicate = existingCategoryNames.some(
        (catName) => catName.toLowerCase() === name.trim().toLowerCase() && catName.toLowerCase() !== categoryToEdit?.name.toLowerCase()
      );
      if (isDuplicate) {
        newErrors.name = t("budget.categoryNameDuplicate");
      }
    }

    const parsedBudgeted = parseFloat(budgeted);
    if (isNaN(parsedBudgeted) || parsedBudgeted < 0) newErrors.budgeted = t("budget.budgetedAmountInvalid");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error(t("common.error"));
      return;
    }

    const budgetedInUSD = convertInputToUSD(parseFloat(budgeted));

    onSave({
      name: name.trim(),
      budgeted: budgetedInUSD,
      color,
      emoji,
      inputCurrencyCode: selectedCurrency.code,
    }, categoryToEdit?.id);
    onClose();
  };

  const FormContent = (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          {t("budget.categoryName")}
        </Label>
        <div className="col-span-3">
          <Input
            id="name"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
            placeholder={t("budget.categoryNamePlaceholder")}
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="budgeted" className="text-right">
          {t("budget.budgetedAmount")}
        </Label>
        <div className="col-span-3">
          <Input
            id="budgeted"
            type="number"
            step="0.01"
            value={budgeted}
            onChange={(e) => { setBudgeted(e.target.value); setErrors(prev => ({ ...prev, budgeted: '' })); }}
            placeholder={`${selectedCurrency.symbol} 300.00`}
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          />
          {errors.budgeted && <p className="text-destructive text-xs mt-1">{errors.budgeted}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">
          {t("budget.color")}
        </Label>
        <div className="col-span-3">
          <ColorPicker colors={CATEGORY_COLORS} selectedColor={color} onSelect={setColor} />
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">
          {t("budget.emoji")}
        </Label>
        <div className="col-span-3">
          <EmojiPicker emojis={CATEGORY_EMOJIS} selectedEmoji={emoji} onSelect={setEmoji} />
        </div>
      </div>

      <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none bg-muted/50 border-none hover:bg-muted transition-transform hover:scale-[1.02] active:scale-98 min-h-[44px]">
          <X className="h-4 w-4 mr-2" /> {t("common.cancel")}
        </Button>
        <Button type="submit" className="flex-1 sm:flex-none bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-[1.02] active:scale-98 min-h-[44px]">
          <Save className="h-4 w-4 mr-2" /> {t("common.save")} {t("budget.category")}
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
              {categoryToEdit ? t("budget.editCategory") : t("budget.newCategory")}
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
      <DialogContent onPointerDown={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {categoryToEdit ? t("budget.editCategory") : t("budget.newCategory")}
          </DialogTitle>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
};

export default AddEditCategoryModal;