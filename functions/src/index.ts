import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import * as cors from "cors";

admin.initializeApp();

const corsHandler = cors({ origin: true });

export const getStockPrice = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method Not Allowed", message: "Only GET requests are supported." });
    }

    const symbol = req.query.symbol as string;

    if (!symbol) {
      return res.status(400).json({ error: "Bad Request", message: "Stock symbol is required." });
    }

    const YAHOO_FINANCE_URL = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol.toUpperCase()}`;

    try {
      const response = await axios.get(YAHOO_FINANCE_URL);
      const result = response.data?.quoteResponse?.result?.[0];

      if (!result || !result.regularMarketPrice) {
        functions.logger.warn(`No data or price found for symbol: ${symbol}`);
        return res.status(404).json({ error: "Not Found", message: "Invalid stock ticker symbol. Please try again." });
      }

      const price = result.regularMarketPrice;
      const currency = result.currency || "USD"; // Default to USD if not provided

      return res.status(200).json({ symbol: symbol.toUpperCase(), price, currency });
    } catch (error: any) {
      functions.logger.error(`Error fetching stock price for ${symbol}:`, error.message, error.response?.data);
      return res.status(500).json({ error: "Internal Server Error", message: "Failed to fetch stock price. Please try again later." });
    }
  });
});