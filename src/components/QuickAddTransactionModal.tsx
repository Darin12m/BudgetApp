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
import { Category } from '@/hooks/use-finance-data';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';

interface QuickAddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number, merchant: string, date: string, categoryId: string, isRecurring: boolean, frequency?: 'Monthly' | 'Weekly' | 'Yearly', nextDate?: string, inputCurrencyCode?: string) => void;
  categories: Category[];
}

const QuickAddTransactionModal: React.FC<QuickAddTransactionModalProps> = ({ isOpen, onClose, onSave, categories }) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { isMobile } = useDeviceDetection();
  const { formatCurrency, selectedCurrency, convertInputToUSD } = useCurrency();
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
        setSelectedCategoryId('');
      }
    }
  }, [isOpen, resetForm, categories]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!amount || parseFloat(amount) === 0) newErrors.amount = t("transactions.amountRequired");
    if (isNaN(parseFloat(amount))) newErrors.amount = t("transactions.amountInvalid");
    if (!merchant.trim()) newErrors.merchant = t("transactions.merchantRequired");
    if (!date) newErrors.date = t("transactions.dateRequired");
    if (!selectedCategoryId) newErrors.categoryId = t("transactions.categoryRequired");
    if (isRecurring && !nextDate) newErrors.nextDate = t("transactions.nextDueDateRequired");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error(t("common.error"));
      return;
    }

    const amountInUSD = convertInputToUSD(parseFloat(amount));
    const finalAmount = isExpense ? -amountInUSD : amountInUSD;

    onSave(
      finalAmount,
      merchant,
      date,
      selectedCategoryId,
      isRecurring,
      isRecurring ? frequency : undefined,
      isRecurring && nextDate ? format(nextDate, 'yyyy-MM-dd') : undefined,
      selectedCurrency.code
    );
    onClose();
  };

  const FormContent = (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="merchant" className="text-right">
          {t("transactions.merchant")}
        </Label>
        <Input
          id="merchant"
          value={merchant}
          onChange={(e) => { setMerchant(e.target.value); setErrors(prev => ({ ...prev, merchant: '' })); }}
          className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          placeholder={t("transactions.merchantPlaceholder")}
        />
        {errors.merchant && <p className="text-destructive text-xs mt-1 col-start-2 col-span-3">{errors.merchant}</p>}
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="amount" className="text-right">
          {t("transactions.amount")}
        </Label>
        <div className="col-span-3">
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: '' })); }}
            placeholder={`${selectedCurrency.symbol} 25.50`}
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px] font-mono"
          />
          {errors.amount && <p className="text-destructive text-xs mt-1">{errors.amount}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="type" className="text-right">
          {t("transactions.type")}
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
            <ArrowDownCircle className="h-4 w-4 mr-2" /> {t("transactions.expense")}
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
            <ArrowUpCircle className="h-4 w-4 mr-2" /> {t("transactions.income")}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="date" className="text-right">
          {t("transactions.date")}
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
          {t("transactions.category")}
        </Label>
        <div className="col-span-3">
          <Select value={selectedCategoryId} onValueChange={(value) => { setSelectedCategoryId(value); setErrors(prev => ({ ...prev, categoryId: '' })); }}>
            <SelectTrigger className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
              <SelectValue placeholder={categories.length > 0 ? t("transactions.selectCategory") : t("transactions.noCategoriesAvailable")} />
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
                  {t("transactions.noCategoriesAddOne")}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.categoryId && <p className="text-destructive text-xs mt-1">{errors.categoryId}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="isRecurring" className="text-right">
          {t("transactions.recurring")}
        </Label>
        <div className="col-span-3 flex items-center">
          <Switch
            id="isRecurring"
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
          />
          <span className="ml-2 text-sm text-muted-foreground">
            {isRecurring ? t("transactions.enabled") : t("transactions.disabled")}
          </span>
        </div>
      </div>

      {isRecurring && (
        <>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="frequency" className="text-right">
              {t("transactions.frequency")}
            </Label>
            <div className="col-span-3">
              <Select value={frequency} onValueChange={(value: 'Monthly' | 'Weekly' | 'Yearly') => setFrequency(value)}>
                <SelectTrigger className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
                  <SelectValue placeholder={t("transactions.selectFrequency")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">{t("transactions.monthly")}</SelectItem>
                  <SelectItem value="Weekly">{t("transactions.weekly")}</SelectItem>
                  <SelectItem value="Yearly">{t("transactions.yearly")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nextDate" className="text-right">
              {t("transactions.nextDueDate")}
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
                    {nextDate ? format(nextDate, "PPP") : <span>{t("transactions.pickADate")}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glassmorphic-card">
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
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
          <X className="h-4 w-4 mr-2" /> {t("common.cancel")}
        </Button>
        <Button type="submit" className="flex-1 sm:flex-none">
          <Save className="h-4 w-4 mr-2" /> {t("common.save")} {t("transactions.transaction")}
        </Button>
      </DialogFooter>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="safe-top safe-bottom glassmorphic-card">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2" /> {t("transactions.quickAddTransaction")}
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
      <DialogContent className="sm:max-w-[425px] glassmorphic-card" onPointerDown={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" /> {t("transactions.quickAddTransaction")}
          </DialogTitle>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddTransactionModal;