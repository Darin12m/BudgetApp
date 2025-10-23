import axios from 'axios';

interface CryptoPriceResponse {
  [id: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

interface YahooFinanceQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChangePercent?: number;
}

interface YahooFinanceResponse {
  quoteResponse: {
    result: YahooFinanceQuote[];
    error: any;
  };
}

// Map common crypto symbols to CoinGecko IDs
const cryptoSymbolMap: { [key: string]: string } = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'INJ': 'injective-protocol',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'BNB': 'binancecoin',
  'DOT': 'polkadot',
  'LTC': 'litecoin',
  // Add more as needed
};

export const getCoingeckoId = (symbolOrId: string): string => {
  const normalizedInput = symbolOrId.toLowerCase();
  // Check if it's a common symbol first
  if (cryptoSymbolMap[symbolOrId.toUpperCase()]) {
    return cryptoSymbolMap[symbolOrId.toUpperCase()];
  }
  // Otherwise, assume it's already a CoinGecko ID
  return normalizedInput;
};


export const fetchCryptoPrices = async (ids: string[]): Promise<Map<string, number>> => {
  if (ids.length === 0) return new Map();
  try {
    const response = await axios.get<CryptoPriceResponse>(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`
    );
    const prices = new Map<string, number>();
    for (const id of ids) {
      if (response.data[id] && response.data[id].usd) {
        prices.set(id, response.data[id].usd);
      }
    }
    return prices;
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    return new Map();
  }
};

export const fetchSingleCryptoPrice = async (coingeckoId: string): Promise<number | null> => {
  if (!coingeckoId) return null;
  try {
    const response = await axios.get<CryptoPriceResponse>(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`
    );
    return response.data[coingeckoId]?.usd || null;
  } catch (error) {
    console.error(`Error fetching price for crypto ID ${coingeckoId}:`, error);
    return null;
  }
};

// Firebase Cloud Function endpoint for stock prices
const FIREBASE_STOCK_FUNCTION_URL = "https://us-central1-YOUR_FIREBASE_PROJECT_ID.cloudfunctions.net/getStockPrice";

export const fetchStockPrices = async (symbols: string[]): Promise<Map<string, number>> => {
  if (symbols.length === 0) return new Map();
  const prices = new Map<string, number>();
  
  // Fetch prices for each symbol individually using the Cloud Function
  await Promise.all(symbols.map(async (symbol) => {
    try {
      const response = await axios.get(`${FIREBASE_STOCK_FUNCTION_URL}?symbol=${symbol.toUpperCase()}`);
      if (response.data && response.data.price) {
        prices.set(symbol.toUpperCase(), response.data.price);
      }
    } catch (error) {
      console.error(`Error fetching stock price for ${symbol} via Cloud Function:`, error);
    }
  }));
  return prices;
};

export const fetchSingleStockPrice = async (symbol: string): Promise<number | null> => {
  if (!symbol) return null;
  try {
    const response = await axios.get(`${FIREBASE_STOCK_FUNCTION_URL}?symbol=${symbol.toUpperCase()}`);
    if (response.data && response.data.price) {
      return response.data.price;
    }
    console.warn(`Cloud Function: No price data found for stock symbol ${symbol}.`);
    return null;
  } catch (error) {
    console.error(`Error fetching single stock price for ${symbol} via Cloud Function:`, error);
    return null;
  }
};