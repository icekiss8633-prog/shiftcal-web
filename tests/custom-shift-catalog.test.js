const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const store = new Map();
const context = {
  window: {},
  localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) },
  Blob: class Blob {}, URL: { createObjectURL: () => '', revokeObjectURL: () => {} }, document: { createElement: () => ({ click() {} }) },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('storage.js', 'utf8'), context);
const api = context.window.ShiftStorage;
const fresh = api.load();
assert.strictEqual(fresh.customShifts.length, 0);
const saved = { ...fresh, customShifts: [{ id: 'volunteer', name: '자원근무', color: '#E67E22', startHour: 9, startMinute: 0, endHour: 18, endMinute: 0, isOff: false }] };
api.save(saved);
assert.strictEqual(api.load().customShifts[0].name, '자원근무');
const legacy = api.load();
delete legacy.customShifts;
api.save(legacy);
assert.strictEqual(api.load().customShifts.length, 0);
console.log('custom shift catalog contract: PASS');
