import assert from "node:assert/strict";
import test from "node:test";
import { canCancelBooking, canTransitionBooking } from "../lib/booking-rules";

test("booking lifecycle permits only declared transitions", () => {
  // PENDING transitions
  assert.equal(canTransitionBooking("PENDING", "CONFIRMED"), true);
  assert.equal(canTransitionBooking("PENDING", "CANCELLED"), true);
  assert.equal(canTransitionBooking("PENDING", "COMPLETED"), false);

  // CONFIRMED transitions
  assert.equal(canTransitionBooking("CONFIRMED", "PROCESSING"), true);
  assert.equal(canTransitionBooking("CONFIRMED", "COMPLETED"), true);
  assert.equal(canTransitionBooking("CONFIRMED", "PENDING"), true);
  assert.equal(canTransitionBooking("CONFIRMED", "CANCELLED"), true);
  assert.equal(canTransitionBooking("CONFIRMED", "REFUNDED"), true);

  // PROCESSING transitions (can return to CONFIRMED)
  assert.equal(canTransitionBooking("PROCESSING", "CONFIRMED"), true);
  assert.equal(canTransitionBooking("PROCESSING", "COMPLETED"), true);
  assert.equal(canTransitionBooking("PROCESSING", "CANCELLED"), true);
  assert.equal(canTransitionBooking("PROCESSING", "REFUNDED"), true);

  // COMPLETED transitions
  assert.equal(canTransitionBooking("COMPLETED", "CONFIRMED"), true);
  assert.equal(canTransitionBooking("COMPLETED", "PROCESSING"), true);
  assert.equal(canTransitionBooking("COMPLETED", "REFUNDED"), true);
  assert.equal(canTransitionBooking("COMPLETED", "CANCELLED"), false);

  // CANCELLED transitions (can reactivate to CONFIRMED or PENDING, or REFUNDED)
  assert.equal(canTransitionBooking("CANCELLED", "CONFIRMED"), true);
  assert.equal(canTransitionBooking("CANCELLED", "PENDING"), true);
  assert.equal(canTransitionBooking("CANCELLED", "REFUNDED"), true);
  assert.equal(canTransitionBooking("CANCELLED", "COMPLETED"), false);

  // REFUNDED is terminal
  assert.equal(canTransitionBooking("REFUNDED", "CONFIRMED"), false);
  assert.equal(canTransitionBooking("REFUNDED", "CANCELLED"), false);
});

test("cancellation rules", () => {
  assert.equal(canCancelBooking("PENDING"), true);
  assert.equal(canCancelBooking("CONFIRMED"), true);
  assert.equal(canCancelBooking("PROCESSING"), true);
  assert.equal(canCancelBooking("COMPLETED"), false);
  assert.equal(canCancelBooking("REFUNDED"), false);
  assert.equal(canCancelBooking("CANCELLED"), false);
});
