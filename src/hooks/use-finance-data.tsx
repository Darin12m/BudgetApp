import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { isTransactionInCurrentWeek, isTransactionInPreviousWeek, isTransactionInCurrentMonth, getStartOfCurrentWeek, getEndOfCurrentWeek, getStartOfPreviousWeek, getEndOfPreviousWeek } from '@/lib/utils';
import { format, parseISO, getDaysInMonth, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, addMonths, addWeeks, addYears, isBefore, isAfter, isSameDay } from 'date-fns'; // Added date-fns imports for recurring logic

// TypeScript Interfaces (re-defined for clarity within the hook context)
export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  merchant: string;
  amount: number;
  category: string;
  status: 'pending' | 'cleared';
  account: string;
  ownerUid: string;
}

export interface Category {
  id: string;
  name: string;
  budgeted: number;
  spent: number; // RE-ADDED: spent will be calculated dynamically
  color: string;
  emoji: string;
  ownerUid: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  lastUpdated: string;
  ownerUid: string;
}

export interface Goal { // Exported for use in other files
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
  targetDate: string; // YYYY-MM-DD
  ownerUid: string;
}

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: 'Monthly' | 'Weekly' | 'Yearly';
  nextDate: string; // YYYY-MM-DD
  emoji: string;
  ownerUid: string;
}

export interface BudgetSettings {
  id: string;
  rolloverEnabled: boolean;
  previousMonthLeftover: number;
  ownerUid: string;
  totalBudgeted?: number;
  microInvestingEnabled?: boolean;
  microInvestingPercentage?: number;
  priceAlertThreshold?: number; // New: Price alert threshold
  categoriesInitialized?: boolean; // New: Flag to track if categories have been initialized
}

// Helper function to generate recurring transaction occurrences within a date range
const generateRecurringOccurrences = (
  recurringTxn: RecurringTransaction,
  rangeStart: Date,
  rangeEnd: Date
): Transaction[] => {
  const occurrences: Transaction[] = [];
  let currentOccurrenceDate = parseISO(recurringTxn.nextDate);

  // Find the first occurrence date that is within or after the rangeStart
  while (isBefore(currentOccurrenceDate, startOfDay(rangeStart))) {
    if (recurringTxn.frequency === 'Monthly') {
      currentOccurrenceDate = addMonths(currentOccurrenceDate, 1);
    } else if (recurringTxn.frequency === 'Weekly') {
      currentOccurrenceDate = addWeeks(currentOccurrenceDate, 1);
    } else if (recurringTxn.frequency === 'Yearly') {
      currentOccurrenceDate = addYears(currentOccurrenceDate, 1);
    } else {
      break; // Unknown frequency, prevent infinite loop
    }
  }

  // Generate all occurrences within the specified range (inclusive of start and end days)
  while (isWithinInterval(currentOccurrenceDate, { start: startOfDay(rangeStart), end: endOfDay(rangeEnd) })) {
    occurrences.push({
      id: `recurring-${recurringTxn.id}-${format(currentOccurrenceDate, 'yyyy-MM-dd')}`, // Unique ID for each occurrence
      date: format(currentOccurrenceDate, 'yyyy-MM-dd'),
      merchant: recurringTxn.name,
      amount: recurringTxn.amount,
      category: recurringTxn.category,
      status: 'cleared', // Assume recurring transactions are cleared once due
      account: 'Recurring', // A generic account for recurring transactions
      ownerUid: recurringTxn.ownerUid,
    });

    // Advance to the next potential occurrence date
    if (recurringTxn.frequency === 'Monthly') {
      currentOccurrenceDate = addMonths(currentOccurrenceDate, 1);
    } else if (recurringTxn.frequency === 'Weekly') {
      currentOccurrenceDate = addWeeks(currentOccurrenceDate, 1);
    } else if (recurringTxn.frequency === 'Yearly') {
      currentOccurrenceDate = addYears(currentOccurrenceDate, 1);
    } else {
      break; // Unknown frequency
    }
  }
  return occurrences;
};


export const useFinanceData = (userUid: string | null, startDate: Date | undefined, endDate: Date | undefined) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>({ id: '', rolloverEnabled: true, previousMonthLeftover: 0, ownerUid: '', categoriesInitialized: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to track if default budget settings have been attempted to be created
  const hasCreatedDefaultBudgetSettings = useRef(false);

  useEffect(() => {
    if (!userUid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribes: (() => void)[] = [];

    // Fetch budget settings first, as it contains the categoriesInitialized flag
    const budgetSettingsRef = collection(db, 'budgetSettings');
    const qBudgetSettings = query(budgetSettingsRef, where("ownerUid", "==", userUid));
    const unsubscribeBudgetSettings = onSnapshot(qBudgetSettings, (snapshot) => {
      if (!snapshot.empty) {
        const settings = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BudgetSettings;
        // Ensure categoriesInitialized exists, default to false if not present
        if (settings.categoriesInitialized === undefined) {
          settings.categoriesInitialized = false;
          // Update Firestore to set the flag if it's missing
          updateDoc(doc(db, 'budgetSettings', settings.id), { categoriesInitialized: false });
        }
        setBudgetSettings(settings);
        hasCreatedDefaultBudgetSettings.current = true; // Mark as true if settings are found
      } else {
        // If no settings exist AND we haven't tried to create them yet
        if (!hasCreatedDefaultBudgetSettings.current) {
          hasCreatedDefaultBudgetSettings.current = true; // Mark immediately to prevent re-entry
          addDoc(budgetSettingsRef, {
            ownerUid: userUid,
            rolloverEnabled: true,
            previousMonthLeftover: 0,
            totalBudgeted: 0,
            microInvestingEnabled: true,
            microInvestingPercentage: 30,
            priceAlertThreshold: 5, // Default price alert threshold
            categoriesInitialized: false, // Initialize new flag to false
            createdAt: serverTimestamp(), // Add createdAt for default settings
          }).then(() => {
            // No need to set state here, onSnapshot will pick it up
          }).catch(err => {
            console.error("Error creating default budget settings:", err);
            toast.error("Failed to create default budget settings.");
            hasCreatedDefaultBudgetSettings.current = false; // Reset if creation failed
          });
        }
      }
    }, (err) => {
      console.error("Error fetching budget settings:", err.code, err.message); // Enhanced error logging
      toast.error(`Failed to load budget settings. Error: ${err.code} - ${err.message}`);
    });
    unsubscribes.push(unsubscribeBudgetSettings);

    const fetchData = (collectionName: string, setState: (data: any[]) => void, applyDateFilter: boolean = false) => {
      let q = query(collection(db, collectionName), where("ownerUid", "==", userUid));

      if (applyDateFilter && startDate && endDate) {
        // Assuming 'date' field in Firestore is 'YYYY-MM-DD' string
        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');
        q = query(q, where("date", ">=", formattedStartDate), where("date", "<=", formattedEndDate));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setState(data as any[]);
        setLoading(false);

        // Special handling for categories: add defaults if empty AND not yet initialized
        if (collectionName === 'categories' && budgetSettings.categoriesInitialized !== undefined) { // Ensure budgetSettings is loaded
          if (snapshot.empty && !budgetSettings.categoriesInitialized) {
            const defaultCategories = [
              { name: 'Groceries', budgeted: 300, spent: 0, color: 'hsl(var(--emerald))', emoji: '🛒', ownerUid: userUid, createdAt: serverTimestamp() },
              { name: 'Rent', budgeted: 1200, spent: 0, color: 'hsl(var(--blue))', emoji: '🏠', ownerUid: userUid, createdAt: serverTimestamp() },
              { name: 'Utilities', budgeted: 150, spent: 0, color: 'hsl(var(--lilac))', emoji: '💡', ownerUid: userUid, createdAt: serverTimestamp() },
              { name: 'Transportation', budgeted: 100, spent: 0, color: '#f59e0b', emoji: '🚗', ownerUid: userUid, createdAt: serverTimestamp() },
              { name: 'Entertainment', budgeted: 80, spent: 0, color: '#ef4444', emoji: '🎉', ownerUid: userUid, createdAt: serverTimestamp() },
              { name: 'Uncategorized', budgeted: 0, spent: 0, color: '#6B7280', emoji: '🏷️', ownerUid: userUid, createdAt: serverTimestamp() },
            ];

            defaultCategories.forEach(async (cat) => {
              try {
                await addDoc(collection(db, "categories"), cat);
              } catch (e) {
                console.error("Error adding default category:", e);
                toast.error("Failed to add default category data.");
              }
            });

            // Mark categories as initialized in budgetSettings after adding defaults
            if (budgetSettings.id) {
              updateDoc(doc(db, 'budgetSettings', budgetSettings.id), { categoriesInitialized: true });
            }
          } else if (!snapshot.empty && !budgetSettings.categoriesInitialized) {
            // If categories are found (meaning user added them or defaults were added previously)
            // and the flag is still false, set it to true.
            if (budgetSettings.id) {
              updateDoc(doc(db, 'budgetSettings', budgetSettings.id), { categoriesInitialized: true });
            }
          }
        }
      }, (err) => {
        console.error(`Error fetching ${collectionName}:`, err.code, err.message); // Enhanced error logging
        setError(`Failed to load ${collectionName}. Error: ${err.message}`); // More specific error message
        setLoading(false);
        toast.error(`Failed to load ${collectionName}.`);
      });
      unsubscribes.push(unsubscribe);
    };

    // Apply date filter to transactions
    fetchData('transactions', setTransactions, true);
    // Categories, accounts, goals, recurring transactions are typically not date-filtered in this manner
    fetchData('categories', setCategories);
    fetchData('accounts', setAccounts);
    fetchData('goals', setGoals);
    fetchData('recurringTransactions', setRecurringTransactions);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [userUid, startDate, endDate, budgetSettings.categoriesInitialized, budgetSettings.id]); // Add budgetSettings.categoriesInitialized and budgetSettings.id to dependencies

  const addDocument = useCallback(async (collectionName: string, data: any) => {
    if (!userUid) {
      toast.error("You must be logged in to save data.");
      return;
    }
    try {
      await addDoc(collection(db, collectionName), {
        ...data,
        ownerUid: userUid,
        createdAt: serverTimestamp(),
      });
      toast.success(`${collectionName.slice(0, -1)} added successfully!`);
    } catch (e) {
      console.error(`Error adding ${collectionName.slice(0, -1)}:`, e);
      toast.error(`Failed to add ${collectionName.slice(0, -1)}.`);
    }
  }, [userUid]);

  const updateDocument = useCallback(async (collectionName: string, id: string, data: any) => {
    if (!userUid) {
      toast.error("Authentication required to update data.");
      return;
    }
    try {
      await updateDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      toast.success(`${collectionName.slice(0, -1)} updated successfully!`);
    } catch (e) {
      console.error(`Error updating ${collectionName.slice(0, -1)}:`, e);
      toast.error(`Failed to update ${collectionName.slice(0, -1)}.`);
    }
  }, [userUid]);

  const deleteDocument = useCallback(async (collectionName: string, id: string) => {
    if (!userUid) {
      toast.error("Authentication required to delete data.");
      return;
    }
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast.success(`${collectionName.slice(0, -1)} deleted successfully!`);
    } catch (e) {
      console.error(`Error deleting ${collectionName.slice(0, -1)}:`, e);
      toast.error(`Failed to delete ${collectionName.slice(0, -1)}.`);
    }
  }, [userUid]);

  // --- Derived Financial Data ---

  // Combine actual transactions with generated recurring transaction occurrences
  const allTransactionsInDateRange = useMemo(() => {
    if (!startDate || !endDate) return [];

    const recurringOccurrences: Transaction[] = [];
    recurringTransactions.forEach(rt => {
      recurringOccurrences.push(...generateRecurringOccurrences(rt, startDate, endDate));
    });

    // Filter actual transactions to be within the selected range
    const filteredActualTransactions = transactions.filter(txn => {
      const txnDate = parseISO(txn.date);
      return isWithinInterval(txnDate, { start: startOfDay(startDate), end: endOfDay(endDate) });
    });

    return [...filteredActualTransactions, ...recurringOccurrences];
  }, [transactions, recurringTransactions, startDate, endDate]);


  const currentMonthTransactions = useMemo(() => {
    if (!startDate || !endDate) return [];
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    return allTransactionsInDateRange.filter(txn => {
      const txnDate = parseISO(txn.date);
      return isWithinInterval(txnDate, { start: startOfCurrentMonth, end: endOfCurrentMonth });
    });
  }, [allTransactionsInDateRange, startDate, endDate]);

  const currentWeekTransactions = useMemo(() => {
    if (!startDate || !endDate) return [];
    const now = new Date();
    const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
    const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });

    return allTransactionsInDateRange.filter(txn => {
      const txnDate = parseISO(txn.date);
      return isWithinInterval(txnDate, { start: startOfCurrentWeek, end: endOfCurrentWeek });
    });
  }, [allTransactionsInDateRange, startDate, endDate]);

  const previousWeekTransactions = useMemo(() => {
    if (!startDate || !endDate) return [];
    const now = new Date();
    const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    return allTransactionsInDateRange.filter(txn => {
      const txnDate = parseISO(txn.date);
      return isWithinInterval(txnDate, { start: prevWeekStart, end: prevWeekEnd });
    });
  }, [allTransactionsInDateRange, startDate, endDate]);

  const currentWeekSpending = useMemo(() => {
    return currentWeekTransactions.filter(txn => txn.amount < 0).reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
  }, [currentWeekTransactions]);

  const previousWeekSpending = useMemo(() => {
    return previousWeekTransactions.filter(txn => txn.amount < 0).reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
  }, [previousWeekTransactions]);

  const totalBudgetedMonthly = useMemo(() =>
    (budgetSettings?.totalBudgeted || 0) + categories.reduce((sum, cat) => sum + cat.budgeted, 0),
    [categories, budgetSettings?.totalBudgeted]
  );

  const totalSpentMonthly = useMemo(() =>
    currentMonthTransactions.filter(txn => txn.amount < 0).reduce((sum, txn) => sum + Math.abs(txn.amount), 0),
    [currentMonthTransactions]
  );

  // Categories with dynamically calculated 'spent' for the current period
  const categoriesWithSpent = useMemo(() => {
    return categories.map(cat => {
      const spent = allTransactionsInDateRange
        .filter(txn => txn.category === cat.name && txn.amount < 0) // Only count expenses
        .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
      return { ...cat, spent };
    });
  }, [categories, allTransactionsInDateRange]);


  const daysInMonth = useMemo(() => getDaysInMonth(new Date()), []);
  const weeklyBudgetTarget = useMemo(() => totalBudgetedMonthly / (daysInMonth / 7), [totalBudgetedMonthly, daysInMonth]);

  const remainingBudgetMonthly = useMemo(() =>
    budgetSettings.rolloverEnabled
      ? totalBudgetedMonthly - totalSpentMonthly + budgetSettings.previousMonthLeftover
      : totalBudgetedMonthly - totalSpentMonthly,
    [totalBudgetedMonthly, totalSpentMonthly, budgetSettings]
  );

  const topSpendingCategories = useMemo(() => {
    const categorySpending: Record<string, number> = {}; // Fix: Initialize as Record<string, number>
    currentMonthTransactions.filter(txn => txn.amount < 0).forEach(txn => { // Only consider expenses
      categorySpending[txn.category] = (categorySpending[txn.category] || 0) + Math.abs(txn.amount);
    });

    return Object.entries(categorySpending)
      .sort(([, amountA]: [string, number], [, amountB]: [string, number]) => amountB - amountA) // Fix: Explicitly type amounts as number
      .slice(0, 2)
      .map(([name, amount]) => ({ name, amount }));
  }, [currentMonthTransactions]);

  return {
    transactions: allTransactionsInDateRange, // Return combined transactions
    categories: categoriesWithSpent, // Return categories with calculated spent
    accounts,
    goals,
    recurringTransactions,
    budgetSettings,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    // New derived values
    currentWeekSpending,
    previousWeekSpending,
    totalBudgetedMonthly,
    totalSpentMonthly,
    remainingBudgetMonthly,
    weeklyBudgetTarget,
    topSpendingCategories,
    currentMonthTransactions,
  };
};