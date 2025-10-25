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

interface AddEditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'ownerUid'>, isRecurring: boolean, recurringDetails?: Omit<RecurringTransaction, 'id' | 'ownerUid'>) => void;
  onDelete: (id: string) => void;
  transactionToEdit?: Transaction | null;
  categories: Category[];
  // Removed accounts prop
  recurringTemplates: RecurringTransaction[];
}

const AddEditTransactionModal: React.FC<AddEditTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  transactionToEdit,
  categories,
  // Removed accounts prop
  recurringTemplates,
}) => {
  const { isMobile } = useDeviceDetection();
  const { formatCurrency } = useCurrency();

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [status, setStatus] = useState<'pending' | 'cleared'>('pending');
  // Removed selectedAccount state
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
        setAmount(Math.abs(transactionToEdit.amount).toString());
        setIsExpense(transactionToEdit.amount < 0);
        setSelectedCategoryId(transactionToEdit.categoryId);
        setStatus(transactionToEdit.status);
        // Removed setSelectedAccount
        
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
        if (categories.length > 0) {
          const uncategorized = categories.find(cat => cat.name === 'Uncategorized');
          setSelectedCategoryId(uncategorized ? uncategorized.id : categories[0].id);
        } else {
          setSelectedCategoryId(''); // No categories available
        }
        setStatus('pending');
        // Removed setSelectedAccount
        setIsRecurring(false);
        setFrequency('Monthly');
        setNextDate(undefined);
        setIsExpense(true);
      }
      setErrors({});
    }
  }, [isOpen, transactionToEdit, categories, recurringTemplates, isInstanceFromRecurringTemplate]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!date) newErrors.date = 'Date is required.';
    if (!merchant.trim()) newErrors.merchant = 'Merchant is required.';
    if (!amount || parseFloat(amount) === 0) newErrors.amount = 'Amount is required and must be non-zero.';
    if (isNaN(parseFloat(amount))) newErrors.amount = 'Amount must be a valid number.';
    if (!selectedCategoryId.trim()) newErrors.categoryId = 'Category is required.';
    // Removed account validation
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

    const transactionPayload: Omit<Transaction, 'id' | 'ownerUid'> = {
      date: date ? format(date, 'yyyy-MM-dd') : '',
      merchant: merchant.trim(),
      amount: finalAmount,
      categoryId: selectedCategoryId,
      status,
      // Removed account from payload
      isRecurring: isRecurring,
      recurringTransactionId: isInstanceFromRecurringTemplate ? transactionToEdit?.recurringTransactionId : undefined,
    };

    let recurringPayload: Omit<RecurringTransaction, 'id' | 'ownerUid'> | undefined = undefined;
    if (isRecurring && nextDate) {
      const categoryEmoji = categories.find(cat => cat.id === selectedCategoryId)?.emoji || '💳';
      recurringPayload = {
        name: merchant.trim(),
        amount: finalAmount,
        categoryId: selectedCategoryId,
        frequency,
        nextDate: format(nextDate, 'yyyy-MM-dd'),
        emoji: categoryEmoji,
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

  const FormContent = (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="merchant" className="text-right">
          Merchant
        </Label>
        <div className="col-span-3">
          <Input
            id="merchant"
            value={merchant}
            onChange={(e) => { setMerchant(e.target.value); setErrors(prev => ({ ...prev, merchant: '' })); }}
            placeholder="e.g., Starbucks"
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          />
          {errors.merchant && <p className="text-destructive text-xs mt-1">{errors.merchant}</p>}
        </div>
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
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border border-border/50 card-shadow backdrop-blur-lg">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { setDate(d); setErrors(prev => ({ ...prev, date: '' })); }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
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
        <Label htmlFor="status" className="text-right">
          Status
        </Label>
        <div className="col-span-3">
          <Select value={status} onValueChange={(value: 'pending' | 'cleared') => setStatus(value)}>
            <SelectTrigger className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cleared">Cleared</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Removed Account selection */}

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="isRecurring" className="text-right">
          Recurring
        </Label>
        <div className="col-span-3 flex items-center">
          <Switch
            id="isRecurring"
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
            disabled={!!isInstanceFromRecurringTemplate}
          />
          <span className="ml-2 text-sm text-muted-foreground">
            {isRecurring ? 'Enabled' : 'Disabled'}
          </span>
          {isInstanceFromRecurringTemplate && (
            <span className="ml-2 text-xs text-muted-foreground">(Managed as recurring template)</span>
          )}
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
        {isEditing && (
          <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" className="w-full sm:w-auto transition-transform hover:scale-[1.02] active:scale-98 min-h-[44px]">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the transaction "{transactionToEdit?.merchant}".
                  {isInstanceFromRecurringTemplate && " Note: This will only delete this specific instance, not the recurring template."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-muted/50 border-none hover:bg-muted">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteClick} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <div className="flex gap-2 w-full sm:w-auto">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-muted/50 border-none hover:bg-muted transition-transform hover:scale-[1.02] active:scale-98 min-h-[44px]">
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-[1.02] active:scale-98 min-h-[44px]">
            <Save className="h-4 w-4 mr-2" /> Save Transaction
          </Button>
        </div>
      </DialogFooter>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="safe-top safe-bottom bg-card backdrop-blur-lg">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center">
              {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
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
            {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
          </DialogTitle>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
};

export default AddEditTransactionModal;