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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  targetDate: string; // YYYY-MM-DD
  ownerUid?: string;
}

interface AddEditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Omit<Goal, 'ownerUid'>) => void;
  goalToEdit?: Goal | null;
}

const AddEditGoalModal: React.FC<AddEditGoalModalProps> = ({ isOpen, onClose, onSave, goalToEdit }) => {
  const { isMobile } = useDeviceDetection();
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
        setTarget(goalToEdit.target.toString());
        setCurrent(goalToEdit.current.toString());
        setColor(goalToEdit.color);
        setTargetDate(goalToEdit.targetDate ? new Date(goalToEdit.targetDate) : undefined);
      } else {
        setName('');
        setTarget('');
        setCurrent('0'); // Default current to 0 for new goals
        setColor(GOAL_COLORS[0]);
        setTargetDate(undefined);
      }
      setErrors({});
    }
  }, [isOpen, goalToEdit]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Goal name is required.';
    const parsedTarget = parseFloat(target);
    if (isNaN(parsedTarget) || parsedTarget <= 0) newErrors.target = 'Target amount must be a positive number.';
    const parsedCurrent = parseFloat(current);
    if (isNaN(parsedCurrent) || parsedCurrent < 0) newErrors.current = 'Current amount must be a non-negative number.';
    if (!targetDate) newErrors.targetDate = 'Target date is required.';
    if (targetDate && targetDate < new Date()) newErrors.targetDate = 'Target date cannot be in the past.';
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
      target: parseFloat(target),
      current: parseFloat(current),
      color,
      targetDate: targetDate ? format(targetDate, 'yyyy-MM-dd') : '',
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
            placeholder="e.g., New Car Fund"
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="target" className="text-right">
          Target Amount
        </Label>
        <div className="col-span-3">
          <Input
            id="target"
            type="number"
            step="0.01"
            value={target}
            onChange={(e) => { setTarget(e.target.value); setErrors(prev => ({ ...prev, target: '' })); }}
            placeholder="e.g., 15000.00"
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          />
          {errors.target && <p className="text-destructive text-xs mt-1">{errors.target}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="current" className="text-right">
          Current Amount
        </Label>
        <div className="col-span-3">
          <Input
            id="current"
            type="number"
            step="0.01"
            value={current}
            onChange={(e) => { setCurrent(e.target.value); setErrors(prev => ({ ...prev, current: '' })); }}
            placeholder="e.g., 500.00"
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          />
          {errors.current && <p className="text-destructive text-xs mt-1">{errors.current}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="targetDate" className="text-right">
          Target Date
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
                {targetDate ? format(targetDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border border-border/50 card-shadow backdrop-blur-lg">
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
          Color
        </Label>
        <div className="col-span-3">
          <ColorPicker colors={GOAL_COLORS} selectedColor={color} onSelect={setColor} />
        </div>
      </div>

      <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none bg-muted/50 border-none hover:bg-muted transition-transform hover:scale-[1.02] active:scale-98 min-h-[44px]">
          <X className="h-4 w-4 mr-2" /> Cancel
        </Button>
        <Button type="submit" className="flex-1 sm:flex-none bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-[1.02] active:scale-98 min-h-[44px]">
          <Save className="h-4 w-4 mr-2" /> Save Goal
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
              {goalToEdit ? 'Edit Goal' : 'Add New Goal'}
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
            {goalToEdit ? 'Edit Goal' : 'Add New Goal'}
          </DialogTitle>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
};

export default AddEditGoalModal;