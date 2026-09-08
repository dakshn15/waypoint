import assert from "node:assert/strict";
import test from "node:test";
import { convertCurrency, formatWithCurrency, getCurrencySymbol } from "../lib/currency";

test("convertCurrency handles same currency conversion", () => {
  assert.equal(convertCurrency(5000, "INR", "INR"), 5000);
  assert.equal(convertCurrency(100, "USD", "USD"), 100);
});

test("convertCurrency handles INR to other currencies", () => {
  const usd = convertCurrency(1000, "INR", "USD");
  assert.equal(usd, 12); // 1000 * 0.012 = 12
  const eur = convertCurrency(1000, "INR", "EUR");
  assert.equal(eur, 11); // 1000 * 0.011 = 11
});

test("convertCurrency gracefully falls back for unknown currencies", () => {
  assert.equal(convertCurrency(500, "XYZ", "INR"), 500);
});

test("getCurrencySymbol returns symbols or code", () => {
  assert.equal(getCurrencySymbol("INR"), "₹");
  assert.equal(getCurrencySymbol("USD"), "$");
  assert.equal(getCurrencySymbol("EUR"), "€");
});

test("formatWithCurrency formats properly", () => {
  const formatted = formatWithCurrency(5000, "INR");
  assert.ok(formatted.includes("5,000") || formatted.includes("5000"));
});
