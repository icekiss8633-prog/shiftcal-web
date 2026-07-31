(() => {
  const STORAGE_KEY = 'shiftcal-web-v1';
  const PATTERN_KEYS = new Set([
    'fiveDutyFiveOff', 'threeShift', 'fourTeam', 'fourTeamThreeShift', 'alternateDay',
    'twoTwo', 'pitman', 'twentyFourFortyEight', 'fiveTwo',
  ]);
  const pad = number => String(number).padStart(2, '0');
  const dateKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const safeColor = value => window.ShiftWebUtils?.safeColor(value) || (/^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : '#607D8B');

  function isDateKey(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  const defaults = () => ({
    settings: { pattern: 'threeShift', anchorDate: dateKey(new Date()), anchorIndex: 0 },
    overrides: {},
    notes: {},
    customShifts: [],
  });

  function normalizeShift(value) {
    if (!isObject(value) || typeof value.name !== 'string' || !value.name.trim()) return null;
    const integers = ['startHour', 'startMinute', 'endHour', 'endMinute'].map(field => Number(value[field]));
    const [startHour, startMinute, endHour, endMinute] = integers;
    if (!Number.isInteger(startHour) || startHour < 0 || startHour > 23) return null;
    if (!Number.isInteger(startMinute) || startMinute < 0 || startMinute > 59) return null;
    if (!Number.isInteger(endHour) || endHour < 0 || endHour > 24) return null;
    if (!Number.isInteger(endMinute) || endMinute < 0 || endMinute > 59 || (endHour === 24 && endMinute !== 0)) return null;
    const shift = {
      name: value.name.trim().slice(0, 20),
      color: safeColor(value.color),
      startHour,
      startMinute,
      endHour,
      endMinute,
      isOff: Boolean(value.isOff),
      custom: Boolean(value.custom),
    };
    if (typeof value.id === 'string' && value.id.trim()) shift.id = value.id.trim().slice(0, 100);
    return shift;
  }

  function normalize(data) {
    const base = defaults();
    const source = isObject(data) ? data : {};
    const rawSettings = isObject(source.settings) ? source.settings : {};
    const anchorIndex = Number(rawSettings.anchorIndex);
    const settings = {
      pattern: PATTERN_KEYS.has(rawSettings.pattern) ? rawSettings.pattern : base.settings.pattern,
      anchorDate: isDateKey(rawSettings.anchorDate) ? rawSettings.anchorDate : base.settings.anchorDate,
      anchorIndex: Number.isInteger(anchorIndex) && anchorIndex >= 0 ? anchorIndex : base.settings.anchorIndex,
    };
    const notes = {};
    if (isObject(source.notes)) {
      Object.entries(source.notes).forEach(([key, note]) => {
        if (isDateKey(key) && typeof note === 'string') notes[key] = note.slice(0, 500);
      });
    }
    const overrides = {};
    if (isObject(source.overrides)) {
      Object.entries(source.overrides).forEach(([key, value]) => {
        if (!isDateKey(key)) return;
        if (Number.isInteger(value) && value >= 0) overrides[key] = value;
        else {
          const shift = normalizeShift(value);
          if (shift) overrides[key] = shift;
        }
      });
    }
    const customShifts = Array.isArray(source.customShifts)
      ? source.customShifts.map(normalizeShift).filter(Boolean).map((shift, index) => ({
        ...shift,
        id: shift.id || `imported-${index}`,
        custom: true,
      }))
      : [];
    return { settings, overrides, notes, customShifts };
  }

  function isBackup(data) {
    return isObject(data)
      && isObject(data.settings)
      && PATTERN_KEYS.has(data.settings.pattern)
      && (data.overrides === undefined || isObject(data.overrides))
      && (data.notes === undefined || isObject(data.notes))
      && (data.customShifts === undefined || Array.isArray(data.customShifts));
  }

  function load() {
    try {
      return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
    } catch {
      return defaults();
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(data)));
  }

  function exportData(data) {
    const blob = new Blob([JSON.stringify({ ...normalize(data), exportedAt: new Date().toISOString(), app: 'ShiftCal Web', version: 1 }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ShiftCal-backup-${dateKey(new Date())}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importData(file, done) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!isBackup(parsed)) throw new Error('invalid backup');
        const data = normalize(parsed);
        save(data);
        done(data);
      } catch {
        alert('백업 파일을 불러오지 못했습니다. ShiftCal에서 내보낸 JSON 파일인지 확인해 주세요.');
      }
    };
    reader.onerror = () => alert('파일을 읽지 못했습니다. 다시 선택해 주세요.');
    reader.readAsText(file);
  }

  window.ShiftStorage = { load, save, exportData, importData };
})();
