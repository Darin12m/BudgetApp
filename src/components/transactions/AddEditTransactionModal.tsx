"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Save, X, Trash2, Calendar as CalendarIcon, Repeat } from 'lucide-react';
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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components

interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  merchant: string;
  amount: number;
  category: string;
  status: 'pending' | 'cleared';
  account: string;
  ownerUid: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
}

interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: 'Monthly' | 'Weekly' | 'Yearly';
  nextDate: string;
  emoji: string;
  ownerUid: string;
}

interface AddEditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'ownerUid'>, isRecurring: boolean, recurringDetails?: Omit<RecurringTransaction, 'id' | 'ownerUid' | 'emoji'>) => void;
  onDelete: (id: string) => void;
  transactionToEdit?: Transaction | null;
  categories: Category[];
  accounts: Account[];
  recurringTransactions: RecurringTransaction[]; // Pass recurring transactions to check if this transaction is one
}

const AddEditTransactionModal: React.FC<AddEditTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  transactionToEdit,
  categories,
  accounts,
  recurringTransactions,
}) => {
  const { isMobile } = useDeviceDetection();
  const { formatCurrency } = useCurrency();

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Uncategorized');
  const [status, setStatus] = useState<'pending' | 'cleared'>('pending');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'Monthly' | 'Weekly' | 'Yearly'>('Monthly');
  const [nextDate, setNextDate] = useState<Date | undefined>(undefined);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false); // State for delete confirmation dialog

  const isEditing = !!transactionToEdit;
  const isExistingRecurring = isEditing && recurringTransactions.some(rt => rt.name === transactionToEdit?.merchant && rt.amount === transactionToEdit?.amount && rt.category === transactionToEdit?.category);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setDate(new Date(transactionToEdit.date));
        setMerchant(transactionToEdit.merchant);
        setAmount(transactionToEdit.amount.toString());
        setSelectedCategory(transactionToEdit.category);
        setStatus(transactionToEdit.status);
        setSelectedAccount(transactionToEdit.account);

        // Check if the transaction being edited is a recurring one
        const matchingRecurring = recurringTransactions.find(rt =>
          rt.name === transactionToEdit.merchant &&
          rt.amount === transactionToEdit.amount &&
          rt.category === transactionToEdit.category
        );
        if (matchingRecurring) {
          setIsRecurring(true);
          setFrequency(matchingRecurring.frequency);
          setNextDate(new Date(matchingRecurring.nextDate));
        } else {
          setIsRecurring(false);
          setFrequency('Monthly');
          setNextDate(undefined);
        }
      } else {
        // Reset for new transaction
        setDate(new Date());
        setMerchant('');
        setAmount('');
        setSelectedCategory(categories.length > 0 ? categories[0].name : 'Uncategorized');
        setStatus('pending');
        setSelectedAccount(accounts.length > 0 ? accounts[0].name : '');
        setIsRecurring(false);
        setFrequency('Monthly');
        setNextDate(undefined);
      }
      setErrors({});
    }
  }, [isOpen, transactionToEdit, categories, accounts, recurringTransactions]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!date) newErrors.date = 'Date is required.';
    if (!merchant.trim()) newErrors.merchant = 'Merchant is required.';
    if (!amount || parseFloat(amount) === 0) newErrors.amount = 'Amount is required and must be non-zero.';
    if (isNaN(parseFloat(amount))) newErrors.amount = 'Amount must be a valid number.';
    if (!selectedCategory.trim()) newErrors.category = 'Category is required.';
    if (!selectedAccount.trim()) newErrors.account = 'Account is required.';
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

    const transactionPayload: Omit<Transaction, 'id' | 'ownerUid'> = {
      date: date ? format(date, 'yyyy-MM-dd') : '',
      merchant: merchant.trim(),
      amount: parseFloat(amount),
      category: selectedCategory,
      status,
      account: selectedAccount,
    };

    let recurringPayload: Omit<RecurringTransaction, 'id' | 'ownerUid' | 'emoji'> | undefined = undefined;
    if (isRecurring && nextDate) {
      const categoryEmoji = categories.find(cat => cat.name === selectedCategory)?.emoji || '💳';
      recurringPayload = {
        name: merchant.trim(),
        amount: parseFloat(amount),
        category: selectedCategory,
        frequency,
        nextDate: format(nextDate, 'yyyy-MM-dd'),
        emoji: categoryEmoji, // Include emoji for recurring transaction
      };
    }

    onSave(transactionPayload, isRecurring, recurringPayload);
    onClose();
  };

  const handleDeleteClick = () => {
    if (transactionToEdit?.id) {
      onDelete(transactionToEdit.id);
      setIsDeleteConfirmOpen(false); // Close dialog after deletion
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
            placeholder={`e.g., ${formatCurrency(-25.50)} for expense, ${formatCurrency(100)} for income`}
            className="bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]"
          />
          {errors.amount && <p className="text-destructive text-xs mt-1">{errors.amount}</p>}
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
          <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setErrors(prev => ({ ...prev, category: '' })); }}>
            <SelectTrigger className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  <span className="mr-2">{cat.emoji}</span> {cat.name}
                </SelectItem>
              ))}
              {!categories.some(cat => cat.name === 'Uncategorized') && (
                <SelectItem value="Uncategorized">
                  <span className="mr-2">🏷️</span> Uncategorized
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-destructive text-xs mt-1">{errors.category}</p>}
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

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="account" className="text-right">
          Account
        </Label>
        <div className="col-span-3">
          <Select value={selectedAccount} onValueChange={(value) => { setSelectedAccount(value); setErrors(prev => ({ ...prev, account: '' })); }}>
            <SelectTrigger className="w-full bg-muted/50 border-none focus-visible:ring-primary focus-visible:ring-offset-0 min-h-[44px]">
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.name}>
                  {acc.name} ({acc.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.account && <p className="text-destructive text-xs mt-1">{errors.account}</p>}
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
            disabled={isExistingRecurring} // Disable if it's already a recurring transaction
          />
          <span className="ml-2 text-sm text-muted-foreground">
            {isRecurring ? 'Enabled' : 'Disabled'}
          </span>
          {isExistingRecurring && (
            <span className="ml-2 text-xs text-muted-foreground">(Managed as recurring)</span>
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