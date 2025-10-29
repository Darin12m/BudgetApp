import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { isTransactionInCurrentWeek, isTransactionInPreviousWeek, isTransactionInCurrentMonth, getStartOfCurrentWeek, getEndOfCurrentWeek, getStartOfPreviousWeek, getEndOfPreviousWeek } from '@/lib/utils';
import { format, parseISO, getDaysInMonth, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, addMonths, addWeeks, addYears, isBefore, isAfter, isSameDay } from 'date-fns';

// TypeScript Interfaces
export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  merchant: string;
  amount: number; // Stored in USD
  categoryId: string; // Changed from 'category' to 'categoryId'
  status: 'pending' | 'cleared';
  ownerUid: string;
  isRecurring: boolean; // New flag: true if this transaction is an instance of a recurring template
  recurringTransactionId?: string; // Link to RecurringTransaction template if isRecurring is true
  inputCurrencyCode: string; // New: Currency code used when the amount was input
}

export interface Category {
  id: string;
  name: string;
  budgeted: number; // Stored in USD
  spent: number; // Calculated dynamically, will be in USD
  color: string;
  emoji: string;
  ownerUid: string;
  inputCurrencyCode: string; // New: Currency code used when the budgeted amount was input
}

export interface Account {
  id: string;
  name: string;
  balance: number; // Stored in USD
  type: 'checking' | 'savings' | 'credit' | 'investment';
  lastUpdated: string;
  ownerUid: string;
  inputCurrencyCode: string; // New: Currency code used when the balance was last updated
}

export interface Goal {
  id: string;
  name: string;
  target: number; // Stored in USD
  current: number; // Stored in USD
  color: string;
  targetDate: string; // YYYY-MM-DD
  ownerUid: string;
  inputCurrencyCode: string; // New: Currency code used when the target/current amounts were input
}

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number; // Stored in USD
  categoryId: string; // Changed from 'category' to 'categoryId'
  frequency: 'Monthly' | 'Weekly' | 'Yearly';
  nextDate: string; // YYYY-MM-DD
  emoji: string;
  ownerUid: string;
  inputCurrencyCode: string; // New: Currency code used when the amount was input
}

export interface BudgetSettings {
  id: string;
  rolloverEnabled: boolean;
  previousMonthLeftover: number; // Stored in USD
  ownerUid: string;
  totalBudgeted?: number; // Stored in USD
  microInvestingEnabled?: boolean;
  microInvestingPercentage?: number;
  priceAlertThreshold?: number;
  inputCurrencyCode: string; // New: Currency code used when budget amounts were input
  // categoriesInitialized?: boolean; // Removed as categories will no longer be auto-initialized
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
      amount: recurringTxn.amount, // Already in USD
      categoryId: recurringTxn.categoryId,
      status: 'cleared', // Assume recurring transactions are cleared once due
      ownerUid: recurringTxn.ownerUid,
      isRecurring: true,
      recurringTransactionId: recurringTxn.id,
      inputCurrencyCode: recurringTxn.inputCurrencyCode, // Pass through input currency code
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
  const [transactions, setTransactions] = useState<Transaction[]>([]); // Actual transactions from Firestore
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTransaction[]>([]); // Recurring transaction templates
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>({ id: '', rolloverEnabled: true, previousMonthLeftover: 0, ownerUid: '', inputCurrencyCode: 'USD' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uncategorizedCategoryId, setUncategorizedCategoryId] = useState<string>('loading-uncategorized'); // Default to a loading state

  const hasCreatedDefaultBudgetSettings = useRef(false);
  const hasCreatedDefaultCategories = useRef(false); // New ref for categories

  useEffect(() => {
    if (!userUid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribes: (() => void)[] = [];

    // Fetch budget settings first
    const budgetSettingsRef = collection(db, 'budgetSettings');
    const qBudgetSettings = query(budgetSettingsRef, where("ownerUid", "==", userUid));
    const unsubscribeBudgetSettings = onSnapshot(qBudgetSettings, (snapshot) => {
      if (!snapshot.empty) {
        const settings = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BudgetSettings;
        setBudgetSettings(settings);
        hasCreatedDefaultBudgetSettings.current = true;
      } else {
        if (!hasCreatedDefaultBudgetSettings.current) {
          hasCreatedDefaultBudgetSettings.current = true;
          addDoc(budgetSettingsRef, {
            ownerUid: userUid,
            rolloverEnabled: true,
            previousMonthLeftover: 0,
            totalBudgeted: 0,
            microInvestingEnabled: true,
            microInvestingPercentage: 30,
            priceAlertThreshold: 5,
            inputCurrencyCode: 'USD', // Default to USD for new settings
            createdAt: serverTimestamp(),
          }).then(() => {}).catch(err => {
            console.error("Error creating default budget settings:", err);
            toast.error("Failed to create default budget settings.");
            hasCreatedDefaultBudgetSettings.current = false;
          });
        }
      }
    }, (err) => {
      console.error("Error fetching budget settings:", err.code, err.message);
      toast.error(`Failed to load budget settings. Error: ${err.code} - ${err.message}`);
    });
    unsubscribes.push(unsubscribeBudgetSettings);

    // Fetch categories and ensure 'Uncategorized' exists
    const categoriesRef = collection(db, 'categories');
    const qCategories = query(categoriesRef, where("ownerUid", "==", userUid));
    const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
      const fetchedCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
      setCategories(fetchedCategories);

      const existingUncategorized = fetchedCategories.find(cat => cat.name === 'Uncategorized');
      if (existingUncategorized) {
        setUncategorizedCategoryId(existingUncategorized.id);
      } else {
        if (!hasCreatedDefaultCategories.current) {
          hasCreatedDefaultCategories.current = true;
          addDoc(categoriesRef, {
            name: 'Uncategorized',
            budgeted: 0,
            spent: 0, // Will be calculated dynamically
            color: '#9CA3AF', // A neutral gray color
            emoji: '❓',
            ownerUid: userUid,
            inputCurrencyCode: 'USD',
            createdAt: serverTimestamp(),
          }).then((docRef) => {
            setUncategorizedCategoryId(docRef.id);
            toast.success("Default 'Uncategorized' category created.");
          }).catch(err => {
            console.error("Error creating default 'Uncategorized' category:", err);
            toast.error("Failed to create default 'Uncategorized' category.");
            hasCreatedDefaultCategories.current = false;
          });
        }
      }
    }, (err) => {
      console.error("Error fetching categories:", err.code, err.message);
      toast.error(`Failed to load categories. Error: ${err.code} - ${err.message}`);
    });
    unsubscribes.push(unsubscribeCategories);


    const fetchData = (collectionName: string, setState: (data: any[]) => void, applyDateFilter: boolean = false) => {
      let q = query(collection(db, collectionName), where("ownerUid", "==", userUid));

      if (applyDateFilter && startDate && endDate) {
        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');
        q = query(q, where("date", ">=", formattedStartDate), where("date", "<=", formattedEndDate));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setState(data as any[]);
        setLoading(false);
      }, (err) => {
        console.error(`Error fetching ${collectionName}:`, err.code, err.message);
        setError(`Failed to load ${collectionName}. Error: ${err.message}`);
        setLoading(false);
        toast.error(`Failed to load ${collectionName}.`);
      });
      unsubscribes.push(unsubscribe);
    };

    fetchData('transactions', setTransactions, true);
    fetchData('accounts', setAccounts);
    fetchData('goals', setGoals);
    fetchData('recurringTransactions', setRecurringTemplates); // Fetch recurring templates

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [userUid, startDate, endDate]);

  const addDocument = useCallback(async (collectionName: string, data: any) => {
    if (!userUid) {
      toast.error("You must be logged in to save data.");
      return;
    }

    // Create a mutable copy of data for sanitation
    const sanitizedData = { ...data };

    // Remove undefined fields
    Object.keys(sanitizedData).forEach(key => {
      if (sanitizedData[key] === undefined) {
        delete sanitizedData[key];
      }
    });

    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...sanitizedData, // Use sanitized data
        ownerUid: userUid,
        createdAt: serverTimestamp(),
      });
      toast.success(`${collectionName.slice(0, -1)} added successfully!`);
      return docRef.id; // Return the ID of the newly added document
    } catch (e: any) { // Explicitly type 'e' as 'any' to access 'code' and 'message'
      console.error(`Error adding ${collectionName.slice(0, -1)}:`, e.code, e.message, e);
      toast.error(`Failed to add ${collectionName.slice(0, -1)}: ${e.message}`);
      return null;
    }
  }, [userUid]);

  const updateDocument = useCallback(async (collectionName: string, id: string, data: any) => {
    if (!userUid) {
      toast.error("Authentication required to update data.");
      return;
    }

    // Create a mutable copy of data for sanitation
    const sanitizedData = { ...data };

    // Remove undefined fields
    Object.keys(sanitizedData).forEach(key => {
      if (sanitizedData[key] === undefined) {
        delete sanitizedData[key];
      }
    });

    try {
      await updateDoc(doc(db, collectionName, id), {
        ...sanitizedData, // Use sanitized data
        updatedAt: serverTimestamp(),
      });
      toast.success(`${collectionName.slice(0, -1)} updated successfully!`);
    } catch (e: any) { // Explicitly type 'e' as 'any'
      console.error(`Error updating ${collectionName.slice(0, -1)}:`, e.code, e.message, e);
      toast.error(`Failed to update ${collectionName.slice(0, -1)}: ${e.message}`);
    }
  }, [userUid]);

  const deleteDocument = useCallback(async (collectionName: string, id: string) => {
    if (!userUid) {
      toast.error("Authentication required to delete data.");
      return;
    }
    try {
      if (collectionName === 'categories') {
        // When a category is deleted, re-assign its transactions to 'Uncategorized'
        const uncategorizedCategory = categories.find(cat => cat.name === 'Uncategorized');
        if (uncategorizedCategory) {
          const batchUpdates: Promise<void>[] = [];
          transactions.filter(txn => txn.categoryId === id).forEach(txn => {
            batchUpdates.push(updateDoc(doc(db, 'transactions', txn.id), { categoryId: uncategorizedCategory.id }));
          });
          recurringTemplates.filter(rt => rt.categoryId === id).forEach(rt => {
            batchUpdates.push(updateDoc(doc(db, 'recurringTransactions', rt.id), { categoryId: uncategorizedCategory.id }));
          });
          await Promise.all(batchUpdates);
        }
      }
      await deleteDoc(doc(db, collectionName, id));
      toast.success(`${collectionName.slice(0, -1)} deleted successfully!`);
    } catch (e: any) { // Explicitly type 'e' as 'any'
      console.error(`Error deleting ${collectionName.slice(0, -1)}:`, e.code, e.message, e);
      toast.error(`Failed to delete ${collectionName.slice(0, -1)}: ${e.message}`);
    }
  }, [userUid, transactions, recurringTemplates, categories]);

  // --- Derived Financial Data ---

  // Combine actual transactions with generated recurring transaction occurrences
  const allTransactionsInDateRange = useMemo(() => {
    if (!startDate || !endDate) return [];

    const recurringOccurrences: Transaction[] = [];
    recurringTemplates.forEach(rt => {
      recurringOccurrences.push(...generateRecurringOccurrences(rt, startDate, endDate));
    });

    // Filter actual transactions to be within the selected range
    const filteredActualTransactions = transactions.filter(txn => {
      const txnDate = parseISO(txn.date);
      return isWithinInterval(txnDate, { start: startOfDay(startDate), end: endOfDay(endDate) });
    });

    // Merge and deduplicate: actual transactions take precedence over generated recurring ones
    const mergedTransactionsMap = new Map<string, Transaction>();
    
    // Add generated recurring occurrences first
    recurringOccurrences.forEach(txn => mergedTransactionsMap.set(txn.id, txn));
    
    // Add actual transactions, overwriting generated ones if they have the same ID
    // (This handles cases where a generated recurring transaction was later saved as an actual one)
    filteredActualTransactions.forEach(txn => mergedTransactionsMap.set(txn.id, txn));

    return Array.from(mergedTransactionsMap.values());
  }, [transactions, recurringTemplates, startDate, endDate]);


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
        .filter(txn => txn.categoryId === cat.id && txn.amount < 0) // Only count expenses
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
    const categorySpending: Record<string, number> = {};
    currentMonthTransactions.filter(txn => txn.amount < 0).forEach(txn => {
      const category = categories.find(c => c.id === txn.categoryId);
      if (category) {
        categorySpending[category.name] = (categorySpending[category.name] || 0) + Math.abs(txn.amount);
      }
    });

    return Object.entries(categorySpending)
      .sort(([, amountA], [, amountB]) => amountB - amountA)
      .slice(0, 2)
      .map(([name, amount]) => ({ name, amount }));
  }, [currentMonthTransactions, categories]);

  return {
    transactions: allTransactionsInDateRange, // Return combined transactions
    categories: categoriesWithSpent, // Return categories with calculated spent
    accounts,
    goals,
    recurringTransactions: recurringTemplates, // Return recurring templates
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
    uncategorizedCategoryId, // Return the uncategorized category ID
  };
};