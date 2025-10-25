import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import { format } from "date-fns";

admin.initializeApp();
const db = admin.firestore();

// Define a tolerance for price changes to avoid unnecessary Firestore writes
const PRICE_CHANGE_TOLERANCE = 0.001; // e.g., $0.001
const PERCENT_CHANGE_TOLERANCE = 0.01; // e.g., 0.01%

interface Investment {
  id: string;
  name: string;
  type: 'Stock' | 'Crypto';
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  datePurchased: string;
  ownerUid: string;
  symbol?: string;
  coingeckoId?: string;
  companyName?: string | null;
  lastPrice?: number;
  priceSource?: 'CoinGecko' | 'Finnhub';
  lastUpdated?: string;
  previousPrice?: number;
  change24hPercent?: number | null;
  inputCurrencyCode: string;
}

interface CryptoPriceResponse {
  [id: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

interface FinnhubQuoteResponse {
  c: number; // Current price
  pc: number; // Previous close price
}

interface FinnhubCompanyProfileResponse {
  name: string;
}

// Cache for CoinGecko coin list to avoid repeated API calls
let coinGeckoCoinListCache: { id: string; symbol: string; name: string }[] | null = null;
let coinGeckoCoinListCacheTimestamp: number = 0;
const COINGECKO_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const fetchCoinGeckoCoinList = async () => {
  if (coinGeckoCoinListCache && (Date.now() - coinGeckoCoinListCacheTimestamp < COINGECKO_CACHE_DURATION)) {
    return coinGeckoCoinListCache;
  }
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/list`);
    coinGeckoCoinListCache = response.data;
    coinGeckoCoinListCacheTimestamp = Date.now();
    return coinGeckoCoinListCache;
  } catch (error) {
    functions.logger.error("Error fetching CoinGecko coin list:", error);
    return null;
  }
};

const getCoingeckoId = (symbolOrId: string): string => {
  const normalizedInput = symbolOrId.toLowerCase();
  // Map common crypto symbols to CoinGecko IDs (this map should ideally be in a shared utility or fetched)
  const cryptoSymbolMap: { [key: string]: string } = {
    'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', /* ... other mappings */
  };
  if (cryptoSymbolMap[symbolOrId.toUpperCase()]) {
    return cryptoSymbolMap[symbolOrId.toUpperCase()];
  }
  return normalizedInput;
};

// Scheduled function to fetch and update investment prices
export const updateInvestmentPrices = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  functions.logger.info("Running scheduled investment price update!");

  const finnhubApiKey = functions.config().finnhub?.key;
  if (!finnhubApiKey) {
    functions.logger.error("Finnhub API key not configured. Skipping stock price updates.");
  }

  try {
    const investmentsSnapshot = await db.collection('investments').get();
    const investments = investmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Investment[];

    const updates: Promise<any>[] = [];

    for (const inv of investments) {
      updates.push((async () => {
        let updatedPrice = inv.currentPrice;
        let priceSource: 'CoinGecko' | 'Finnhub' | null = null;
        let fetchedName: string | null = inv.companyName || null;
        let change24hPercent: number | null = inv.change24hPercent || null;

        if (inv.type === 'Stock' && inv.symbol && finnhubApiKey) {
          try {
            const [priceResponse, profileResponse] = await Promise.all([
              axios.get<FinnhubQuoteResponse>(`https://finnhub.io/api/v1/quote?symbol=${inv.symbol.toUpperCase()}&token=${finnhubApiKey}`),
              axios.get<FinnhubCompanyProfileResponse>(`https://finnhub.io/api/v1/stock/profile2?symbol=${inv.symbol.toUpperCase()}&token=${finnhubApiKey}`)
            ]);

            if (priceResponse.data && priceResponse.data.c > 0) {
              updatedPrice = priceResponse.data.c;
              priceSource = 'Finnhub';
              if (priceResponse.data.pc !== null && priceResponse.data.pc > 0) {
                change24hPercent = ((updatedPrice - priceResponse.data.pc) / priceResponse.data.pc) * 100;
              }
            }
            if (profileResponse.data && profileResponse.data.name) {
              fetchedName = profileResponse.data.name;
            }
          } catch (stockError) {
            functions.logger.warn(`Failed to fetch stock price/profile for ${inv.symbol}:`, stockError);
          }
        } else if (inv.type === 'Crypto' && inv.coingeckoId) {
          try {
            const coingeckoId = getCoingeckoId(inv.coingeckoId);
            const response = await axios.get<CryptoPriceResponse>(
              `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true`
            );
            if (response.data[coingeckoId] && response.data[coingeckoId].usd) {
              updatedPrice = response.data[coingeckoId].usd;
              priceSource = 'CoinGecko';
              change24hPercent = response.data[coingeckoId].usd_24h_change || null;

              const coinList = await fetchCoinGeckoCoinList();
              if (coinList) {
                const coin = coinList.find((c: any) => c.id === coingeckoId || c.symbol.toLowerCase() === inv.coingeckoId?.toLowerCase());
                if (coin) {
                  fetchedName = coin.name;
                }
              }
            }
          } catch (cryptoError) {
            functions.logger.warn(`Failed to fetch crypto price for ${inv.coingeckoId}:`, cryptoError);
          }
        }

        // Only update Firestore if there's a material change
        const priceChangedSignificantly = Math.abs(updatedPrice - inv.currentPrice) > PRICE_CHANGE_TOLERANCE;
        const percentChangedSignificantly = change24hPercent !== null && inv.change24hPercent !== null &&
                                            Math.abs(change24hPercent - inv.change24hPercent) > PERCENT_CHANGE_TOLERANCE;
        const nameChanged = fetchedName !== inv.companyName;

        if (priceChangedSignificantly || percentChangedSignificantly || nameChanged) {
          const updatePayload: { [key: string]: any } = {
            currentPrice: updatedPrice,
            lastPrice: updatedPrice,
            lastUpdated: new Date().toISOString(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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

          functions.logger.info(`Updating investment ${inv.id}: ${inv.name} - Price: ${inv.currentPrice} -> ${updatedPrice}`);
          return db.collection('investments').doc(inv.id).update(updatePayload);
        } else {
          functions.logger.info(`No material change for investment ${inv.id}: ${inv.name}. Skipping update.`);
          return Promise.resolve(); // Resolve immediately if no update needed
        }
      })());
    }

    await Promise.all(updates);
    functions.logger.info("Investment price update completed.");
  } catch (error) {
    functions.logger.error("Error updating investment prices:", error);
  }
});

// Scheduled function to save daily portfolio snapshot
export const saveDailyPortfolioSnapshot = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  functions.logger.info("Running scheduled daily portfolio snapshot!");

  try {
    const usersSnapshot = await db.collection('users').get(); // Assuming a 'users' collection exists
    const users = usersSnapshot.docs.map(doc => doc.id);

    for (const userUid of users) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const existingSnapshot = await db.collection('portfolioSnapshots')
        .where('ownerUid', '==', userUid)
        .where('date', '==', today)
        .limit(1)
        .get();

      if (existingSnapshot.empty) {
        const investmentsSnapshot = await db.collection('investments')
          .where('ownerUid', '==', userUid)
          .get();
        const investments = investmentsSnapshot.docs.map(doc => doc.data()) as Investment[];

        const totalPortfolioValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);

        await db.collection('portfolioSnapshots').add({
          ownerUid: userUid,
          date: today,
          value: totalPortfolioValue,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info(`Portfolio snapshot saved for user ${userUid} on ${today}. Value: ${totalPortfolioValue}`);
      } else {
        functions.logger.info(`Portfolio snapshot already exists for user ${userUid} on ${today}. Skipping.`);
      }
    }
    functions.logger.info("Daily portfolio snapshot completed for all users.");
  } catch (error) {
    functions.logger.error("Error saving daily portfolio snapshot:", error);
  }
});