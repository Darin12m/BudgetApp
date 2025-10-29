"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDeviceDetection } from '@/hooks/use-device-detection';
import { useCurrency } from '@/context/CurrencyContext';
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
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFunds: (amountInUSD: number, inputCurrencyCode: string) => void;
  goalName: string;
  currentAmountInUSD: number;
  targetAmountInUSD: number;
}

const AddFundsModal: React.FC<AddFundsModalProps> = ({ isOpen, onClose, onAddFunds, goalName, currentAmountInUSD, targetAmountInUSD }) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { isMobile } = useDeviceDetection();
  const { formatCurrency, selectedCurrency, convertInputToUSD, convertUSDToSelected } = useCurrency();
  const [amountToAdd, setAmountToAdd] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setAmountToAdd('');
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const parsedAmount = parseFloat(amountToAdd);
    if (isNaN(parsedAmount) || parsedAmount <= 0) newErrors.amountToAdd = t("goals.amountPositive");
    
    const amountToAddInUSD = convertInputToUSD(parsedAmount);
    if (amountToAddInUSD + currentAmountInUSD > targetAmountInUSD) newErrors.amountToAdd = t("goals.amountExceedsTarget");
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error(t("common.error"));
      return;
    }

    const amountToAddInUSD = convertInputToUSD(parseFloat(amountToAdd));
    onAddFunds(amountToAddInUSD, selectedCurrency.code);
    onClose();
  };

  const currentAmountDisplay = convertUSDToSelected(currentAmountInUSD);
  const targetAmountDisplay = convertUSDToSelected(targetAmountInUSD);

  const FormContent = (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="amountToAdd" className="text-right">
          {t("transactions.amount")}
        </Label>
        <div className="col-span-3">
          <Input
            id="amountToAdd"
            type="number"
            step="0.01"
            value={amountToAdd}
            onChange={(e) => { setAmountToAdd(e.target.value); setErrors(prev => ({ ...prev, amountToAdd: '' })); }}
            placeholder={`${selectedCurrency.symbol} 50.00`}
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px] font-mono"
          />
          {errors.amountToAdd && <p className="text-destructive text-xs mt-1">{errors.amountToAdd}</p>}
        </div>
      </div>

      <div className="text-sm text-muted-foreground col-span-full text-center mt-2">
        {t("goals.current")}: <span className="font-semibold text-foreground font-mono">{formatCurrency(currentAmountInUSD)}</span> / {t("goals.target")}: <span className="font-semibold text-foreground font-mono">{formatCurrency(targetAmountInUSD)}</span>
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
          <Save className="h-4 w-4 mr-2" /> {t("goals.addFunds")}
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
              <Plus className="w-5 h-5 mr-2" /> {t("goals.addFundsTo", { goalName: goalName })}
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
            <Plus className="w-5 h-5 mr-2" /> {t("goals.addFundsTo", { goalName: goalName })}
          </DialogTitle>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
};

export default AddFundsModal;