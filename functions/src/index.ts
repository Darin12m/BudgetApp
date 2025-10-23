import * as functions from "firebase-functions";

export const getStockPrice = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const symbol = (req.query.symbol as string | undefined)?.toUpperCase();
  if (!symbol) {
    res.status(400).json({ error: "Missing ?symbol=AAPL" });
    return;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
    const response = await fetch(url);
    const data = (await response.json()) as any;
    const result = data?.quoteResponse?.result?.[0];

    if (!result || result.regularMarketPrice == null) {
      res.status(404).json({ error: "Invalid ticker or price unavailable" });
      return;
    }

    res.json({
      symbol: result.symbol,
      price: result.regularMarketPrice,
      currency: result.currency,
      ts: Date.now(),
    });
  } catch (e: any) {
    console.error("getStockPrice error:", e?.message || e);
    res.status(500).json({ error: "Failed to fetch stock price" });
  }
});