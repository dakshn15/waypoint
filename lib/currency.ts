import { BASE_CURRENCY, SUPPORTED_CURRENCIES } from "@/constants/config";

// Static exchange rates (relative to INR as base)
// In production, use a real API like Open Exchange Rates, Fixer.io, etc.
const EXCHANGE_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AED: 0.044,
  THB: 0.42,
  SGD: 0.016,
};

/**
 * Convert amount from one currency to another using INR as the base.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;

  const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()];
  const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()];

  if (!fromRate || !toRate) {
    console.warn(
      `[CURRENCY] Unknown currency: ${fromCurrency} or ${toCurrency}`
    );
    return amount;
  }

  // Convert to INR first, then to target currency
  const amountInINR = amount / fromRate;
  return Math.round(amountInINR * toRate * 100) / 100;
}

/**
 * Format amount with the correct currency symbol and locale.
 */
export function formatWithCurrency(
  amount: number,
  currency: string = BASE_CURRENCY
): string {
  const localeMap: Record<string, string> = {
    INR: "en-IN",
    USD: "en-US",
    EUR: "de-DE",
    GBP: "en-GB",
    AED: "ar-AE",
    THB: "th-TH",
    SGD: "en-SG",
  };

  return new Intl.NumberFormat(localeMap[currency] || "en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get the currency symbol for display.
 */
export function getCurrencySymbol(currencyCode: string): string {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
  return found?.symbol || currencyCode;
}

/**
 * Get all supported currencies with current exchange rates.
 */
export function getSupportedCurrenciesWithRates() {
  return SUPPORTED_CURRENCIES.map((c) => ({
    ...c,
    rate: EXCHANGE_RATES[c.code] || 1,
  }));
}
