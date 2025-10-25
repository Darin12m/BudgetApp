"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BudgetSettings } from '@/hooks/use-finance-data'; // Re-use interface

export const useBudgetSettings = (userUid: string | null) => {
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [errorSettings, setErrorSettings] = useState<string | null>(null);

  useEffect(() => {
    if (!userUid) {
      setBudgetSettings(null);
      setLoadingSettings(false);
      return;
    }

    setLoadingSettings(true);
    setErrorSettings(null);

    const q = query(collection(db, 'budgetSettings'), where("ownerUid", "==", userUid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setBudgetSettings({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BudgetSettings);
      } else {
        setBudgetSettings(null); // No settings found, will be created by useFinanceData
      }
      setLoadingSettings(false);
    }, (err) => {
      console.error("Error fetching budget settings:", err);
      setErrorSettings("Failed to load budget settings.");
      setLoadingSettings(false);
    });

    return () => unsubscribe();
  }, [userUid]);

  return { budgetSettings, loadingSettings, errorSettings };
};