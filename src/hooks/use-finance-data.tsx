import { useState, useEffect, useCallback, useMemo, useRef } from 'react'; // Added useRef
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { isTransactionInCurrentWeek, isTransactionInPreviousWeek, isTransactionInCurrentMonth, getStartOfCurrentWeek, getEndOfCurrentWeek, getStartOfPreviousWeek, getEndOfPreviousWeek } from '@/lib/utils';
import { format, parseISO, getDaysInMonth } from 'date-fns';

// TypeScript Interfaces (re-defined for clarity within the hook context)
interface Transaction {
  id: string;
  date: string;
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
  budgeted: number;
  spent: number;
  color: string;
  emoji: string;
  ownerUid: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  lastUpdated: string;
  ownerUid: string;
}

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
  ownerUid: string;
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

interface BudgetSettings {
  id: string;
  rolloverEnabled: boolean;
  previousMonthLeftover: number;
  ownerUid: string;
  totalBudgeted?: number;
  microInvestingEnabled?: boolean;
  microInvestingPercentage?: number;
}

export const useFinanceData = (userUid: string | null) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>({ id: '', rolloverEnabled: true, previousMonthLeftover: 0, ownerUid: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New ref to track if default budget settings have been attempted to be created
  const hasCreatedDefaultBudgetSettings = useRef(false);

  useEffect(() => {
    if (!userUid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribes: (() => void)[] = [];

    const fetchData = (collectionName: string, setState: (data: any[]) => void) => {
      const q = query(collection(db, collectionName), where("ownerUid", "==", userUid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setState(data as any[]);
        setLoading(false);
      }, (err) => {
        console.error(`Error fetching ${collectionName}:`, err.code, err.message); // Enhanced error logging
        setError(`Failed to load ${collectionName}. Error: ${err.message}`); // More specific error message
        setLoading(false);
        toast.error(`Failed to load ${collectionName}.`);
      });
      unsubscribes.push(unsubscribe);
    };

    fetchData('transactions', setTransactions);
    fetchData('categories', setCategories);
    fetchData('accounts', setAccounts);
    fetchData('goals', setGoals);
    fetchData('recurringTransactions', setRecurringTransactions);

    // Fetch budget settings separately as it's a single document or has a different structure
    const budgetSettingsRef = collection(db, 'budgetSettings');
    const qBudgetSettings = query(budgetSettingsRef, where("ownerUid", "==", userUid));
    const unsubscribeBudgetSettings = onSnapshot(qBudgetSettings, (snapshot) => {
      if (!snapshot.empty) {
        setBudgetSettings({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BudgetSettings);
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
      toast.error(`Failed to load budget settings. Error: ${err.message}`); // More specific error message
    });
    unsubscribes.push(unsubscribeBudgetSettings);


    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [userUid]);

  const addDocument = useCallback(async (collectionName: string, data: any) => {
    if (!userUid) {
      toast.error("Authentication required to add data.");
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
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        toast.success(`${collectionName.slice(0, -1)} deleted successfully!`);
      } catch (e) {
        console.error(`Error deleting ${collectionName.slice(0, -1)}:`, e);
        toast.error(`Failed to delete ${collectionName.slice(0, -1)}.`);
      }
    }
  }, [userUid]);

  // --- Derived Financial Data ---

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(txn => txn.amount < 0 && isTransactionInCurrentMonth(txn.date));
  }, [transactions]);

  const currentWeekTransactions = useMemo(() => {
    return transactions.filter(txn => txn.amount < 0 && isTransactionInCurrentWeek(txn.date));
  }, [transactions]);

  const previousWeekTransactions = useMemo(() => {
    return transactions.filter(txn => txn.amount < 0 && isTransactionInPreviousWeek(txn.date));
  }, [transactions]);

  const currentWeekSpending = useMemo(() => {
    return currentWeekTransactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
  }, [currentWeekTransactions]);

  const previousWeekSpending = useMemo(() => {
    return previousWeekTransactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
  }, [previousWeekTransactions]);

  const totalBudgetedMonthly = useMemo(() =>
    (budgetSettings?.totalBudgeted || 0) + categories.reduce((sum, cat) => sum + cat.budgeted, 0),
    [categories, budgetSettings?.totalBudgeted]
  );

  const totalSpentMonthly = useMemo(() =>
    currentMonthTransactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0),
    [currentMonthTransactions]
  );

  const daysInMonth = useMemo(() => getDaysInMonth(new Date()), []);
  const weeklyBudgetTarget = useMemo(() => totalBudgetedMonthly / (daysInMonth / 7), [totalBudgetedMonthly, daysInMonth]);

  const remainingBudgetMonthly = useMemo(() =>
    budgetSettings.rolloverEnabled
      ? totalBudgetedMonthly - totalSpentMonthly + budgetSettings.previousMonthLeftover
      : totalBudgetedMonthly - totalSpentMonthly,
    [totalBudgetedMonthly, totalSpentMonthly, budgetSettings]
  );

  const topSpendingCategories = useMemo(() => {
    const categorySpending: { [key: string]: number } = {};
    currentMonthTransactions.forEach(txn => {
      categorySpending[txn.category] = (categorySpending[txn.category] || 0) + Math.abs(txn.amount);
    });

    return Object.entries(categorySpending)
      .sort(([, amountA], [, amountB]) => amountB - amountA)
      .slice(0, 2)
      .map(([name, amount]) => ({ name, amount }));
  }, [currentMonthTransactions]);

  return {
    transactions,
    categories,
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