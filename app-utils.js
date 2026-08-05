(() => {
  const htmlEntities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => htmlEntities[character]);

  function safeColor(value, fallback = '#607D8B') {
    const color = String(value || '');
    return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
  }

  function moveMonth(date, offset) {
    return new Date(date.getFullYear(), date.getMonth() + offset, 1);
  }

  function addDays(date, offset) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
  }

  function startOfWeek(date) {
    return addDays(date, -date.getDay());
  }

  function periodTitle(date, mode = 'month') {
    if (mode !== 'week') return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
    const start = startOfWeek(date);
    const end = addDays(start, 6);
    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.getFullYear()}.${start.getMonth() + 1}.${start.getDate()}–${end.getFullYear()}.${end.getMonth() + 1}.${end.getDate()}`;
    }
    if (start.getMonth() !== end.getMonth()) {
      return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일–${end.getMonth() + 1}월 ${end.getDate()}일`;
    }
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}–${end.getDate()}일`;
  }

  function findPresetKey(shift, presets) {
    if (!shift || typeof shift !== 'object') return null;
    const fields = ['name', 'color', 'startHour', 'startMinute', 'endHour', 'endMinute', 'isOff'];
    return Object.entries(presets).find(([, preset]) => fields.every(field => shift[field] === preset[field]))?.[0] || null;
  }

  function snapshotOverrides(overrides, settings, engine) {
    return Object.fromEntries(Object.entries(overrides || {}).map(([dateKey, override]) => {
      if (!Number.isInteger(override)) return [dateKey, override];
      const shift = engine.shiftFor(engine.fromKey(dateKey), settings, { [dateKey]: override });
      return [dateKey, {
        name: shift.name,
        color: safeColor(shift.color),
        startHour: shift.startHour,
        startMinute: shift.startMinute,
        endHour: shift.endHour,
        endMinute: shift.endMinute,
        isOff: Boolean(shift.isOff),
        custom: false,
      }];
    }));
  }

  window.ShiftWebUtils = { escapeHTML, safeColor, moveMonth, addDays, startOfWeek, periodTitle, findPresetKey, snapshotOverrides };
})();
