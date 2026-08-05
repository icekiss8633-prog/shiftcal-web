const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

function loadStorage(initial = null, DateImpl = Date) {
  const store = new Map(initial ? [['shiftcal-web-v1', JSON.stringify(initial)]] : []);
  const alerts = [];
  class FileReader {
    readAsText(file) {
      this.result = file.contents;
      this.onload();
    }
  }
  const context = {
    window: {},
    Date: DateImpl,
    localStorage: {
      getItem: key => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
    Blob: class Blob {},
    URL: { createObjectURL: () => '', revokeObjectURL: () => {} },
    document: { createElement: () => ({ click() {} }) },
    FileReader,
    alert: message => alerts.push(message),
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('storage.js', 'utf8'), context);
  return { api: context.window.ShiftStorage, store, alerts };
}

const fresh = loadStorage().api.load();
assert.deepStrictEqual(Object.keys(fresh.notes), [], 'fresh data should contain an empty notes map');
assert.strictEqual(fresh.settings.allowanceBreakMinutes, 0);
assert.deepStrictEqual(Object.keys(fresh.settings.shiftTimeOverrides), []);
assert.strictEqual(fresh.settings.calendarMode, 'month');

class KoreaMorningDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : ['2026-07-30T15:30:00.000Z']));
    this.isFixedNow = args.length === 0;
  }
  getFullYear() { return this.isFixedNow ? 2026 : super.getFullYear(); }
  getMonth() { return this.isFixedNow ? 6 : super.getMonth(); }
  getDate() { return this.isFixedNow ? 31 : super.getDate(); }
}
assert.strictEqual(loadStorage(null, KoreaMorningDate).api.load().settings.anchorDate, '2026-07-31');

const { api, store } = loadStorage({
  settings: { pattern: 'threeShift', anchorDate: '2026-07-29', anchorIndex: 0 },
  overrides: {
    '2026-07-29': 1,
    '2026-07-30': { name: '<img src=x onerror=alert(1)>', color: 'red" onclick="alert(1)', startHour: 9, startMinute: 0, endHour: 18, endMinute: 0, isOff: false, custom: true },
  },
  notes: { '2026-07-29': '인수인계 확인' },
});
const loaded = api.load();
assert.strictEqual(loaded.notes['2026-07-29'], '인수인계 확인');
assert.ok(loaded.overrides['2026-07-30'].name.length <= 20);
assert.strictEqual(loaded.overrides['2026-07-30'].color, '#607D8B');
assert.strictEqual(loaded.settings.allowanceBreakMinutes, 0, 'legacy backups should get the safe default');
assert.ok(store.has('shiftcal-web-v1'));

const allowanceSettings = loadStorage({
  settings: {
    pattern: 'threeShift',
    anchorDate: '2026-07-29',
    anchorIndex: 0,
    allowanceBreakMinutes: 90,
    calendarMode: 'week',
    shiftTimeOverrides: {
      threeShift: {
        '야간': { startHour: 16, startMinute: 0, endHour: 2, endMinute: 0 },
        '잘못된 근무': { startHour: 99, startMinute: 0, endHour: 2, endMinute: 0 },
      },
      unknownPattern: { '근무': { startHour: 9, startMinute: 0, endHour: 18, endMinute: 0 } },
    },
  },
});
assert.strictEqual(allowanceSettings.api.load().settings.allowanceBreakMinutes, 90);
assert.strictEqual(allowanceSettings.api.load().settings.calendarMode, 'week');
assert.strictEqual(allowanceSettings.api.load().settings.shiftTimeOverrides.threeShift['야간'].endHour, 2);
assert.strictEqual(allowanceSettings.api.load().settings.shiftTimeOverrides.threeShift['잘못된 근무'], undefined);
assert.strictEqual(allowanceSettings.api.load().settings.shiftTimeOverrides.unknownPattern, undefined);

const invalid = loadStorage({
  settings: { pattern: 'not-a-pattern', anchorDate: '2026-07-29', anchorIndex: 0, calendarMode: 'timeline' },
});
assert.strictEqual(invalid.api.load().settings.pattern, 'threeShift');
assert.strictEqual(invalid.api.load().settings.calendarMode, 'month');
let imported = false;
invalid.api.importData({ contents: JSON.stringify({ settings: { pattern: 'not-a-pattern' } }) }, () => { imported = true; });
assert.strictEqual(imported, false);
assert.strictEqual(invalid.alerts.length, 1);
console.log('storage memo contract: PASS');
