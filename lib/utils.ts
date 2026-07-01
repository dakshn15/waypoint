import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
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

  if (Array.isArray(data)) {
    return data.map(serializePrisma);
  }

  if (data instanceof Date) {
    return data;
  }

  if (typeof data === "object") {
    if (
      data.constructor &&
      (data.constructor.name === "Decimal" || typeof (data as any).toNumber === "function")
    ) {
      return (data as any).toNumber();
    }

    const serialized: any = {};
    for (const key of Object.keys(data)) {
      serialized[key] = serializePrisma((data as any)[key]);
    }
    return serialized;
  }

  return data;
}

