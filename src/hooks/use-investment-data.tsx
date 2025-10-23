import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { fetchCryptoPrices, fetchStockPrices } from '@/lib/api'; // Import API functions

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

    const stockSymbols = latestInvestments.current
      .filter(inv => inv.type === 'Stock' && inv.symbol)
      .map(inv => inv.symbol!);
    const cryptoIds = latestInvestments.current
      .filter(inv => inv.type === 'Crypto' && inv.coingeckoId)
      .map(inv => inv.coingeckoId!);

    const [stockPrices, cryptoPrices] = await Promise.all([
      fetchStockPrices(stockSymbols),
      fetchCryptoPrices(cryptoIds),
    ]);

    const newLivePrices = new Map<string, number>();
    const newPriceChange = new Map<string, 'up' | 'down' | 'none'>();

    setInvestments(prevInvestments => {
      return prevInvestments.map(inv => {
        let updatedPrice = inv.currentPrice;
        let identifier = '';

        if (inv.type === 'Stock' && inv.symbol) {
          identifier = inv.symbol;
          if (stockPrices.has(inv.symbol)) {
            updatedPrice = stockPrices.get(inv.symbol)!;
          }
        } else if (inv.type === 'Crypto' && inv.coingeckoId) {
          identifier = inv.coingeckoId;
          if (cryptoPrices.has(inv.coingeckoId)) {
            updatedPrice = cryptoPrices.get(inv.coingeckoId)!;
          }
        }

        if (identifier) {
          newLivePrices.set(identifier, updatedPrice);
          if (updatedPrice > inv.currentPrice) {
            newPriceChange.set(inv.id, 'up');
          } else if (updatedPrice < inv.currentPrice) {
            newPriceChange.set(inv.id, 'down');
          } else {
            newPriceChange.set(inv.id, 'none');
          }
        }

        return {
          ...inv,
          previousPrice: inv.currentPrice, // Store current price as previous for animation
          currentPrice: updatedPrice,
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