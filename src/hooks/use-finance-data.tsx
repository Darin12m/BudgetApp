import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

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
  rolloverEnabled: boolean;
  previousMonthLeftover: number;
  ownerUid: string;
}

export const useFinanceData = (userUid: string | null) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>({ rolloverEnabled: true, previousMonthLeftover: 0, ownerUid: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.error(`Error fetching ${collectionName}:`, err);
        setError(`Failed to load ${collectionName}. Please check your internet connection and Firebase rules.`);
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
      } else {
        // If no settings exist, create default ones
        addDoc(budgetSettingsRef, {
          ownerUid: userUid,
          rolloverEnabled: true,
          previousMonthLeftover: 0,
        }).then(docRef => {
          setBudgetSettings({ id: docRef.id, ownerUid: userUid, rolloverEnabled: true, previousMonthLeftover: 0 });
        }).catch(err => {
          console.error("Error creating default budget settings:", err);
          toast.error("Failed to create default budget settings.");
        });
      }
    }, (err) => {
      console.error("Error fetching budget settings:", err);
      toast.error("Failed to load budget settings.");
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
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast.success(`${collectionName.slice(0, -1)} deleted successfully!`);
    } catch (e) {
      console.error(`Error deleting ${collectionName.slice(0, -1)}:`, e);
      toast.error(`Failed to delete ${collectionName.slice(0, -1)}.`);
    }
  }, [userUid]);

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
  };
};