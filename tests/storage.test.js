const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

function loadStorage(initial = null) {
  const store = new Map(initial ? [['shiftcal-web-v1', JSON.stringify(initial)]] : []);
  const context = {
    window: {},
    localStorage: {
      getItem: key => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
    Blob: class Blob {},
    URL: { createObjectURL: () => '', revokeObjectURL: () => {} },
    document: { createElement: () => ({ click() {} }) },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('storage.js', 'utf8'), context);
  return { api: context.window.ShiftStorage, store };
}

const fresh = loadStorage().api.load();
assert.deepStrictEqual(Object.keys(fresh.notes), [], 'fresh data should contain an empty notes map');

const { api, store } = loadStorage({
  settings: { pattern: 'threeShift', anchorDate: '2026-07-29', anchorIndex: 0 },
  overrides: { '2026-07-29': 1 },
  notes: { '2026-07-29': '인수인계 확인' },
});
const loaded = api.load();
assert.strictEqual(loaded.notes['2026-07-29'], '인수인계 확인');
assert.ok(store.has('shiftcal-web-v1'));
console.log('storage memo contract: PASS');
