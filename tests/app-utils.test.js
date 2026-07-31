const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('shift-engine.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('app-utils.js', 'utf8'), context);

const E = context.window.ShiftEngine;
const U = context.window.ShiftWebUtils;
const july = new Date(2026, 6, 31);
const august = U.moveMonth(july, 1);
const september = U.moveMonth(august, 1);
assert.strictEqual(E.key(august), '2026-08-01');
assert.strictEqual(E.key(september), '2026-09-01');
assert.strictEqual(E.key(U.moveMonth(new Date(2026, 2, 31), -1)), '2026-02-01');

assert.strictEqual(U.escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
assert.strictEqual(U.safeColor('#4A90D9'), '#4A90D9');
assert.strictEqual(U.safeColor('red" onmouseover="alert(1)'), '#607D8B');

const presets = {
  annual: { name: '연가', color: '#16A085', startHour: 0, startMinute: 0, endHour: 0, endMinute: 0, isOff: true },
};
assert.strictEqual(U.findPresetKey({ ...presets.annual, custom: true }, presets), 'annual');

const settings = { pattern: 'threeShift', anchorDate: '2026-07-29', anchorIndex: 0 };
const objectOverride = { name: '교육', color: '#607D8B', startHour: 9, startMinute: 0, endHour: 18, endMinute: 0, isOff: false, custom: true };
const snapshots = U.snapshotOverrides({ '2026-07-29': 1, '2026-07-30': objectOverride }, settings, E);
assert.strictEqual(snapshots['2026-07-29'].name, '야간');
assert.deepStrictEqual(snapshots['2026-07-30'], objectOverride);
console.log('app utility contracts: PASS');
