(() => {
  const $ = id => document.getElementById(id);
  let data = ShiftStorage.load();
  let viewDate = new Date();
  let overrideDate = null;
  let currentView = 'calendarView';
  let calendarMode = data.settings.calendarMode || 'month';
  const presets = {
    duty: { name: '당직', color: '#D35400', startHour: 9, startMinute: 0, endHour: 9, endMinute: 0, isOff: false },
    off: { name: '비번', color: '#95A5A6', startHour: 0, startMinute: 0, endHour: 0, endMinute: 0, isOff: true },
    annual: { name: '연가', color: '#16A085', startHour: 0, startMinute: 0, endHour: 0, endMinute: 0, isOff: true },
    official: { name: '공가', color: '#5E81AC', startHour: 0, startMinute: 0, endHour: 0, endMinute: 0, isOff: true },
  };
  const { escapeHTML, safeColor, moveMonth, addDays, startOfWeek, periodTitle, findPresetKey, snapshotOverrides } = ShiftWebUtils;
  const timeParts = value => { const [hour, minute] = String(value || '09:00').split(':').map(Number); return { hour: hour || 0, minute: minute || 0 }; };
  const timeValue = (hour, minute) => `${String((Number(hour) || 0) % 24).padStart(2, '0')}:${String(Number(minute) || 0).padStart(2, '0')}`;
  const previewText = value => String(value || '').trim().replace(/\s+/g, ' ');
  function isCustomChoice(value) { return value === 'custom' || value.startsWith('saved:'); }
  function handleOverrideChoice() {
    const value = $('overrideSelect').value;
    if (value.startsWith('saved:')) populateCustomFields(savedShiftById(value.slice(6)) || {});
    toggleCustomFields();
  }
  function toggleCustomFields() {
    $('customShiftFields').classList.toggle('hidden-view', !isCustomChoice($('overrideSelect').value));
  }
  function populateCustomFields(shift = {}) {
    $('customShiftName').value = shift.name || '';
    $('customStart').value = timeValue(shift.startHour ?? 9, shift.startMinute ?? 0);
    $('customEnd').value = timeValue(shift.endHour ?? 18, shift.endMinute ?? 0);
    $('customColor').value = shift.color || '#607D8B';
    $('customIsOff').checked = Boolean(shift.isOff);
  }
  function customObjectFromForm() {
    const start = timeParts($('customStart').value);
    const end = timeParts($('customEnd').value);
    return { name: $('customShiftName').value.trim() || '기타', color: safeColor($('customColor').value), startHour: start.hour, startMinute: start.minute, endHour: end.hour, endMinute: end.minute, isOff: $('customIsOff').checked, custom: true };
  }
  function upsertCustomShift(shift, id = null) {
    const normalizedId = id || `custom-${Date.now()}`;
    const saved = { ...shift, id: normalizedId, custom: true };
    const index = data.customShifts.findIndex(item => item.id === normalizedId || item.name === saved.name);
    if (index >= 0) data.customShifts[index] = saved;
    else data.customShifts.push(saved);
    return saved;
  }
  function savedShiftById(id) { return data.customShifts.find(item => item.id === id); }

  function configuredPreset(key) {
    const preset = presets[key];
    if (!preset || key !== 'duty') return preset;
    const range = data.settings.shiftTimeOverrides?.[data.settings.pattern]?.[preset.name];
    return range ? { ...preset, ...range } : preset;
  }

  const todayKey = () => ShiftEngine.key(new Date());
  const fmt = date => `${date.getFullYear()}년 ${date.getMonth() + 1}월`;

  function renderToday() {
    const date = new Date();
    const key = ShiftEngine.key(date);
    const shift = ShiftEngine.shiftFor(date, data.settings, data.overrides);
    const note = previewText(data.notes[key]);
    $('todayCard').innerHTML = `<span class="today-main"><span class="today-label">오늘 · ${escapeHTML(date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }))}</span><strong class="today-shift">${escapeHTML(shift.name)}</strong></span><span class="today-meta">${escapeHTML(ShiftEngine.timeRange(shift))}${data.overrides[key] !== undefined ? ' · 변경' : ''}</span>${note ? `<span class="today-note">${escapeHTML(note)}</span>` : ''}`;
  }

  function createMonthCell(date) {
    const key = ShiftEngine.key(date);
    const shift = ShiftEngine.shiftFor(date, data.settings, data.overrides);
    const holiday = HolidayEngine.eventFor(date);
    const note = previewText(data.notes[key]);
    const cell = document.createElement('button');
    cell.className = 'day-cell';
    if (date.getMonth() !== viewDate.getMonth()) cell.classList.add('muted');
    if (date.getDay() === 0) cell.classList.add('sunday');
    if (date.getDay() === 6) cell.classList.add('saturday');
    if (key === todayKey()) cell.classList.add('today');
    if (holiday) cell.classList.add(holiday.type === 'holiday' ? 'holiday-cell' : 'anniversary-cell');
    cell.setAttribute('aria-label', `${key} ${shift.name}${holiday ? ` ${holiday.name}` : ''}${note ? ` 메모 ${note}` : ''}`);
    cell.innerHTML = `<span class="day-number">${date.getDate()}</span>${holiday ? `<span class="holiday-label ${holiday.type}">${escapeHTML(holiday.name)}</span>` : ''}<span class="shift-pill ${shift.isOff ? 'off' : ''}" style="background:${safeColor(shift.color)}">${escapeHTML(shift.name)}</span>${note ? `<span class="calendar-note">${escapeHTML(note)}</span>` : ''}${data.overrides[key] !== undefined ? '<i class="override-dot"></i>' : ''}`;
    cell.addEventListener('click', () => openOverride(date));
    return cell;
  }

  function createAgendaRow(date) {
    const key = ShiftEngine.key(date);
    const shift = ShiftEngine.shiftFor(date, data.settings, data.overrides);
    const holiday = HolidayEngine.eventFor(date);
    const note = previewText(data.notes[key]);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const row = document.createElement('button');
    row.className = 'agenda-row';
    if (date.getDay() === 0) row.classList.add('sunday');
    if (date.getDay() === 6) row.classList.add('saturday');
    if (holiday?.type === 'holiday') row.classList.add('holiday');
    if (key === todayKey()) row.classList.add('today');
    row.setAttribute('aria-label', `${key} ${shift.name}${holiday ? ` ${holiday.name}` : ''}${note ? ` 메모 ${note}` : ''}`);
    row.innerHTML = `<span class="agenda-date"><b>${date.getDate()}</b><small>${date.getMonth() + 1}월 · ${weekdays[date.getDay()]}</small></span><span class="agenda-content"><span class="agenda-shift-line"><i class="agenda-color" style="background:${safeColor(shift.color)}"></i><strong>${escapeHTML(shift.name)}</strong><small>${escapeHTML(ShiftEngine.timeRange(shift))}${data.overrides[key] !== undefined ? ' · 변경' : ''}</small></span>${holiday ? `<span class="agenda-holiday ${holiday.type}">${escapeHTML(holiday.name)}</span>` : ''}${note ? `<span class="agenda-note">${escapeHTML(note)}</span>` : ''}</span>`;
    row.addEventListener('click', () => openOverride(date));
    return row;
  }

  function renderCalendar() {
    $('monthTitle').textContent = periodTitle(viewDate, calendarMode);
    $('weekdayRow').classList.toggle('hidden-view', calendarMode !== 'month');
    document.querySelectorAll('.calendar-mode-button').forEach(button => {
      const active = button.dataset.calendarMode === calendarMode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    const grid = $('calendarGrid');
    grid.innerHTML = '';
    grid.className = calendarMode === 'month' ? 'calendar-grid' : `schedule-list ${calendarMode}-list`;
    if (calendarMode === 'week') {
      const start = startOfWeek(viewDate);
      for (let index = 0; index < 7; index += 1) grid.append(createAgendaRow(addDays(start, index)));
      return;
    }
    if (calendarMode === 'list') {
      const days = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
      for (let day = 1; day <= days; day += 1) grid.append(createAgendaRow(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)));
      return;
    }
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1 - first.getDay());
    for (let i = 0; i < 42; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      grid.append(createMonthCell(date));
    }
  }

  function renderNotes() {
    const entries = Object.entries(data.notes).filter(([, note]) => String(note).trim()).sort(([a], [b]) => b.localeCompare(a));
    $('notesCount').textContent = `${entries.length}개`;
    $('notesList').innerHTML = '';
    if (!entries.length) {
      $('notesList').innerHTML = '<div class="empty-card"><strong>작성한 메모가 없습니다</strong><span>달력에서 날짜를 선택해 메모를 남겨 보세요.</span></div>';
      return;
    }
    entries.forEach(([dateKey, note]) => {
      const date = ShiftEngine.fromKey(dateKey);
      const shift = ShiftEngine.shiftFor(date, data.settings, data.overrides);
      const item = document.createElement('button');
      item.className = 'note-card';
      item.innerHTML = `<span class="note-date">${date.getMonth() + 1}월 ${date.getDate()}일 · ${escapeHTML(shift.name)}</span><strong></strong><span class="note-arrow">›</span>`;
      item.querySelector('strong').textContent = note;
      item.addEventListener('click', () => openOverride(date));
      $('notesList').append(item);
    });
  }

  function renderStats() {
    const summary = ShiftStats.monthSummary(viewDate, data.settings, data.overrides, data.notes);
    $('statsTitle').textContent = `${fmt(viewDate)} 통계`;
    $('statsPattern').textContent = (ShiftEngine.PATTERNS[data.settings.pattern] || ShiftEngine.PATTERNS.threeShift).name;
    $('statsCards').innerHTML = [
      ['근무일', summary.totalDays - summary.offDays, '일'],
      ['휴무일', summary.offDays, '일'],
      ['기록 근무', summary.workHours, '시간'],
      ['메모', summary.noteCount, '개'],
    ].map(([label, value, unit]) => `<div class="stat-card"><span>${label}</span><strong>${value}<small>${unit}</small></strong></div>`).join('');
    $('allowanceCards').innerHTML = [
      ['수당용 실근무', summary.allowanceWorkHours, '시간'],
      ['기본근무', summary.regularHours, '시간'],
      ['시간외', summary.overtimeHours, '시간'],
      ['야간근무', summary.nightWorkHours, '시간'],
      ['휴일근무', summary.holidayWorkDays, '일'],
    ].map(([label, value, unit]) => `<div class="stat-card"><span>${label}</span><strong>${value}<small>${unit}</small></strong></div>`).join('');
    const holidayWarning = summary.holidayDataComplete ? '' : ` · ${viewDate.getFullYear()}년 변동 공휴일 데이터 확인 필요`;
    $('allowanceNote').textContent = `현업·교대근무 예상치 · 근무 1회당 식사·수면·휴식 ${summary.allowanceBreakMinutes}분 공제 · 시간외 월 합계는 1시간 미만 절사 · 야간 구간의 휴게시간과 대체휴무, 기관별 승인·예산 조건은 별도 확인이 필요합니다.${holidayWarning}`;
    const entries = Object.entries(summary.shiftCounts);
    $('shiftBreakdown').innerHTML = entries.map(([name, count]) => `<div class="breakdown-row"><span>${escapeHTML(name)}</span><strong>${count}일</strong></div>`).join('');
  }

  function render() {
    renderToday();
    renderCalendar();
    renderNotes();
    renderStats();
  }

  function showView(viewId) {
    currentView = viewId;
    document.querySelectorAll('.app-view').forEach(view => view.classList.toggle('hidden-view', view.id !== viewId));
    document.querySelectorAll('.bottom-nav-item[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === viewId));
  }

  function populateSettings() {
    const patternSelect = $('patternSelect');
    patternSelect.innerHTML = '';
    Object.entries(ShiftEngine.PATTERNS).forEach(([key, pattern]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = pattern.name;
      patternSelect.append(option);
    });
    patternSelect.value = data.settings.pattern;
    $('anchorDate').value = data.settings.anchorDate;
    $('allowanceBreakMinutes').value = String(data.settings.allowanceBreakMinutes || 0);
    populateAnchorOptions();
    populateShiftTimeSettings();
  }

  function populateAnchorOptions() {
    const pattern = ShiftEngine.PATTERNS[$('patternSelect').value];
    const select = $('anchorIndex');
    select.innerHTML = '';
    pattern.types.forEach((tuple, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${index + 1}일차 · ${tuple[0]}`;
      select.append(option);
    });
    select.value = String(data.settings.anchorIndex);
  }

  function populateShiftTimeSettings() {
    const patternKey = $('patternSelect').value;
    const pattern = ShiftEngine.PATTERNS[patternKey] || ShiftEngine.PATTERNS.threeShift;
    const configured = data.settings.shiftTimeOverrides?.[patternKey] || {};
    const container = $('shiftTimeSettings');
    const seen = new Set();
    container.innerHTML = '';
    pattern.types.forEach(tuple => {
      const [name, , startHour, startMinute, endHour, endMinute, isOff] = tuple;
      if (isOff || seen.has(name)) return;
      seen.add(name);
      const range = configured[name] || { startHour, startMinute, endHour, endMinute };
      const row = document.createElement('div');
      row.className = 'shift-time-row';
      row.dataset.shiftTimeName = name;
      const nameLabel = document.createElement('span');
      nameLabel.className = 'shift-time-name';
      nameLabel.textContent = name;
      const fields = document.createElement('div');
      fields.className = 'shift-time-fields';
      const startLabel = document.createElement('label');
      startLabel.textContent = '시작';
      const startInput = document.createElement('input');
      startInput.type = 'time';
      startInput.required = true;
      startInput.dataset.shiftTimeRole = 'start';
      startInput.setAttribute('aria-label', `${name} 시작`);
      startInput.value = timeValue(range.startHour, range.startMinute);
      startLabel.append(startInput);
      const endLabel = document.createElement('label');
      endLabel.textContent = '종료';
      const endInput = document.createElement('input');
      endInput.type = 'time';
      endInput.required = true;
      endInput.dataset.shiftTimeRole = 'end';
      endInput.setAttribute('aria-label', `${name} 종료`);
      endInput.value = timeValue(range.endHour, range.endMinute);
      endLabel.append(endInput);
      fields.append(startLabel, endLabel);
      row.append(nameLabel, fields);
      container.append(row);
    });
  }

  function collectShiftTimeSettings() {
    return Object.fromEntries([...$('shiftTimeSettings').querySelectorAll('.shift-time-row')].map(row => {
      const start = timeParts(row.querySelector('[data-shift-time-role="start"]').value);
      const end = timeParts(row.querySelector('[data-shift-time-role="end"]').value);
      return [row.dataset.shiftTimeName, {
        startHour: start.hour,
        startMinute: start.minute,
        endHour: end.hour,
        endMinute: end.minute,
      }];
    }));
  }

  function openSettings() {
    populateSettings();
    $('settingsDialog').showModal();
  }

  function openOverride(date) {
    overrideDate = date;
    const key = ShiftEngine.key(date);
    $('overrideTitle').textContent = `${date.getMonth() + 1}월 ${date.getDate()}일 근무 변경`;
    const select = $('overrideSelect');
    select.innerHTML = '';
    select.append(new Option('기본 패턴', 'default'));
    Object.entries({ duty: '당직', off: '비번', annual: '연가', official: '공가' }).forEach(([value, label]) => select.append(new Option(label, value)));
    data.customShifts.forEach(shift => select.append(new Option(`★ ${shift.name}`, `saved:${shift.id}`)));
    select.append(new Option('직접 입력', 'custom'));
    const current = data.overrides[key];
    const configuredPresets = Object.fromEntries(Object.keys(presets).map(key => [key, configuredPreset(key)]));
    const presetValue = findPresetKey(current, configuredPresets)
      || (current?.name === presets.duty.name && !current.custom ? 'duty' : null);
    if (typeof current === 'number') {
      const legacy = ShiftEngine.shiftFor(date, data.settings, data.overrides);
      select.value = 'custom';
      populateCustomFields(legacy);
    } else if (presetValue) {
      select.value = presetValue;
    } else if (current?.custom) {
      const saved = current.id ? savedShiftById(current.id) : null;
      select.value = saved ? `saved:${saved.id}` : 'custom';
      populateCustomFields(saved || current);
    } else if (current) {
      select.value = 'custom';
      populateCustomFields(current);
    } else {
      select.value = 'default';
      populateCustomFields();
    }
    $('noteInput').value = data.notes[key] || '';
    toggleCustomFields();
    $('overrideDialog').showModal();
  }

  function movePeriod(offset) {
    viewDate = calendarMode === 'week' ? addDays(viewDate, offset * 7) : moveMonth(viewDate, offset);
    render();
  }

  $('previousMonth').onclick = () => movePeriod(-1);
  $('nextMonth').onclick = () => movePeriod(1);
  $('todayButton').onclick = () => { viewDate = new Date(); render(); };
  $('todayCard').onclick = () => openOverride(new Date());
  $('bottomSettings').onclick = openSettings;
  $('patternSelect').onchange = () => { populateAnchorOptions(); populateShiftTimeSettings(); };
  $('overrideSelect').onchange = handleOverrideChoice;
  document.querySelectorAll('.calendar-mode-button').forEach(button => button.addEventListener('click', () => {
    calendarMode = button.dataset.calendarMode;
    data.settings.calendarMode = calendarMode;
    ShiftStorage.save(data);
    renderCalendar();
  }));
  document.querySelectorAll('.bottom-nav-item[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));

  $('settingsForm').addEventListener('submit', event => {
    if (event.submitter?.id !== 'saveSettings') return;
    data.overrides = snapshotOverrides(data.overrides, data.settings, ShiftEngine);
    const pattern = $('patternSelect').value;
    data.settings = {
      ...data.settings,
      pattern,
      anchorDate: $('anchorDate').value,
      anchorIndex: Number($('anchorIndex').value),
      allowanceBreakMinutes: Number($('allowanceBreakMinutes').value) || 0,
      shiftTimeOverrides: {
        ...(data.settings.shiftTimeOverrides || {}),
        [pattern]: collectShiftTimeSettings(),
      },
    };
    ShiftStorage.save(data);
    render();
  });

  $('overrideForm').addEventListener('submit', event => {
    if (event.submitter?.id !== 'saveOverride' || !overrideDate) return;
    const key = ShiftEngine.key(overrideDate);
    const selected = $('overrideSelect').value;
    if (selected === 'default') delete data.overrides[key];
    else if (presets[selected]) data.overrides[key] = { ...configuredPreset(selected), custom: false };
    else {
      const existing = selected.startsWith('saved:') ? savedShiftById(selected.slice(6)) : null;
      const saved = upsertCustomShift(customObjectFromForm(), existing?.id || null);
      data.overrides[key] = { ...saved };
    }
    const note = $('noteInput').value.trim();
    if (note) data.notes[key] = note;
    else delete data.notes[key];
    ShiftStorage.save(data);
    render();
  });

  $('clearOverride').onclick = () => {
    if (!overrideDate) return;
    delete data.overrides[ShiftEngine.key(overrideDate)];
    ShiftStorage.save(data);
    $('overrideDialog').close();
    render();
  };
  $('exportButton').onclick = () => ShiftStorage.exportData(data);
  $('importInput').onchange = event => {
    if (!event.target.files[0]) return;
    ShiftStorage.importData(event.target.files[0], next => {
      data = next;
      calendarMode = data.settings.calendarMode || 'month';
      populateSettings();
      render();
      $('settingsDialog').close();
      event.target.value = '';
    });
  };

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  render();
  showView(currentView);
})();
