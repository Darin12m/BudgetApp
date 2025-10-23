import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

// TypeScript Interfaces
export interface Investment {
  id: string;
  name: string;
  type: 'Stock' | 'Crypto';
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  datePurchased: string; // YYYY-MM-DD
  ownerUid: string;
}

export const useInvestmentData = (userUid: string | null) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userUid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(collection(db, "investments"), where("ownerUid", "==", userUid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedInvestments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Investment[];
      setInvestments(fetchedInvestments);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching investments:", err);
      setError("Failed to load investments. Please check your internet connection and Firebase rules.");
      setLoading(false);
      toast.error("Failed to load investments.");
    });

    return () => unsubscribe(); // Clean up the listener
  }, [userUid]);

  const addInvestment = useCallback(async (data: Omit<Investment, 'id' | 'ownerUid'>) => {
    if (!userUid) {
      toast.error("Authentication required to add investment.");
      return;
    }
    try {
      await addDoc(collection(db, "investments"), {
        ...data,
        ownerUid: userUid,
        createdAt: serverTimestamp(),
      });
      toast.success("Investment added successfully!");
    } catch (e) {
      console.error("Error adding investment:", e);
      toast.error("Failed to add investment.");
    }
  }, [userUid]);

  const updateInvestment = useCallback(async (id: string, data: Partial<Omit<Investment, 'id' | 'ownerUid'>>) => {
    if (!userUid) {
      toast.error("Authentication required to update investment.");
      return;
    }
    try {
      await updateDoc(doc(db, "investments", id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      toast.success("Investment updated successfully!");
    } catch (e) {
      console.error("Error updating investment:", e);
      toast.error("Failed to update investment.");
    }
  }, [userUid]);

  const deleteInvestment = useCallback(async (id: string) => {
    if (!userUid) {
      toast.error("Authentication required to delete investment.");
      return;
    }
    if (confirm('Are you sure you want to delete this investment?')) {
      try {
        await deleteDoc(doc(db, "investments", id));
        toast.success("Investment deleted successfully!");
      } catch (e) {
        console.error("Error deleting investment:", e);
        toast.error("Failed to delete investment.");
      }
    }
  }, [userUid]);

  return {
    investments,
    loading,
    error,
    addInvestment,
    updateInvestment,
    deleteInvestment,
  };
};