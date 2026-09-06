import assert from "node:assert/strict";
import test from "node:test";
import { canCancelBooking, canTransitionBooking } from "../lib/booking-rules";

test("booking lifecycle permits only declared transitions", () => {
  assert.equal(canTransitionBooking("PENDING", "CONFIRMED"), true);
  assert.equal(canTransitionBooking("CONFIRMED", "PROCESSING"), true);
  assert.equal(canTransitionBooking("PROCESSING", "COMPLETED"), true);
  assert.equal(canTransitionBooking("COMPLETED", "REFUNDED"), true);
  assert.equal(canTransitionBooking("PENDING", "COMPLETED"), false);
  assert.equal(canTransitionBooking("CANCELLED", "CONFIRMED"), false);
});

test("terminal bookings cannot be cancelled", () => {
  assert.equal(canCancelBooking("PENDING"), true);
  assert.equal(canCancelBooking("CONFIRMED"), true);
  assert.equal(canCancelBooking("COMPLETED"), false);
  assert.equal(canCancelBooking("REFUNDED"), false);
  assert.equal(canCancelBooking("CANCELLED"), false);
});
