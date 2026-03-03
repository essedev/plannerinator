"use server";

/**
 * CoinGecko Integration
 *
 * Server-side crypto price fetching with in-memory cache (5 min TTL).
 * Uses CoinGecko's free API (no key required, rate limit: ~10-30 req/min).
 */

const COINGECKO_API = "https://api.coingecko.com/api/v3";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedPrice {
  prices: Record<string, number>;
  fetchedAt: number;
}

// Module-level in-memory cache (persists across requests in the same process)
let priceCache: CachedPrice | null = null;

/**
 * Common crypto symbol → CoinGecko ID mapping.
 * Extend as needed.
 */
const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  ADA: "cardano",
  DOT: "polkadot",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  LINK: "chainlink",
  UNI: "uniswap",
  ATOM: "cosmos",
  XRP: "ripple",
  DOGE: "dogecoin",
  LTC: "litecoin",
  NEAR: "near",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
  FTM: "fantom",
  ALGO: "algorand",
  XLM: "stellar",
  AAVE: "aave",
  MKR: "maker",
  CRV: "curve-dao-token",
  SNX: "havven",
  COMP: "compound-governance-token",
  SUI: "sui",
  SEI: "sei-network",
  TIA: "celestia",
  INJ: "injective-protocol",
  RNDR: "render-token",
  FET: "fetch-ai",
  PEPE: "pepe",
  SHIB: "shiba-inu",
  USDT: "tether",
  USDC: "usd-coin",
  DAI: "dai",
};

/**
 * Resolve a crypto symbol to a CoinGecko ID.
 * Falls back to lowercase symbol if not in the mapping.
 */
function resolveId(symbol: string): string {
  return SYMBOL_TO_ID[symbol.toUpperCase()] ?? symbol.toLowerCase();
}

/**
 * Fetch current EUR prices for a list of crypto symbols.
 * Results are cached for 5 minutes.
 *
 * @returns Record<symbol, price_in_EUR>
 */
export async function getCryptoPrices(symbols: string[]): Promise<Record<string, number>> {
  if (symbols.length === 0) return {};

  // Check cache freshness
  if (priceCache && Date.now() - priceCache.fetchedAt < CACHE_TTL_MS) {
    // Return cached prices for requested symbols if all present
    const allCached = symbols.every((s) => s.toUpperCase() in priceCache!.prices);
    if (allCached) {
      const result: Record<string, number> = {};
      for (const s of symbols) {
        result[s.toUpperCase()] = priceCache.prices[s.toUpperCase()] ?? 0;
      }
      return result;
    }
  }

  // Build CoinGecko query
  const ids = symbols.map(resolveId);
  const uniqueIds = [...new Set(ids)];

  try {
    const url = `${COINGECKO_API}/simple/price?ids=${uniqueIds.join(",")}&vs_currencies=eur`;
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Next.js fetch cache: 5 min
    });

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      return priceCache?.prices ?? {};
    }

    const data: Record<string, { eur?: number }> = await response.json();

    // Build symbol → price map
    const prices: Record<string, number> = {};
    for (const symbol of symbols) {
      const id = resolveId(symbol);
      const price = data[id]?.eur;
      if (price !== undefined) {
        prices[symbol.toUpperCase()] = price;
      }
    }

    // Update cache with all fetched prices (merge with existing)
    priceCache = {
      prices: { ...(priceCache?.prices ?? {}), ...prices },
      fetchedAt: Date.now(),
    };

    return prices;
  } catch (error) {
    console.error("CoinGecko fetch failed:", error);
    // Return stale cache on network error
    return priceCache?.prices ?? {};
  }
}

/**
 * Get a single crypto price in EUR.
 */
export async function getCryptoPrice(symbol: string): Promise<number | null> {
  const prices = await getCryptoPrices([symbol]);
  return prices[symbol.toUpperCase()] ?? null;
}
