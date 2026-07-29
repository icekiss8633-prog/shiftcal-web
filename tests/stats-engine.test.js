const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('shift-engine.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('stats-engine.js', 'utf8'), context);
const E = context.window.ShiftEngine;
const stats = context.window.ShiftStats;

const settings = { pattern: 'threeShift', anchorDate: '2026-07-29', anchorIndex: 0 };
const result = stats.monthSummary(new Date(2026, 6, 1), settings, { '2026-07-30': 0 }, { '2026-07-29': '인수인계' });
assert.strictEqual(result.totalDays, 31);
assert.strictEqual(result.noteCount, 1);
assert.strictEqual(result.shiftCounts['주간'], 11);
assert.strictEqual(result.shiftCounts['야간'], 9);
assert.strictEqual(result.offDays, 11);
assert.strictEqual(result.nightDays, 9);
assert.ok(result.workHours > 0);
console.log('monthly stats contract: PASS');
