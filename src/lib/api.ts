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

export const fetchStockPrices = async (symbols: string[]): Promise<Map<string, number>> => {
  if (symbols.length === 0) return new Map();
  try {
    const response = await axios.get<YahooFinanceResponse>(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`
    );
    const prices = new Map<string, number>();
    if (response.data.quoteResponse && response.data.quoteResponse.result) {
      response.data.quoteResponse.result.forEach(item => {
        if (item.regularMarketPrice && item.symbol) {
          prices.set(item.symbol, item.regularMarketPrice);
        }
      });
    }
    return prices;
  } catch (error) {
    console.error("Error fetching stock prices (likely CORS/rate limit):", error);
    return new Map(); // Return empty map on error
  }
};

export const fetchSingleStockPrice = async (symbol: string): Promise<number | null> => {
  if (!symbol) return null;
  try {
    const response = await axios.get<YahooFinanceResponse>(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`
    );
    if (response.data.quoteResponse && response.data.quoteResponse.result && response.data.quoteResponse.result.length > 0) {
      return response.data.quoteResponse.result[0].regularMarketPrice || null;
    }
    console.warn(`Yahoo Finance API: No data found for stock symbol ${symbol}. This is often due to CORS or rate limits.`);
    return null; // Return null if no data found
  } catch (error) {
    console.error(`Error fetching price for stock symbol ${symbol} (likely CORS/rate limit):`, error);
    return null; // Return null on error
  }
};