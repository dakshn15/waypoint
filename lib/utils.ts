import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "INR") {
  const code = (currency || "INR").toUpperCase();
  const localeMap: Record<string, string> = {
    USD: "en-US",
    EUR: "en-IE",
    GBP: "en-GB",
    INR: "en-IN",
    AED: "en-AE",
    THB: "th-TH",
    SGD: "en-SG",
  };
  const locale = localeMap[code] || "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString()}`;
  }
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function serializePrisma<T>(data: T): any {
  if (data === null || data === undefined) {
    return data;
  }
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === "bigint") {
        return Number(value);
      }
      if (
        value &&
        typeof value === "object" &&
        (value.constructor?.name === "Decimal" ||
          typeof value.toNumber === "function" ||
          value._isDecimal ||
          value.isDecimal ||
          String(value.constructor?.name || "").toLowerCase().includes("decimal") ||
          (value.s !== undefined && value.e !== undefined && (value.c !== undefined || value.d !== undefined)))
      ) {
        return Number(value);
      }
      return value;
    })
  );
}

