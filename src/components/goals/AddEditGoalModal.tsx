"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Save, X, Target, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useDeviceDetection } from '@/hooks/use-device-detection';
import ColorPicker from '@/components/common/ColorPicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
import { useCurrency } from '@/context/CurrencyContext';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';

// Predefined colors for selection
const GOAL_COLORS = [
  'hsl(var(--emerald))', 'hsl(var(--blue))', 'hsl(var(--lilac))',
  '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899'
];

interface Goal {
  id?: string;
  name: string;
  target: number;
  current: number;
  color: string;
  targetDate: string;
  ownerUid?: string;
  inputCurrencyCode: string;
}

interface AddEditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Omit<Goal, 'ownerUid'>) => void;
  goalToEdit?: Goal | null;
}

const AddEditGoalModal: React.FC<AddEditGoalModalProps> = ({ isOpen, onClose, onSave, goalToEdit }) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { isMobile } = useDeviceDetection();
  const { selectedCurrency, convertInputToUSD, convertUSDToSelected } = useCurrency();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        setName(goalToEdit.name);
        setTarget(convertUSDToSelected(goalToEdit.target).toString());
        setCurrent(convertUSDToSelected(goalToEdit.current).toString());
        setColor(goalToEdit.color);
        setTargetDate(goalToEdit.targetDate ? new Date(goalToEdit.targetDate) : undefined);
      } else {
        setName('');
        setTarget('');
        setCurrent('0');
        setColor(GOAL_COLORS[0]);
        setTargetDate(undefined);
      }
      setErrors({});
    }
  }, [isOpen, goalToEdit, convertUSDToSelected]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = t("goals.goalNameRequired");
    const parsedTarget = parseFloat(target);
    if (isNaN(parsedTarget) || parsedTarget <= 0) newErrors.target = t("goals.targetAmountPositive");
    const parsedCurrent = parseFloat(current);
    if (isNaN(parsedCurrent) || parsedCurrent < 0) newErrors.current = t("goals.currentAmountNonNegative");
    if (!targetDate) newErrors.targetDate = t("goals.targetDateRequired");
    if (targetDate && targetDate < new Date()) newErrors.targetDate = t("goals.targetDatePast");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error(t("common.error"));
      return;
    }

    const targetInUSD = convertInputToUSD(parseFloat(target));
    const currentInUSD = convertInputToUSD(parseFloat(current));

    onSave({
      name: name.trim(),
      target: targetInUSD,
      current: currentInUSD,
      color,
      targetDate: targetDate ? format(targetDate, 'yyyy-MM-dd') : '',
      inputCurrencyCode: selectedCurrency.code,
    });
    onClose();
  };

  const FormContent = (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          {t("goals.goalName")}
        </Label>
        <div className="col-span-3">
          <Input
            id="name"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
            placeholder={t("goals.goalNamePlaceholder")}
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="target" className="text-right">
          {t("goals.targetAmount")}
        </Label>
        <div className="col-span-3">
          <Input
            id="target"
            type="number"
            step="0.01"
            value={target}
            onChange={(e) => { setTarget(e.target.value); setErrors(prev => ({ ...prev, target: '' })); }}
            placeholder={`${selectedCurrency.symbol} 15000.00`}
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px] font-mono"
          />
          {errors.target && <p className="text-destructive text-xs mt-1">{errors.target}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="current" className="text-right">
          {t("goals.currentAmount")}
        </Label>
        <div className="col-span-3">
          <Input
            id="current"
            type="number"
            step="0.01"
            value={current}
            onChange={(e) => { setCurrent(e.target.value); setErrors(prev => ({ ...prev, current: '' })); }}
            placeholder={`${selectedCurrency.symbol} 500.00`}
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px] font-mono"
          />
          {errors.current && <p className="text-destructive text-xs mt-1">{errors.current}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="targetDate" className="text-right">
          {t("goals.targetDate")}
        </Label>
        <div className="col-span-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]",
                  !targetDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {targetDate ? format(targetDate, "PPP") : <span>{t("transactions.pickADate")}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 glassmorphic-card">
              <Calendar
                mode="single"
                selected={targetDate}
                onSelect={(date) => { setTargetDate(date); setErrors(prev => ({ ...prev, targetDate: '' })); }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.targetDate && <p className="text-destructive text-xs mt-1">{errors.targetDate}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">
          {t("budget.color")}
        </Label>
        <div className="col-span-3">
          <ColorPicker colors={GOAL_COLORS} selectedColor={color} onSelect={setColor} />
        </div>
      </div>

      <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none bg-muted/50 border-none hover:bg-muted transition-transform min-h-[44px]">
          <X className="h-4 w-4 mr-2" /> {t("common.cancel")}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit" className="flex-1 sm:flex-none bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground transition-transform min-h-[44px]">
          <Save className="h-4 w-4 mr-2" /> {t("common.save")} {t("goals.goal")}
        </motion.button>
      </DialogFooter>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="safe-top safe-bottom glassmorphic-card">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center">
              {goalToEdit ? t("goals.editGoal") : t("goals.newGoalTitle")}
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
      <DialogContent className="glassmorphic-card" onPointerDown={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {goalToEdit ? t("goals.editGoal") : t("goals.newGoalTitle")}
          </DialogTitle>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
};

export default AddEditGoalModal;