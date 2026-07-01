export const ROLES = {
  TRAVELER: "TRAVELER",
  AGENCY: "AGENCY",
  STAFF: "STAFF",
  ADMIN: "ADMIN",
} as const;

export type Role = keyof typeof ROLES;

export const SUPPORTED_CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
] as const;

export const BASE_CURRENCY = "INR";

export const TRAVEL_STYLES = [
  { value: "BUDGET", label: "Budget", icon: "Wallet" },
  { value: "STANDARD", label: "Standard", icon: "Hotel" },
  { value: "PREMIUM", label: "Premium", icon: "Star" },
  { value: "LUXURY", label: "Luxury", icon: "Crown" },
] as const;

export const INTERESTS = [
  "Adventure", "Nature", "Beaches", "Mountains", "Food",
  "Nightlife", "Photography", "Wildlife", "Culture",
  "Shopping", "Historical Places",
] as const;

export const STAY_PREFERENCES = ["Hostel", "Hotel", "Resort", "Villa"] as const;
export const TRANSPORT_PREFERENCES = ["Flight", "Train", "Bus", "Self Drive"] as const;
