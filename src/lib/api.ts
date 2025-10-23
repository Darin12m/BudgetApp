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

export const fetchStockPrices = async (symbols: string[]): Promise<Map<string, number>> => {
  if (symbols.length === 0) return new Map();
  try {
    // Note: Direct access to Yahoo Finance API might be rate-limited or require a proxy in production.
    // For this example, we'll use a direct call.
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
    console.error("Error fetching stock prices:", error);
    return new Map();
  }
};