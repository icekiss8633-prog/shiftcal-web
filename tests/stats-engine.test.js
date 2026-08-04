const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('shift-engine.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('holiday-engine.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('stats-engine.js', 'utf8'), context);
const E = context.window.ShiftEngine;
const stats = context.window.ShiftStats;

const settings = { pattern: 'threeShift', anchorDate: '2026-07-29', anchorIndex: 0, allowanceBreakMinutes: 30 };
const result = stats.monthSummary(new Date(2026, 6, 1), settings, { '2026-07-30': 0 }, { '2026-07-29': '인수인계', '2026-08-01': '다음 달 메모' });
assert.strictEqual(result.totalDays, 31);
assert.strictEqual(result.noteCount, 1);
assert.strictEqual(result.shiftCounts['주간'], 11);
assert.strictEqual(result.shiftCounts['야간'], 9);
assert.strictEqual(result.offDays, 11);
assert.strictEqual(result.nightDays, 9);
assert.ok(result.workHours > 0);
assert.strictEqual(result.regularHours, 176);
assert.strictEqual(result.allowanceWorkMinutes, result.workMinutes - (result.totalDays - result.offDays) * 30);
assert.ok(result.nightWorkHours > 0);
assert.ok(result.holidayWorkDays >= 0);
assert.ok(result.overtimeHours >= 0);

const overnight = { name: '야간', startHour: 20, startMinute: 0, endHour: 8, endMinute: 0, isOff: false };
const fullHoliday = { name: '휴일근무', startHour: 9, startMinute: 0, endHour: 18, endMinute: 0, isOff: false };
const partialHoliday = { ...fullHoliday, endHour: 17 };
assert.strictEqual(stats.nightMinutesForShift(new Date(2026, 6, 4), overnight), 8 * 60);
assert.strictEqual(stats.isHolidayPayDate(new Date(2026, 6, 4)), true);
assert.strictEqual(stats.coversHolidayWindow(new Date(2026, 6, 4), fullHoliday), true);
assert.strictEqual(stats.coversHolidayWindow(new Date(2026, 6, 4), partialHoliday), false);
assert.strictEqual(stats.calculateOvertimeMinutes(200 * 60, 160 * 60, 1), 32 * 60);
const leaveSettings = { pattern: 'threeShift', anchorDate: '2026-07-04', anchorIndex: 0, allowanceBreakMinutes: 0 };
const annualLeave = { name: '연가', startHour: 0, startMinute: 0, endHour: 0, endMinute: 0, isOff: true };
assert.strictEqual(stats.regularMinutesForMonth(new Date(2026, 6, 1), leaveSettings, { '2026-07-04': annualLeave }), 168 * 60);
console.log('monthly stats contract: PASS');
