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

  window.ShiftWebUtils = { escapeHTML, safeColor, moveMonth, findPresetKey, snapshotOverrides };
})();
