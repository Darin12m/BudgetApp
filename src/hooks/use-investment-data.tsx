import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { fetchSingleCryptoPrice, fetchStockPrice, fetchCompanyProfile, getCoingeckoId } from '@/lib/api';
import { useFinanceData } from './use-finance-data'; // Import useFinanceData to get budgetSettings
import { format, isSameDay, parseISO, startOfDay, endOfDay } from 'date-fns';

// TypeScript Interfaces
export interface Investment {
  id: string;
  name: string;
  type: 'Stock' | 'Crypto';
  quantity: number;
  buyPrice: number;
  currentPrice: number; // This will be updated by live data
  datePurchased: string; // YYYY-MM-DD
  ownerUid: string;
  symbol?: string; // For stocks (e.g., AAPL)
  coingeckoId?: string; // For crypto (e.g., bitcoin)
  companyName?: string | null; // New: For stocks, fetched from Finnhub
  lastPrice?: number; // The last fetched live price
  priceSource?: 'CoinGecko' | 'Finnhub'; // Source of the last price
  lastUpdated?: string; // Timestamp of last price update
  previousPrice?: number; // To track price changes for UI animations
  change24hPercent?: number | null; // New: 24-hour percentage change
}

interface PortfolioSnapshot {
  id: string;
  date: string; // YYYY-MM-DD
  value: number;
  ownerUid: string;
  createdAt: any; // Firebase Timestamp
}

export const useInvestmentData = (userUid: string | null, startDate: Date | undefined, endDate: Date | undefined) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [portfolioSnapshots, setPortfolioSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Map<string, number>>(new Map());
  const [priceChange, setPriceChange] = useState<Map<string, 'up' | 'down' | 'none'>>(new Map());
  const [alertedInvestments, setAlertedInvestments] = useState<Map<string, boolean>>(new Map()); // New state for alerts

  const { budgetSettings } = useFinanceData(userUid, startDate, endDate); // Get budget settings for alert threshold

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
      setInvestments(fetchedInvestments);
      setLoading(false);

      // If no investments exist for the user, add some default ones
      if (snapshot.empty && !hasCreatedDefaultInvestments.current) {
        hasCreatedDefaultInvestments.current = true; // Mark immediately to prevent re-entry
        const defaultInvestments = [
          {
            name: 'Apple Inc.',
            type: 'Stock',
            quantity: 5,
            buyPrice: 150.00,
            currentPrice: 170.00, // Placeholder, will be updated by live fetch
            datePurchased: format(new Date(), 'yyyy-MM-dd'),
            symbol: 'AAPL',
            companyName: 'Apple Inc.',
            priceSource: 'Finnhub',
            lastPrice: 170.00,
            lastUpdated: new Date().toISOString(),
            ownerUid: userUid,
            createdAt: serverTimestamp(),
          },
          {
            name: 'Bitcoin',
            type: 'Crypto',
            quantity: 0.05,
            buyPrice: 30000.00,
            currentPrice: 60000.00, // Placeholder, will be updated by live fetch
            datePurchased: format(new Date(), 'yyyy-MM-dd'),
            coingeckoId: 'bitcoin',
            priceSource: 'CoinGecko',
            lastPrice: 60000.00,
            lastUpdated: new Date().toISOString(),
            ownerUid: userUid,
            createdAt: serverTimestamp(),
          },
        ];

        defaultInvestments.forEach(async (inv) => {
          try {
            await addDoc(collection(db, "investments"), inv);
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
  }, [userUid]);

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

  // Fetch live prices and update investments
  const fetchAndApplyLivePrices = useCallback(async () => {
    if (!userUid || latestInvestments.current.length === 0) return;

    const newLivePrices = new Map<string, number>();
    const newPriceChange = new Map<string, 'up' | 'down' | 'none'>();
    const newAlertedInvestments = new Map<string, boolean>();
    const updates: Promise<void>[] = [];

    const priceAlertThreshold = budgetSettings.priceAlertThreshold || 5; // Default to 5%

    for (const inv of latestInvestments.current) {
      updates.push((async () => {
        let updatedPrice = inv.currentPrice;
        let priceSource: 'CoinGecko' | 'Finnhub' | null = null; // Initialize as null
        let fetchedName: string | null = inv.companyName || null; // Initialize as null
        let change24hPercent: number | null = null;

        if (inv.type === 'Stock' && inv.symbol) {
          const [priceResult, profileResult] = await Promise.all([
            fetchStockPrice(inv.symbol),
            fetchCompanyProfile(inv.symbol)
          ]);
          if (priceResult.price !== null) {
            updatedPrice = priceResult.price;
            priceSource = 'Finnhub';
            if (priceResult.previousClose !== null && priceResult.previousClose > 0) {
              change24hPercent = ((updatedPrice - priceResult.previousClose) / priceResult.previousClose) * 100;
            }
          }
          if (profileResult.name !== null) {
            fetchedName = profileResult.name;
          }
        } else if (inv.type === 'Crypto' && inv.coingeckoId) {
          const result = await fetchSingleCryptoPrice(inv.coingeckoId);
          if (result.price !== null) {
            updatedPrice = result.price;
            priceSource = 'CoinGecko';
            change24hPercent = result.change24hPercent;
          }
          if (result.name !== null) {
            fetchedName = result.name;
          }
        }

        if (updatedPrice !== inv.currentPrice) {
          if (updatedPrice > inv.currentPrice) {
            newPriceChange.set(inv.id, 'up');
          } else if (updatedPrice < inv.currentPrice) {
            newPriceChange.set(inv.id, 'down');
          }
        } else {
          newPriceChange.set(inv.id, 'none');
        }
        
        newLivePrices.set(inv.id, updatedPrice);

        // Check for price alerts
        if (change24hPercent !== null && Math.abs(change24hPercent) >= priceAlertThreshold) {
          newAlertedInvestments.set(inv.id, true);
        } else {
          newAlertedInvestments.set(inv.id, false);
        }

        // Build update payload, only including defined values
        const updatePayload: { [key: string]: any } = {
          currentPrice: updatedPrice,
          lastPrice: updatedPrice,
          lastUpdated: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        };

        if (fetchedName !== null) {
          updatePayload.companyName = fetchedName;
        }
        if (priceSource !== null) {
          updatePayload.priceSource = priceSource;
        }
        if (change24hPercent !== null) {
          updatePayload.change24hPercent = change24hPercent;
        }

        // Only update if there's a change in relevant fields
        if (updatedPrice !== inv.currentPrice || fetchedName !== inv.companyName || change24hPercent !== inv.change24hPercent) {
          await updateDoc(doc(db, "investments", inv.id), updatePayload);
        }
      })());
    }

    await Promise.all(updates); // Wait for all updates to complete

    // After all Firestore updates, re-fetch from local state to ensure UI is consistent
    setInvestments(prevInvestments => {
      return prevInvestments.map(inv => {
        const newPrice = newLivePrices.get(inv.id);
        const alerted = newAlertedInvestments.get(inv.id);
        return {
          ...inv,
          previousPrice: inv.currentPrice, // Store current price as previous for animation
          currentPrice: newPrice !== undefined ? newPrice : inv.currentPrice,
          companyName: inv.companyName, // Company name is updated directly in Firestore and will be reflected by onSnapshot
          lastPrice: newPrice !== undefined ? newPrice : inv.currentPrice,
          lastUpdated: new Date().toISOString(),
          // change24hPercent is updated via onSnapshot
          isAlerted: alerted, // Add alert status to investment object for easier access
        };
      });
    });
    setLivePrices(newLivePrices);
    setPriceChange(newPriceChange);
    setAlertedInvestments(newAlertedInvestments);

    // Reset price change animation after a short delay
    setTimeout(() => {
      setPriceChange(prev => {
        const resetMap = new Map(prev);
        latestInvestments.current.forEach(inv => resetMap.set(inv.id, 'none'));
        return resetMap;
      });
    }, 1000); // 1 second for animation
  }, [userUid, budgetSettings.priceAlertThreshold]);

  // Initial fetch and set up auto-refresh
  useEffect(() => {
    fetchAndApplyLivePrices(); // Initial fetch

    const intervalId = setInterval(() => {
      fetchAndApplyLivePrices();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId); // Clean up interval
  }, [fetchAndApplyLivePrices]);

  // Effect to save portfolio snapshot daily
  useEffect(() => {
    if (!userUid || investments.length === 0) return;

    const saveSnapshot = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const lastSnapshot = portfolioSnapshots.length > 0 ? portfolioSnapshots[portfolioSnapshots.length - 1] : null;

      if (!lastSnapshot || !isSameDay(parseISO(lastSnapshot.date), new Date())) {
        const totalPortfolioValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);

        try {
          await addDoc(collection(db, "portfolioSnapshots"), {
            ownerUid: userUid,
            date: today,
            value: totalPortfolioValue,
            createdAt: serverTimestamp(),
          });
          console.log("Portfolio snapshot saved for", today);
        } catch (e) {
          console.error("Error saving portfolio snapshot:", e);
          toast.error("Failed to save portfolio snapshot.");
        }
      }
    };

    // Debounce snapshot saving to avoid multiple calls on rapid page loads/updates
    const timeoutId = setTimeout(saveSnapshot, 2000); // Wait 2 seconds after investments load

    return () => clearTimeout(timeoutId);
  }, [userUid, investments, portfolioSnapshots]);


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
    portfolioSnapshots,
    loading,
    error,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    livePrices,
    priceChange,
    alertedInvestments, // Return alerted investments
  };
};