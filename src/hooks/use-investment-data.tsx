import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { fetchSingleCryptoPrice, fetchStockPrice, fetchCompanyProfile, getCoingeckoId } from '@/lib/api';
import { useBudgetSettings } from './use-budget-settings'; // Import the new lightweight hook
import { format, isSameDay, parseISO, startOfDay, endOfDay } from 'date-fns';

// TypeScript Interfaces
export interface Investment {
  id: string;
  name: string;
  type: 'Stock' | 'Crypto';
  quantity: number;
  buyPrice: number; // Stored in USD
  currentPrice: number; // This will be updated by live data, stored in USD
  datePurchased: string; // YYYY-MM-DD
  ownerUid: string;
  symbol?: string; // For stocks (e.g., AAPL)
  coingeckoId?: string; // For crypto (e.g., bitcoin)
  companyName?: string | null; // New: For stocks, fetched from Finnhub
  lastPrice?: number; // The last fetched live price, stored in USD
  priceSource?: 'CoinGecko' | 'Finnhub'; // Source of the last price
  lastUpdated?: string; // Timestamp of last price update
  previousPrice?: number; // To track price changes for UI animations, stored in USD
  change24hPercent?: number | null; // New: 24-hour percentage change
  inputCurrencyCode: string; // New: Currency code used when the buyPrice was input
}

interface PortfolioSnapshot {
  id: string;
  date: string; // YYYY-MM-DD
  value: number; // Stored in USD
  ownerUid: string;
  createdAt: any; // Firebase Timestamp
}

export const useInvestmentData = (userUid: string | null, startDate: Date | undefined, endDate: Date | undefined) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [portfolioSnapshots, setPortfolioSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [priceChange, setPriceChange] = useState<Map<string, 'up' | 'down' | 'none'>>(new Map());
  const [alertedInvestments, setAlertedInvestments] = useState<Map<string, boolean>>(new Map()); // New state for alerts

  const { budgetSettings } = useBudgetSettings(userUid); // Use the new lightweight hook

  // Ref to store the latest investments to avoid stale closures in setInterval
  const latestInvestments = useRef<Investment[]>([]);
  useEffect(() => {
    latestInvestments.current = investments;
  }, [investments]);

  // New ref to track if default investments have been attempted to be created
  const hasCreatedDefaultInvestments = useRef(false);

  // Fetch investments from Firestore
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
      
      // Determine price changes for UI animation based on previous state
      setInvestments(prevInvestments => {
        const newPriceChange = new Map<string, 'up' | 'down' | 'none'>();
        const newAlertedInvestments = new Map<string, boolean>();
        const priceAlertThreshold = budgetSettings?.priceAlertThreshold || 5;

        const updatedInvestments = fetchedInvestments.map(newInv => {
          const oldInv = prevInvestments.find(p => p.id === newInv.id);
          
          if (oldInv && newInv.currentPrice !== oldInv.currentPrice) {
            if (newInv.currentPrice > oldInv.currentPrice) {
              newPriceChange.set(newInv.id, 'up');
            } else if (newInv.currentPrice < oldInv.currentPrice) {
              newPriceChange.set(newInv.id, 'down');
            }
          } else {
            newPriceChange.set(newInv.id, 'none');
          }

          // Check for price alerts
          if (newInv.change24hPercent !== null && Math.abs(newInv.change24hPercent || 0) >= priceAlertThreshold) {
            newAlertedInvestments.set(newInv.id, true);
          } else {
            newAlertedInvestments.set(newInv.id, false);
          }

          return { ...newInv, previousPrice: oldInv?.currentPrice }; // Store old price for animation
        });

        setPriceChange(newPriceChange);
        setAlertedInvestments(newAlertedInvestments);

        // Reset price change animation after a short delay
        setTimeout(() => {
          setPriceChange(prev => {
            const resetMap = new Map(prev);
            updatedInvestments.forEach(inv => resetMap.set(inv.id, 'none'));
            return resetMap;
          });
        }, 1000); // 1 second for animation

        return updatedInvestments;
      });

      setLoading(false);

      // If no investments exist for the user, add some default ones
      if (snapshot.empty && !hasCreatedDefaultInvestments.current) {
        hasCreatedDefaultInvestments.current = true; // Mark immediately to prevent re-entry
        const defaultInvestments = [
          {
            name: 'Apple Inc.',
            type: 'Stock',
            quantity: 5,
            buyPrice: 150.00, // Stored in USD
            currentPrice: 170.00, // Placeholder, will be updated by live fetch, stored in USD
            datePurchased: format(new Date(), 'yyyy-MM-dd'),
            symbol: 'AAPL',
            companyName: 'Apple Inc.',
            priceSource: 'Finnhub',
            lastPrice: 170.00, // Stored in USD
            lastUpdated: new Date().toISOString(),
            ownerUid: userUid,
            inputCurrencyCode: 'USD', // Default to USD
            createdAt: serverTimestamp(),
          },
          {
            name: 'Bitcoin',
            type: 'Crypto',
            quantity: 0.05,
            buyPrice: 30000.00, // Stored in USD
            currentPrice: 60000.00, // Placeholder, will be updated by live fetch, stored in USD
            datePurchased: format(new Date(), 'yyyy-MM-dd'),
            coingeckoId: 'bitcoin',
            priceSource: 'CoinGecko',
            lastPrice: 60000.00, // Stored in USD
            lastUpdated: new Date().toISOString(),
            ownerUid: userUid,
            inputCurrencyCode: 'USD', // Default to USD
            createdAt: serverTimestamp(),
          },
        ];

        defaultInvestments.forEach(async (inv) => {
          const sanitizedInv = { ...inv };
          Object.keys(sanitizedInv).forEach(key => {
            if (sanitizedInv[key] === undefined) {
              delete sanitizedInv[key];
            }
          });
          try {
            await addDoc(collection(db, "investments"), sanitizedInv);
          } catch (e) {
            console.error("Error adding default investment:", e);
            toast.error("Failed to add default investment data.");
            hasCreatedDefaultInvestments.current = false; // Reset if creation failed
          }
        });
      }
    }, (err) => {
      console.error("Error fetching investments:", err);
      setError("Failed to load investments. Please check your internet connection and Firebase rules.");
      setLoading(false);
      toast.error("Failed to load investments.");
    });

    return () => unsubscribe(); // Clean up the listener
  }, [userUid, budgetSettings]); // Depend on budgetSettings for alert threshold

  // Fetch portfolio snapshots from Firestore, filtered by date range
  useEffect(() => {
    if (!userUid) return;

    let q = query(collection(db, "portfolioSnapshots"), where("ownerUid", "==", userUid));

    if (startDate && endDate) {
      const formattedStartDate = format(startOfDay(startDate), 'yyyy-MM-dd');
      const formattedEndDate = format(endOfDay(endDate), 'yyyy-MM-dd');
      q = query(q, where("date", ">=", formattedStartDate), where("date", "<=", formattedEndDate));
    }

    q = query(q, orderBy("date", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSnapshots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PortfolioSnapshot[];
      setPortfolioSnapshots(fetchedSnapshots);
    }, (err) => {
      // Enhanced error logging for portfolio snapshots
      console.error("Error fetching portfolio snapshots:", err.code, err.message, err);
      toast.error(`Failed to load portfolio growth data. Error: ${err.code} - ${err.message}`);
    });

    return () => unsubscribe();
  }, [userUid, startDate, endDate]); // Add startDate and endDate to dependencies

  // --- REMOVED CLIENT-SIDE PRICE POLLING ---
  // The client will now rely on the Firestore listener for 'investments'
  // which will be updated by the Cloud Function.
  // The `priceChange` and `alertedInvestments` states are now updated directly
  // within the `onSnapshot` callback for `investments`.

  const addInvestment = useCallback(async (data: Omit<Investment, 'id' | 'ownerUid' | 'previousPrice' | 'change24hPercent'>) => {
    if (!userUid) {
      toast.error("You must be logged in to save data.");
      return;
    }

    const payload: any = { // Use 'any' to allow dynamic deletion of properties
      ...data,
      ownerUid: userUid,
      createdAt: serverTimestamp(),
    };

    // Remove any undefined fields from the payload
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    try {
      await addDoc(collection(db, "investments"), payload);
      toast.success("Investment added successfully!");
    } catch (e: any) {
      console.error("Error adding investment:", e.code, e.message);
      toast.error(`Failed to add investment: ${e.message}`);
    }
  }, [userUid]);

  const updateInvestment = useCallback(async (id: string, data: Partial<Omit<Investment, 'id' | 'ownerUid' | 'previousPrice' | 'change24hPercent'>>) => {
    if (!userUid) {
      toast.error("Authentication required to update data.");
      return;
    }

    const sanitizedData = { ...data };
    Object.keys(sanitizedData).forEach(key => {
      if (sanitizedData[key] === undefined) {
        delete sanitizedData[key];
      }
    });

    try {
      await updateDoc(doc(db, "investments", id), {
        ...sanitizedData,
        updatedAt: serverTimestamp(),
      });
      toast.success("Investment updated successfully!");
    } catch (e: any) {
      console.error("Error updating investment:", e.code, e.message);
      toast.error(`Failed to update investment: ${e.message}`);
    }
  }, [userUid]);

  const deleteInvestment = useCallback(async (id: string) => {
    if (!userUid) {
      toast.error("Authentication required to delete investment.");
      return;
    }
    // Removed the native confirm() call here, as the UI component (InvestmentForm) now handles it.
    try {
      await deleteDoc(doc(db, "investments", id));
      toast.success("Investment deleted successfully!");
    } catch (e) {
      console.error("Error deleting investment:", e);
      toast.error("Failed to delete investment.");
    }
  }, [userUid]);

  return {
    investments,
    portfolioSnapshots,
    loading,
    error,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    priceChange,
    alertedInvestments, // Return alerted investments
  };
};