"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { onSnapshot, collection, query, limit, where } from 'firebase/firestore'; // Added 'where'

export type SyncStatus = 'synced' | 'offline' | 'syncing' | 'error';

export const useFirestoreStatus = (userUid: string | null) => {
  const [status, setStatus] = useState<SyncStatus>('syncing');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userUid) {
      setStatus('offline'); // No user, effectively offline for data sync
      setLastSyncTime(null);
      setError(null);
      return;
    }

    setStatus('syncing');
    setError(null);

    // Use a lightweight query to monitor connection status
    // We'll listen to a small part of the user's data, e.g., budget settings
    const q = query(collection(db, 'budgetSettings'), limit(1), where("ownerUid", "==", userUid));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        // If we get a snapshot, it means we're connected and data is flowing
        setStatus('synced');
        setLastSyncTime(new Date());
        setError(null);
      },
      (err) => {
        // If there's an error, it usually indicates an offline state or permission issue
        console.error("Firestore connection error:", err);
        setStatus('error');
        setError(err.message);
      },
      () => {
        // This callback is for when the listener is detached, which might indicate offline
        setStatus('offline');
        setError("Firestore listener detached, possibly offline.");
      }
    );

    // Add a listener for network changes to potentially update status
    const handleOnline = () => {
      // When online, try to re-sync
      setStatus('syncing');
    };
    const handleOffline = () => {
      setStatus('offline');
      setError("Network is offline.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userUid]);

  return { status, lastSyncTime, error };
};