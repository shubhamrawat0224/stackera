const { parseTick } = require('../src/binanceListener');
const assert = require('assert');

// Mock updatePrice as it's used in binanceListener.js
// Wait, parseTick doesn't use updatePrice, it's a pure function now.

console.log('Running tests for parseTick...');

// 1. Test with tick.E (correct field)
const tickWithE = {
  s: 'BTCUSDT',
  c: '50000.00',
  P: '1.5',
  h: '51000.00',
  l: '49000.00',
  v: '1000.0',
  E: 1711929600000 // 2024-04-01T00:00:00.000Z
};

const resultWithE = parseTick(tickWithE);
assert.strictEqual(resultWithE.symbol, 'BTCUSDT');
assert.strictEqual(resultWithE.timestamp, '2024-04-01T00:00:00.000Z');
console.log('✅ Correctly parses tick with "E" field');

// 2. Test with missing E (fallback to Date.now())
const tickWithoutE = {
  s: 'ETHUSDT',
  c: '3000.00',
  P: '-0.5',
  h: '3100.00',
  l: '2900.00',
  v: '500.0'
};

const resultWithoutE = parseTick(tickWithoutE);
assert.strictEqual(resultWithoutE.symbol, 'ETHUSDT');
assert.ok(!isNaN(new Date(resultWithoutE.timestamp).getTime()));
console.log('✅ Correctly handles tick with missing "E" field (falls back to now)');

// 3. Test that it doesn't throw "Invalid time value" even if E is missing
try {
  parseTick({ s: 'BNBUSDT', c: '600', P: '0', h: '610', l: '590', v: '100' });
  console.log('✅ Does not throw RangeError for missing time field');
} catch (e) {
  console.error('❌ Threw error:', e.message);
  process.exit(1);
}

console.log('All tests passed!');
