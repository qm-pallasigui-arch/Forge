require('./register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeWeight, plateChange } = require('../src/shared/weight.ts');
test('exact dumbbell entry supports 17 kg', () => assert.equal(normalizeWeight(17), 17));
test('rounds to half kilograms and clamps both bounds', () => {
  assert.equal(normalizeWeight(17.3), 17.5);
  assert.equal(normalizeWeight(-2), 0);
  assert.equal(normalizeWeight(1200), 999);
  assert.equal(normalizeWeight(NaN), 0);
});
test('plate buttons apply a pair without negative totals', () => {
  assert.equal(plateChange(20, 1.25, false), 22.5);
  assert.equal(plateChange(20, 20, false), 60);
  assert.equal(plateChange(20, 20, true), 0);
});
