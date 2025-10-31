"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Save, X, Trash2, Calendar as CalendarIcon, Repeat, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useDeviceDetection } from '@/hooks/use-device-detection';
import { useCurrency } from '@/context/CurrencyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
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
import { Transaction, Category, Account, RecurringTransaction } from '@/hooks/use-finance-data';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { motion } from 'framer-motion';

interface AddEditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'ownerUid'>, isRecurring: boolean, recurringDetails?: Omit<RecurringTransaction, 'id' | 'ownerUid'>) => void;
  onDelete: (id: string) => void;
  transactionToEdit?: Transaction | null;
  categories: Category[];
  recurringTemplates: RecurringTransaction[];
  uncategorizedCategoryId: string; // New prop
}

const AddEditTransactionModal: React.FC<AddEditTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  transactionToEdit,
  categories,
  recurringTemplates,
  uncategorizedCategoryId,
}) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { isMobile } = useDeviceDetection();
  const { formatCurrency, selectedCurrency, convertInputToUSD, convertUSDToSelected } = useCurrency();

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [status, setStatus] = useState<'pending' | 'cleared'>('pending');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'Monthly' | 'Weekly' | 'Yearly'>('Monthly');
  const [nextDate, setNextDate] = useState<Date | undefined>(undefined);
  const [isExpense, setIsExpense] = useState<boolean>(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const isEditing = !!transactionToEdit;
  const isInstanceFromRecurringTemplate = isEditing && transactionToEdit?.isRecurring && transactionToEdit?.recurringTransactionId;

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setDate(new Date(transactionToEdit.date));
        setMerchant(transactionToEdit.merchant);
        setAmount(convertUSDToSelected(Math.abs(transactionToEdit.amount)).toString());
        setIsExpense(transactionToEdit.amount < 0);
        setSelectedCategoryId(transactionToEdit.categoryId);
        setStatus(transactionToEdit.status);
        
        if (isInstanceFromRecurringTemplate) {
          const matchingTemplate = recurringTemplates.find(rt => rt.id === transactionToEdit.recurringTransactionId);
          if (matchingTemplate) {
            setIsRecurring(true);
            setFrequency(matchingTemplate.frequency);
            setNextDate(new Date(matchingTemplate.nextDate));
          }
        } else {
          setIsRecurring(false);
          setFrequency('Monthly');
          setNextDate(undefined);
        }
      } else {
        setDate(new Date());
        setMerchant('');
        setAmount('');
        setSelectedCategoryId(uncategorizedCategoryId); // Default to uncategorized
        setStatus('pending');
        setIsExpense(true);
      }
      setErrors({});
    }
  }, [isOpen, transactionToEdit, categories, recurringTemplates, isInstanceFromRecurringTemplate, convertUSDToSelected, uncategorizedCategoryId]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!date) newErrors.date = t("transactions.dateRequired");
    if (!merchant.trim()) newErrors.merchant = t("transactions.merchantRequired");
    if (!amount || parseFloat(amount) === 0) newErrors.amount = t("transactions.amountRequired");
    if (isNaN(parseFloat(amount))) newErrors.amount = t("transactions.amountInvalid");
    // Removed categoryId validation: if (!selectedCategoryId || selectedCategoryId === uncategorizedCategoryId) newErrors.categoryId = t("transactions.categoryRequired");
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

    const transactionPayload: Omit<Transaction, 'id' | 'ownerUid'> = {
      date: date ? format(date, 'yyyy-MM-dd') : '',
      merchant: merchant.trim(),
      amount: finalAmount,
      categoryId: selectedCategoryId || uncategorizedCategoryId, // Use uncategorizedCategoryId if selectedCategoryId is empty
      status,
      isRecurring: isRecurring,
      recurringTransactionId: isInstanceFromRecurringTemplate ? transactionToEdit?.recurringTransactionId : undefined,
      inputCurrencyCode: selectedCurrency.code,
    };

    let recurringPayload: Omit<RecurringTransaction, 'id' | 'ownerUid'> | undefined = undefined;
    if (isRecurring && nextDate) {
      const categoryEmoji = categories.find(cat => cat.id === selectedCategoryId)?.emoji || '💳';
      recurringPayload = {
        name: merchant.trim(),
        amount: finalAmount,
        categoryId: selectedCategoryId || uncategorizedCategoryId, // Use uncategorizedCategoryId if selectedCategoryId is empty
        frequency,
        nextDate: format(nextDate, 'yyyy-MM-dd'),
        emoji: categoryEmoji,
        inputCurrencyCode: selectedCurrency.code,
      };
    }

    onSave(transactionPayload, isRecurring, recurringPayload);
    onClose();
  };

  const handleDeleteClick = () => {
    if (transactionToEdit?.id) {
      onDelete(transactionToEdit.id);
      setIsDeleteConfirmOpen(false);
    }
  };

  const FormContent = () => ( // Changed to a functional component
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="merchant" className="text-right text-sm sm:text-base"> {/* Applied consistent typography */}
          {t("transactions.merchant")}
        </Label>
        <div className="col-span-3">
          <Input
            id="merchant"
            value={merchant}
            onChange={(e) => { setMerchant(e.target.value); setErrors(prev => ({ ...prev, merchant: '' })); }}
            placeholder={t("transactions.merchantPlaceholder")}
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          />
          {errors.merchant && <p className="text-destructive text-xs mt-1">{errors.merchant}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="amount" className="text-right text-sm sm:text-base"> {/* Applied consistent typography */}
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
        <Label htmlFor="type" className="text-right text-sm sm:text-base"> {/* Applied consistent typography */}
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
        <Label htmlFor="date" className="text-right text-sm sm:text-base"> {/* Applied consistent typography */}
          {t("transactions.date")}
        </Label>
        <div className="col-span-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>{t("transactions.pickADate")}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 glassmorphic-card">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { setDate(d || undefined); setErrors(prev => ({ ...prev, date: '' })); }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.date && <p className="text-destructive text-xs mt-1">{errors.date}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="category" className="text-right text-sm sm:text-base"> {/* Applied consistent typography */}
          {t("transactions.category")}
        </Label>
        <div className="col-span-3">
          <Select value={selectedCategoryId} onValueChange={(value) => { setSelectedCategoryId(value); setErrors(prev => ({ ...prev, categoryId: '' })); }}>
            <SelectTrigger className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
              <SelectValue placeholder={categories.length > 0 ? t("transactions.selectCategory") : t("transactions.noCategoriesAvailable")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={uncategorizedCategoryId}>
                <span className="mr-2">❓</span> {t("transactions.noCategory")}
              </SelectItem>
              {categories.length > 0 ? (
                categories.filter(cat => cat.id !== uncategorizedCategoryId).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="mr-2">{cat.emoji}</span> {cat.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-categories-available" disabled>
                  {t("transactions.noCategoriesAddOne")}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {/* Removed errors.categoryId display */}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right text-sm sm:text-base"> {/* Applied consistent typography */}
          {t("transactions.status")}
        </Label>
        <div className="col-span-3">
          <Select value={status} onValueChange={(value: 'pending' | 'cleared') => setStatus(value)}>
            <SelectTrigger className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
              <SelectValue placeholder={t("transactions.selectStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">{t("transactions.pending")}</SelectItem>
              <SelectItem value="cleared">{t("transactions.cleared")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="isRecurring" className="text-right text-sm sm:text-base"> {/* Applied consistent typography */}
          {t("transactions.recurring")}
        </Label>
        <div className="col-span-3 flex items-center">
          <Switch
            id="isRecurring"
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
            disabled={!!isInstanceFromRecurringTemplate}
          />
          <span className="ml-2 text-sm text-muted-foreground"> {/* Applied consistent typography */}
            {isRecurring ? t("transactions.enabled") : t("transactions.disabled")}
          </span>
          {isInstanceFromRecurringTemplate && (
            <span className="ml-2 text-xs text-muted-foreground break-words text-balance">({t("transactions.managedAsRecurringTemplate")})</span> /* Applied consistent typography and text wrapping */
          )}
        </div>
      </div>

      {isRecurring && (
        <>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="frequency" className="text-right text-sm sm:text-base"> {/* Applied consistent typography */}
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
            <Label htmlFor="nextDate" className="text-right text-sm sm:text-base"> {/* Applied consistent typography */}
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
                    onSelect={(d) => { setNextDate(d || undefined); setErrors(prev => ({ ...prev, nextDate: '' })); }}
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
        {isEditing && (
          <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="h-4 w-4 mr-2" /> {t("common.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glassmorphic-card">
              <AlertDialogHeader>
                <AlertDialogTitle>{t("common.areYouSure")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("transactions.transactionDeleteConfirmation", { merchantName: transactionToEdit?.merchant })}
                  {isInstanceFromRecurringTemplate && t("transactions.transactionInstanceDeleteConfirmation")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-muted/50 border-none hover:bg-muted">{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteClick} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">{t("common.delete")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <div className="flex gap-2 w-full sm:w-auto">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            <X className="h-4 w-4 mr-2" /> {t("common.cancel")}
          </Button>
          <Button type="submit" className="flex-1">
            <Save className="h-4 w-4 mr-2" /> {t("common.save")} {t("transactions.transaction")}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="safe-top safe-bottom glassmorphic-card">
          <DrawerHeader className="text-left">
            <DialogTitle className="flex items-center">
              {isEditing ? <h3 className="text-base sm:text-lg">{t("transactions.editTransaction")}</h3> : <h3 className="text-base sm:text-lg">{t("transactions.newTransaction")}</h3>} {/* Applied consistent typography */}
            </DialogTitle>
          </DrawerHeader>
          <div className="p-4">
            <FormContent /> {/* Call as a component */}
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
            {isEditing ? <h3 className="text-base sm:text-lg">{t("transactions.editTransaction")}</h3> : <h3 className="text-base sm:text-lg">{t("transactions.newTransaction")}</h3>} {/* Applied consistent typography */}
          </DialogTitle>
        </DialogHeader>
        <FormContent /> {/* Call as a component */}
      </DialogContent>
    </Dialog>
  );
};

export default AddEditTransactionModal;