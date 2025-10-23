"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface QuickAddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number, note: string, date: string) => void;
}

const QuickAddTransactionModal: React.FC<QuickAddTransactionModalProps> = ({ isOpen, onClose, onSave }) => {
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const resetForm = useCallback(() => {
    setAmount('');
    setNote('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setErrors({});
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!amount || parseFloat(amount) === 0) newErrors.amount = 'Amount is required and must be non-zero.';
    if (isNaN(parseFloat(amount))) newErrors.amount = 'Amount must be a valid number.';
    if (!date) newErrors.date = 'Date is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    onSave(parseFloat(amount), note, date);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card text-foreground card-shadow">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" /> Quick Add Transaction
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <div className="col-span-3">
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: '' })); }}
                placeholder="e.g., -25.50 for expense, 100 for income"
                className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0"
              />
              {errors.amount && <p className="text-destructive text-xs mt-1">{errors.amount}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="note" className="text-right">
              Note (Optional)
            </Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="col-span-3 bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0"
              placeholder="e.g., Coffee with friends"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <div className="col-span-3">
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setErrors(prev => ({ ...prev, date: '' })); }}
                className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0"
              />
              {errors.date && <p className="text-destructive text-xs mt-1">{errors.date}</p>}
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none bg-muted/50 border-none hover:bg-muted transition-transform hover:scale-[1.02] active:scale-98">
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button type="submit" className="flex-1 sm:flex-none bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-[1.02] active:scale-98">
              <Save className="h-4 w-4 mr-2" /> Save Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddTransactionModal;