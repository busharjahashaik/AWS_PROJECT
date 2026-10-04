import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDistanceKm } from '../src/services/geo.js';

test('distance is zero for identical coordinates', () => {
  assert.equal(calculateDistanceKm(16.3067, 80.4365, 16.3067, 80.4365), 0);
});

test('distance uses the Haversine formula and Earth radius in kilometers', () => {
  const distance = calculateDistanceKm(0, 0, 0, 1);
  assert.ok(Math.abs(distance - 111.195) < 0.01);
});

test('distance is symmetric', () => {
  assert.equal(
    calculateDistanceKm(16.3067, 80.4365, 17.4126, 78.4071),
    calculateDistanceKm(17.4126, 78.4071, 16.3067, 80.4365)
  );
});
