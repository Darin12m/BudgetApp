import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { fetchCryptoPrices, fetchStockPrices } from '@/lib/api'; // Import API functions
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
  lastPrice?: number; // The last fetched live price
  priceSource?: 'CoinGecko' | 'YahooFinance'; // Source of the last price
  lastUpdated?: string; // Timestamp of last price update
  // For UI animations
  previousPrice?: number; // To track price changes
}

export const useInvestmentData = (userUid: string | null) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [livePrices, setLivePrices] = new Map();
  const [priceChange, setPriceChange] = new Map();

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
        let priceSource: 'CoinGecko' | 'YahooFinance' | undefined;

        if (inv.type === 'Stock' && inv.symbol) {
          identifier = inv.symbol;
          if (stockPrices.has(inv.symbol)) {
            updatedPrice = stockPrices.get(inv.symbol)!;
            priceSource = 'YahooFinance';
          }
        } else if (inv.type === 'Crypto' && inv.coingeckoId) {
          identifier = inv.coingeckoId;
          if (cryptoPrices.has(inv.coingeckoId)) {
            updatedPrice = cryptoPrices.get(inv.coingeckoId)!;
            priceSource = 'CoinGecko';
          }
          // If crypto ID is not found, try to resolve from symbol map
          if (!cryptoPrices.has(inv.coingeckoId) && inv.coingeckoId) {
            const resolvedId = inv.coingeckoId; // Assuming coingeckoId is already the ID or symbol
            if (cryptoPrices.has(resolvedId)) {
              updatedPrice = cryptoPrices.get(resolvedId)!;
              priceSource = 'CoinGecko';
            }
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
          lastPrice: updatedPrice, // Update lastPrice with the fetched price
          priceSource: priceSource,
          lastUpdated: new Date().toISOString(), // Update lastUpdated timestamp
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
    console.log("Attempting to add investment...");
    console.log("auth.currentUser:", auth.currentUser);
    console.log("auth.currentUser.uid:", auth.currentUser?.uid);

    if (!userUid) {
      toast.error("You must be logged in to save data.");
      return;
    }

    const payload = {
      ...data,
      ownerUid: userUid, // This line ensures ownerUid is set
      createdAt: serverTimestamp(),
    };
    console.log("Payload being sent:", payload);

    try {
      await addDoc(collection(db, "investments"), payload);
      toast.success("Investment added successfully!");
    } catch (e: any) { // Explicitly type 'e' as 'any' for error.code
      console.error("Error adding investment:", e.code, e.message); // Log error.code
      toast.error(`Failed to add investment: ${e.message}`); // Display specific error message
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