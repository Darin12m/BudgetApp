"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Save, X, Repeat, Calendar as CalendarIcon, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useDeviceDetection } from '@/hooks/use-device-detection';
import { useCurrency } from '@/context/CurrencyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Category } from '@/hooks/use-finance-data'; // Import Category type

interface QuickAddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number, merchant: string, date: string, categoryId: string, isRecurring: boolean, frequency?: 'Monthly' | 'Weekly' | 'Yearly', nextDate?: string) => void;
  categories: Category[];
}

const QuickAddTransactionModal: React.FC<QuickAddTransactionModalProps> = ({ isOpen, onClose, onSave, categories }) => {
  const { isMobile } = useDeviceDetection();
  const { formatCurrency } = useCurrency();
  const [amount, setAmount] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<'Monthly' | 'Weekly' | 'Yearly'>('Monthly');
  const [nextDate, setNextDate] = useState<Date | undefined>(undefined);
  const [isExpense, setIsExpense] = useState<boolean>(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const resetForm = useCallback(() => {
    setAmount('');
    setMerchant('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setSelectedCategoryId('');
    setIsRecurring(false);
    setFrequency('Monthly');
    setNextDate(undefined);
    setIsExpense(true);
    setErrors({});
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    } else {
      if (categories.length > 0) {
        const uncategorized = categories.find(cat => cat.name === 'Uncategorized');
        setSelectedCategoryId(uncategorized ? uncategorized.id : categories[0].id);
      } else {
        setSelectedCategoryId(''); // No categories available
      }
    }
  }, [isOpen, resetForm, categories]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!amount || parseFloat(amount) === 0) newErrors.amount = 'Amount is required and must be non-zero.';
    if (isNaN(parseFloat(amount))) newErrors.amount = 'Amount must be a valid number.';
    if (!merchant.trim()) newErrors.merchant = 'Merchant is required.';
    if (!date) newErrors.date = 'Date is required.';
    if (!selectedCategoryId) newErrors.categoryId = 'Category is required.';
    if (isRecurring && !nextDate) newErrors.nextDate = 'Next due date is required for recurring transactions.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    const finalAmount = isExpense ? -parseFloat(amount) : parseFloat(amount);

    onSave(
      finalAmount,
      merchant,
      date,
      selectedCategoryId,
      isRecurring,
      isRecurring ? frequency : undefined,
      isRecurring && nextDate ? format(nextDate, 'yyyy-MM-dd') : undefined
    );
    onClose();
  };

  const FormContent = (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="merchant" className="text-right">
          Merchant
        </Label>
        <Input
          id="merchant"
          value={merchant}
          onChange={(e) => { setMerchant(e.target.value); setErrors(prev => ({ ...prev, merchant: '' })); }}
          className="col-span-3 bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          placeholder="e.g., Coffee with friends"
        />
        {errors.merchant && <p className="text-destructive text-xs mt-1 col-start-2 col-span-3">{errors.merchant}</p>}
      </div>
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
            placeholder="e.g., 25.50"
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          />
          {errors.amount && <p className="text-destructive text-xs mt-1">{errors.amount}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="type" className="text-right">
          Type
        </Label>
        <div className="col-span-3 flex items-center space-x-2">
          <Button
            type="button"
            variant={isExpense ? "default" : "outline"}
            onClick={() => setIsExpense(true)}
            className={cn(
              "flex-1",
              isExpense ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "bg-muted/50 border-none hover:bg-muted text-foreground"
            )}
          >
            <ArrowDownCircle className="h-4 w-4 mr-2" /> Expense
          </Button>
          <Button
            type="button"
            variant={!isExpense ? "default" : "outline"}
            onClick={() => setIsExpense(false)}
            className={cn(
              "flex-1",
              !isExpense ? "bg-emerald hover:bg-emerald/90 text-white" : "bg-muted/50 border-none hover:bg-muted text-foreground"
            )}
          >
            <ArrowUpCircle className="h-4 w-4 mr-2" /> Income
          </Button>
        </div>
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
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          />
          {errors.date && <p className="text-destructive text-xs mt-1">{errors.date}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="category" className="text-right">
          Category
        </Label>
        <div className="col-span-3">
          <Select value={selectedCategoryId} onValueChange={(value) => { setSelectedCategoryId(value); setErrors(prev => ({ ...prev, categoryId: '' })); }}>
            <SelectTrigger className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
              <SelectValue placeholder={categories.length > 0 ? "Select a category" : "No categories available"} />
            </SelectTrigger>
            <SelectContent>
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="mr-2">{cat.emoji}</span> {cat.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>
                  No categories. Add one in Budget tab.
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.categoryId && <p className="text-destructive text-xs mt-1">{errors.categoryId}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="isRecurring" className="text-right">
          Recurring
        </Label>
        <div className="col-span-3 flex items-center">
          <Switch
            id="isRecurring"
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
          />
          <span className="ml-2 text-sm text-muted-foreground">
            {isRecurring ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {isRecurring && (
        <>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="frequency" className="text-right">
              Frequency
            </Label>
            <div className="col-span-3">
              <Select value={frequency} onValueChange={(value: 'Monthly' | 'Weekly' | 'Yearly') => setFrequency(value)}>
                <SelectTrigger className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nextDate" className="text-right">
              Next Due Date
            </Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]",
                      !nextDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextDate ? format(nextDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border border-border/50 card-shadow backdrop-blur-lg">
                  <Calendar
                    mode="single"
                    selected={nextDate}
                    onSelect={(d) => { setNextDate(d); setErrors(prev => ({ ...prev, nextDate: '' })); }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.nextDate && <p className="text-destructive text-xs mt-1">{errors.nextDate}</p>}
            </div>
          </div>
        </>
      )}

      <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none bg-muted/50 border-none hover:bg-muted transition-transform hover:scale-[1.02] active:scale-98 min-h-[44px]">
          <X className="h-4 w-4 mr-2" /> Cancel
        </Button>
        <Button type="submit" className="flex-1 sm:flex-none bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-[1.02] active:scale-98 min-h-[44px]">
          <Save className="h-4 w-4 mr-2" /> Save Transaction
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
              <Plus className="w-5 h-5 mr-2" /> Quick Add Transaction
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
      <DialogContent className="sm:max-w-[425px]" onPointerDown={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" /> Quick Add Transaction
          </DialogTitle>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddTransactionModal;