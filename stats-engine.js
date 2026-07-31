(() => {
  function durationMinutes(shift) {
    if (shift.isOff) return 0;
    const start = shift.startHour * 60 + shift.startMinute;
    const end = shift.endHour * 60 + shift.endMinute;
    return end > start ? end - start : end + 1440 - start;
  }
  function isNight(shift) {
    if (shift.isOff) return false;
    const start = shift.startHour * 60 + shift.startMinute;
    const end = shift.endHour * 60 + shift.endMinute;
    return shift.endHour >= 24 || end <= start || start >= 18 * 60 || end <= 8 * 60;
  }
  function monthSummary(monthDate, settings, overrides = {}, notes = {}) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
    const shiftCounts = {};
    let offDays = 0;
    let nightDays = 0;
    let workMinutes = 0;
    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month, day);
      const shift = window.ShiftEngine.shiftFor(date, settings, overrides);
      shiftCounts[shift.name] = (shiftCounts[shift.name] || 0) + 1;
      if (shift.isOff) offDays += 1;
      if (isNight(shift)) nightDays += 1;
      workMinutes += durationMinutes(shift);
    }
    return {
      totalDays,
      shiftCounts,
      offDays,
      nightDays,
      workMinutes,
      workHours: Math.round(workMinutes / 60 * 10) / 10,
      noteCount: Object.entries(notes).filter(([dateKey, value]) => dateKey.startsWith(monthPrefix) && String(value).trim()).length,
    };
  }
  window.ShiftStats = { monthSummary, durationMinutes, isNight };
})();
