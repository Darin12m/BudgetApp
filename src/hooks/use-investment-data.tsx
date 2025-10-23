import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { fetchSingleCryptoPrice, fetchStockPrice, fetchCompanyProfile, getCoingeckoId } from '@/lib/api'; // Import new API functions
import { auth } from '@/lib/firebase'; // Import auth to access currentUser

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
  // For UI animations
  previousPrice?: number; // To track price changes
}

export const useInvestmentData = (userUid: string | null) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Map<string, number>>(new Map());
  const [priceChange, setPriceChange] = useState<Map<string, 'up' | 'down' | 'none'>>(new Map());

  // Ref to store the latest investments to avoid stale closures in setInterval
  const latestInvestments = useRef<Investment[]>([]);
  useEffect(() => {
    latestInvestments.current = investments;
  }, [investments]);

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
    }, (err) => {
      console.error("Error fetching investments:", err);
      setError("Failed to load investments. Please check your internet connection and Firebase rules.");
      setLoading(false);
      toast.error("Failed to load investments.");
    });

    return () => unsubscribe(); // Clean up the listener
  }, [userUid]);

  // Fetch live prices and update investments
  const fetchAndApplyLivePrices = useCallback(async () => {
    if (!userUid || latestInvestments.current.length === 0) return;

    const newLivePrices = new Map<string, number>();
    const newPriceChange = new Map<string, 'up' | 'down' | 'none'>();
    const updates: Promise<void>[] = [];

    for (const inv of latestInvestments.current) {
      updates.push((async () => {
        let updatedPrice = inv.currentPrice;
        let priceSource: 'CoinGecko' | 'Finnhub' | undefined;
        let fetchedName: string | null | undefined = inv.companyName;

        if (inv.type === 'Stock' && inv.symbol) {
          const [priceResult, profileResult] = await Promise.all([
            fetchStockPrice(inv.symbol),
            fetchCompanyProfile(inv.symbol)
          ]);
          if (priceResult.price !== null) {
            updatedPrice = priceResult.price;
            priceSource = 'Finnhub';
          }
          if (profileResult.name !== null) {
            fetchedName = profileResult.name;
          }
        } else if (inv.type === 'Crypto' && inv.coingeckoId) {
          const result = await fetchSingleCryptoPrice(inv.coingeckoId);
          if (result.price !== null) {
            updatedPrice = result.price;
            priceSource = 'CoinGecko';
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

        // Update Firestore with the new currentPrice, companyName, lastPrice, priceSource, lastUpdated
        if (updatedPrice !== inv.currentPrice || fetchedName !== inv.companyName) {
          await updateDoc(doc(db, "investments", inv.id), {
            currentPrice: updatedPrice,
            companyName: fetchedName,
            lastPrice: updatedPrice,
            priceSource: priceSource,
            lastUpdated: new Date().toISOString(),
            updatedAt: serverTimestamp(),
          });
        }
      })());
    }

    await Promise.all(updates); // Wait for all updates to complete

    // After all Firestore updates, re-fetch from local state to ensure UI is consistent
    // This is important because onSnapshot might not trigger immediately for all updates
    setInvestments(prevInvestments => {
      return prevInvestments.map(inv => {
        const newPrice = newLivePrices.get(inv.id);
        return {
          ...inv,
          previousPrice: inv.currentPrice, // Store current price as previous for animation
          currentPrice: newPrice !== undefined ? newPrice : inv.currentPrice,
          companyName: inv.companyName, // Company name is updated directly in Firestore and will be reflected by onSnapshot
          lastPrice: newPrice !== undefined ? newPrice : inv.currentPrice,
          lastUpdated: new Date().toISOString(),
        };
      });
    });
    setLivePrices(newLivePrices);
    setPriceChange(newPriceChange);

    // Reset price change after a short delay for animation
    setTimeout(() => {
      setPriceChange(prev => {
        const resetMap = new Map(prev);
        latestInvestments.current.forEach(inv => resetMap.set(inv.id, 'none'));
        return resetMap;
      });
    }, 1000); // 1 second for animation
  }, [userUid]);

  // Initial fetch and set up auto-refresh
  useEffect(() => {
    fetchAndApplyLivePrices(); // Initial fetch

    const intervalId = setInterval(() => {
      fetchAndApplyLivePrices();
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(intervalId); // Clean up interval
  }, [fetchAndApplyLivePrices]);


  const addInvestment = useCallback(async (data: Omit<Investment, 'id' | 'ownerUid' | 'previousPrice'>) => {
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

  const updateInvestment = useCallback(async (id: string, data: Partial<Omit<Investment, 'id' | 'ownerUid' | 'previousPrice'>>) => {
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
    livePrices,
    priceChange,
  };
};