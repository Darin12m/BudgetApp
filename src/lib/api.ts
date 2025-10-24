import axios from 'axios';

// Finnhub API Key provided by the user
const FINNHUB_API_KEY = 'd3tb37pr01qigeg2akvgd3tb37pr01qeg2al00'; 

interface CryptoPriceResponse {
  [id: string]: {
    usd: number;
    usd_24h_change?: number; // Added 24h change
  };
}

interface FinnhubQuoteResponse {
  c: number; // Current price
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

interface FinnhubCompanyProfileResponse {
  country: string;
  currency: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  weburl: string;
  // ... other fields
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
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'AVAX': 'avalanche',
  'MATIC': 'polygon',
  'ICP': 'internet-computer',
  'ATOM': 'cosmos',
  'ETC': 'ethereum-classic',
  'XLM': 'stellar',
  'VET': 'vechain',
  'FIL': 'filecoin',
  'TRX': 'tron',
  'EOS': 'eos',
  'XTZ': 'tezos',
  'AAVE': 'aave',
  'MKR': 'maker',
  'DAI': 'dai',
  'COMP': 'compound',
  'SNX': 'synthetix-network-token',
  'GRT': 'the-graph',
  'ENJ': 'enjincoin',
  'MANA': 'decentraland',
  'SAND': 'the-sandbox',
  'AXS': 'axie-infinity',
  'CHZ': 'chiliz',
  'FTM': 'fantom',
  'NEAR': 'near-protocol',
  'ALGO': 'algorand',
  'EGLD': 'elrond',
  'THETA': 'theta-token',
  'KSM': 'kusama',
  'ZEC': 'zcash',
  'DASH': 'dash',
  'NEO': 'neo',
  'IOTA': 'iota',
  'QTUM': 'qtum',
  'OMG': 'omisego',
  'BAT': 'basic-attention-token',
  'ZRX': '0x',
  'KNC': 'kyber-network-crystal',
  'REN': 'ren',
  'OCEAN': 'ocean-protocol',
  'BAND': 'band-protocol',
  'RLC': 'iExec-RLC',
  'CELO': 'celo',
  'HBAR': 'hedera-hashgraph',
  'ONE': 'harmony',
  'ICX': 'icon',
  'RVN': 'ravencoin',
  'WAVES': 'waves',
  'ONT': 'ontology',
  'NANO': 'nano',
  'DCR': 'decred',
  'SC': 'siacoin',
  'AR': 'arweave',
  'FLOW': 'flow',
  'KLAY': 'klaytn',
  'ROSE': 'oasis-network',
  'MINA': 'mina-protocol',
  'IMX': 'immutable-x',
  'APE': 'apecoin',
  'GMT': 'stepn',
  'APT': 'aptos',
  'OP': 'optimism',
  'ARB': 'arbitrum',
  'SUI': 'sui',
  'SEI': 'sei',
  'TIA': 'celestia',
  'PYTH': 'pyth-network',
  'JUP': 'jupiter',
  'WIF': 'dogwifhat',
  'BONK': 'bonk',
  'PEPE': 'pepe',
  'SHIB': 'shiba-inu',
  'DOG': 'dog-go-to-the-moon',
  'FLOKI': 'floki',
  'BOME': 'book-of-meme',
  'WLD': 'worldcoin',
  'STRK': 'starknet',
  'DYM': 'dymension',
  'ENA': 'ena',
  'ONDO': 'ondo-finance',
  'CORE': 'coredaoorg',
  'FET': 'fetch-ai',
  'AGIX': 'singularitynet',
  'RNDR': 'render-token',
  'RUNE': 'thorchain',
  'KAS': 'kaspa',
  'TAO': 'bittensor',
  'AKT': 'akash-network',
  'OSMO': 'osmosis',
  'JTO': 'jito',
  'ALT': 'altlayer',
  'MANTA': 'manta-network',
  'PIXEL': 'pixels',
  'AEVO': 'aevo',
  'W': 'wormhole',
  'TNSR': 'tensor',
  'REZ': 'etherfi',
  'NOT': 'notcoin',
  'ZK': 'polyhedra-network',
  'IO': 'io-net',
  'ZRO': 'layerzero',
  'LISTA': 'lista-dao',
  'WEN': 'wen-token',
  'BTT': 'bittorrent',
  'HOT': 'holo',
  'ARDR': 'ardor',
  'DGB': 'digibyte',
  'NEXO': 'nexo',
  'CEL': 'celsius-network',
  'KAVA': 'kava',
  'ZIL': 'zilliqa',
  'IOST': 'iostoken',
  'WTC': 'waltonchain',
  'GAS': 'gas',
  'WAN': 'wanchain',
  'LSK': 'lisk',
  'STEEM': 'steem',
  'SNT': 'status',
  'MCO': 'mco',
  'KMD': 'komodo',
  'DGD': 'digixdao',
  'REP': 'augur',
  'GNT': 'golem',
  'PPT': 'populous',
  'BNT': 'bancor',
  'FUN': 'funfair',
  'REQ': 'request-network',
  'RDN': 'raiden-network-token',
  'VIB': 'viberate',
  'POWR': 'power-ledger',
  'ENG': 'enigma',
  'SUB': 'substratum',
  'EDG': 'edgeless',
  'CVC': 'civic',
  'PAY': 'tenx',
  'STORJ': 'storj',
  'FCT': 'factom',
  'MAID': 'maidsafecoin',
  'GAME': 'gamecredits',
  'SYS': 'syscoin',
  'EMC': 'emercoin',
  'NXT': 'nxt',
  'EXP': 'expanse',
  'CLOAK': 'cloakcoin',
  'GRS': 'groestlcoin',
  'VIA': 'viacoin',
  'DMD': 'diamond',
  'BURST': 'burst',
  'FLO': 'florincoin',
  'RDD': 'reddcoin',
  'POT': 'potcoin',
  'BLK': 'blackcoin',
  'NMC': 'namecoin',
  'PPC': 'peercoin',
  'FTC': 'feathercoin',
  'AUR': 'auroracoin',
  'GRC': 'gridcoin',
  'DGC': 'digitalcoin',
  'QRK': 'quark',
  'MEC': 'megacoin',
  'GLD': 'goldcoin',
  'SRC': 'securecoin',
  'FRC': 'freicoin',
  'NVC': 'novacoin',
  'TRC': 'terracoin',
  'WDC': 'worldcoin',
  'TAG': 'tagcoin',
  'ANC': 'anoncoin',
  'ARG': 'argentum',
  'BTCD': 'bitcoin-dark',
  'CANN': 'cannabiscoin',
  'CLAM': 'clams',
  'DOGEC': 'dogecoin-dark',
  'EFL': 'e-gulden',
  'EMC2': 'einsteinium',
  'FLAP': 'flappycoin',
  'FRK': 'franko',
  'GCR': 'global-currency-reserve',
  'HUC': 'huntercoin',
  'IOC': 'iocoin',
  'KORE': 'korecoin',
  'MAX': 'maxcoin',
  'MINT': 'mintcoin',
  'MONA': 'monacoin',
  'MYR': 'myriadcoin',
  'NAV': 'nav-coin',
  'NLG': 'gulden',
  'NSR': 'nushares',
  'OK': 'okcash',
  'PINK': 'pinkcoin',
  'PIVX': 'pivx',
  'POSW': 'posw-coin',
  'PRC': 'prospercoin',
  'QBC': 'quark-coin',
  'RIC': 'riccoin',
  'SLR': 'solarcoin',
  'SPR': 'spreadcoin',
  'START': 'startcoin',
  'STRAT': 'stratis',
  'SWIFT': 'swiftcash',
  'SYNC': 'sync-fab',
  'BTG': 'bitcoin-gold',
  'BCH': 'bitcoin-cash',
  'BSV': 'bitcoin-sv',
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

export const fetchSingleCryptoPrice = async (symbolOrId: string): Promise<{ price: number | null; name: string | null; change24hPercent: number | null; error: string | null }> => {
  if (!symbolOrId) return { price: null, name: null, change24hPercent: null, error: "Symbol or ID is required." };

  const coingeckoId = getCoingeckoId(symbolOrId);

  try {
    const response = await axios.get<CryptoPriceResponse>(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true` // Request 24h change
    );
    
    if (response.data[coingeckoId] && response.data[coingeckoId].usd) {
      let cryptoName: string | null = null;
      try {
        const coinListResponse = await axios.get(`https://api.coingecko.com/api/v3/coins/list`);
        const coin = coinListResponse.data.find((c: any) => c.id === coingeckoId || c.symbol.toLowerCase() === symbolOrId.toLowerCase());
        if (coin) {
          cryptoName = coin.name;
        }
      } catch (listError) {
        console.warn("Could not fetch crypto name from coin list:", listError);
      }

      return {
        price: response.data[coingeckoId].usd,
        name: cryptoName || coingeckoId,
        change24hPercent: response.data[coingeckoId].usd_24h_change || null, // Return 24h change
        error: null
      };
    } else {
      return { price: null, name: null, change24hPercent: null, error: "Invalid crypto symbol or price unavailable." };
    }
  } catch (error: any) {
    console.error(`Error fetching price for crypto ${symbolOrId}:`, error);
    return { price: null, name: null, change24hPercent: null, error: "Failed to fetch crypto price. Please try again." };
  }
};

export const fetchStockPrice = async (symbol: string): Promise<{ price: number | null; previousClose: number | null; error: string | null }> => {
  if (!symbol || !FINNHUB_API_KEY) return { price: null, previousClose: null, error: "Symbol and API key are required." };

  const upperSymbol = symbol.toUpperCase();
  try {
    const response = await axios.get<FinnhubQuoteResponse>(
      `https://finnhub.io/api/v1/quote?symbol=${upperSymbol}&token=${FINNHUB_API_KEY}`
    );
    
    if (response.data && response.data.c > 0) {
      return { price: response.data.c, previousClose: response.data.pc, error: null }; // Return previous close
    } else {
      return { price: null, previousClose: null, error: "Invalid stock ticker or price unavailable." };
    }
  } catch (error: any) {
    console.error(`Error fetching stock price for ${upperSymbol}:`, error);
    return { price: null, previousClose: null, error: "Failed to fetch stock price. Please try again." };
  }
};

export const fetchCompanyProfile = async (symbol: string): Promise<{ name: string | null; error: string | null }> => {
  if (!symbol || !FINNHUB_API_KEY) return { name: null, error: "Symbol and API key are required." };

  const upperSymbol = symbol.toUpperCase();
  try {
    const response = await axios.get<FinnhubCompanyProfileResponse>(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${upperSymbol}&token=${FINNHUB_API_KEY}`
    );
    
    if (response.data && response.data.name) {
      return { name: response.data.name, error: null };
    } else {
      return { name: null, error: "Company name not found for this ticker." };
    }
  } catch (error: any) {
    console.error(`Error fetching company profile for ${upperSymbol}:`, error);
    return { name: null, error: "Failed to fetch company profile." };
  }
};