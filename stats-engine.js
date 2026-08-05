(() => {
  const MINUTES_PER_DAY = 1440;
  const REGULAR_WORK_MINUTES = 8 * 60;
  const LEAVE_NAMES = new Set(['연가', '공가', '병가', '특별휴가']);

  function durationMinutes(shift) {
    if (shift.isOff) return 0;
    const start = shift.startHour * 60 + shift.startMinute;
    const end = shift.endHour * 60 + shift.endMinute;
    return end > start ? end - start : end + MINUTES_PER_DAY - start;
  }

  function shiftInterval(date, shift) {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), shift.startHour, shift.startMinute);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), shift.endHour, shift.endMinute);
    if (end <= start) end.setDate(end.getDate() + 1);
    return { start, end };
  }

  function overlapMinutes(start, end, rangeStart, rangeEnd) {
    return Math.max(0, Math.min(end, rangeEnd) - Math.max(start, rangeStart)) / 60000;
  }

  function nightMinutesForShift(date, shift) {
    if (shift.isOff) return 0;
    const interval = shiftInterval(date, shift);
    let minutes = 0;
    for (let offset = -1; offset <= 1; offset += 1) {
      const nightStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset, 22, 0);
      const nightEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset + 1, 6, 0);
      minutes += overlapMinutes(interval.start, interval.end, nightStart, nightEnd);
    }
    return minutes;
  }

  function isNight(shift) {
    if (shift.isOff) return false;
    const start = shift.startHour * 60 + shift.startMinute;
    const end = shift.endHour * 60 + shift.endMinute;
    return shift.endHour >= 24 || end <= start || start >= 18 * 60 || end <= 8 * 60;
  }

  function isOfficialHoliday(date, holidayEngine = window.HolidayEngine) {
    return holidayEngine?.eventFor(date)?.type === 'holiday';
  }

  function isHolidayPayDate(date, holidayEngine = window.HolidayEngine) {
    return date.getDay() === 0 || date.getDay() === 6 || isOfficialHoliday(date, holidayEngine);
  }

  function coversHolidayWindow(date, shift) {
    if (shift.isOff) return false;
    const interval = shiftInterval(date, shift);
    const holidayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0);
    const holidayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 18, 0);
    return interval.start <= holidayStart && interval.end >= holidayEnd;
  }

  function isLeave(shift) {
    return shift.isOff && LEAVE_NAMES.has(shift.name);
  }

  function regularMinutesForMonth(monthDate, settings, overrides = {}, holidayEngine = window.HolidayEngine) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    let minutes = 0;
    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month, day);
      const isRegularDay = date.getDay() >= 1 && date.getDay() <= 5 && !isOfficialHoliday(date, holidayEngine);
      if (isRegularDay) minutes += REGULAR_WORK_MINUTES;
      const dateKey = window.ShiftEngine.key(date);
      if (overrides[dateKey] === undefined) continue;
      const shift = window.ShiftEngine.shiftFor(date, settings, overrides);
      const baseShift = window.ShiftEngine.shiftFor(date, settings, {});
      if (isLeave(shift) && !baseShift.isOff) minutes -= REGULAR_WORK_MINUTES;
    }
    return Math.max(0, minutes);
  }

  function payableDurationMinutes(shift, breakMinutes) {
    const duration = durationMinutes(shift);
    return Math.max(0, duration - Math.min(duration, breakMinutes));
  }

  function calculateOvertimeMinutes(workMinutes, regularMinutes, holidayWorkDays) {
    const rawMinutes = Math.max(0, workMinutes - regularMinutes - holidayWorkDays * REGULAR_WORK_MINUTES);
    return Math.floor(rawMinutes / 60) * 60;
  }

  const roundedHours = minutes => Math.round(minutes / 60 * 10) / 10;

  function monthSummary(monthDate, settings, overrides = {}, notes = {}, holidayEngine = window.HolidayEngine) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
    const shiftCounts = {};
    const breakMinutes = Math.max(0, Math.min(1440, Number(settings.allowanceBreakMinutes) || 0));
    let offDays = 0;
    let nightDays = 0;
    let workMinutes = 0;
    let allowanceWorkMinutes = 0;
    let nightWorkMinutes = 0;
    let holidayWorkDays = 0;
    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month, day);
      const shift = window.ShiftEngine.shiftFor(date, settings, overrides);
      shiftCounts[shift.name] = (shiftCounts[shift.name] || 0) + 1;
      if (shift.isOff) offDays += 1;
      if (isNight(shift)) nightDays += 1;
      workMinutes += durationMinutes(shift);
      allowanceWorkMinutes += payableDurationMinutes(shift, breakMinutes);
      nightWorkMinutes += nightMinutesForShift(date, shift);
      if (isHolidayPayDate(date, holidayEngine) && coversHolidayWindow(date, shift)) holidayWorkDays += 1;
    }
    const regularMinutes = regularMinutesForMonth(monthDate, settings, overrides, holidayEngine);
    const overtimeMinutes = calculateOvertimeMinutes(allowanceWorkMinutes, regularMinutes, holidayWorkDays);
    return {
      totalDays,
      shiftCounts,
      offDays,
      nightDays,
      workMinutes,
      workHours: roundedHours(workMinutes),
      allowanceBreakMinutes: breakMinutes,
      allowanceWorkMinutes,
      allowanceWorkHours: roundedHours(allowanceWorkMinutes),
      regularMinutes,
      regularHours: roundedHours(regularMinutes),
      overtimeMinutes,
      overtimeHours: overtimeMinutes / 60,
      nightWorkMinutes,
      nightWorkHours: roundedHours(nightWorkMinutes),
      holidayWorkDays,
      holidayDataComplete: Boolean(holidayEngine?.hasCompleteHolidayData?.(year)),
      noteCount: Object.entries(notes).filter(([dateKey, value]) => dateKey.startsWith(monthPrefix) && String(value).trim()).length,
    };
  }

  window.ShiftStats = {
    monthSummary,
    durationMinutes,
    isNight,
    nightMinutesForShift,
    isHolidayPayDate,
    coversHolidayWindow,
    regularMinutesForMonth,
    calculateOvertimeMinutes,
  };
})();
