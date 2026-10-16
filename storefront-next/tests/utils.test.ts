import test from "node:test";
import assert from "node:assert/strict";
import { formatPrice, safeInteger } from "../lib/utils";

test("formatPrice formats Nigerian naira without decimal noise", () => {
  assert.match(formatPrice(18500), /18,500/);
  assert.match(formatPrice(0), /0/);
});

test("safeInteger accepts non-negative safe integers", () => {
  assert.equal(safeInteger("12", 3), 12);
  assert.equal(safeInteger("0", 7), 0);
});

test("safeInteger rejects unsafe or malformed input", () => {
  assert.equal(safeInteger(undefined, 4), 4);
  assert.equal(safeInteger("-1", 4), 4);
  assert.equal(safeInteger("1.5", 4), 4);
  assert.equal(safeInteger("not-a-number", 4), 4);
  assert.equal(safeInteger("9007199254740992", 4), 4);
});