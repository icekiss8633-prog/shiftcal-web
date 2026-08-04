(() => {
  const $ = id => document.getElementById(id);
  let data = ShiftStorage.load();
  let viewDate = new Date();
  let overrideDate = null;
  let currentView = 'calendarView';
  const presets = {
    duty: { name: '당직', color: '#D35400', startHour: 9, startMinute: 0, endHour: 9, endMinute: 0, isOff: false },
    off: { name: '비번', color: '#95A5A6', startHour: 0, startMinute: 0, endHour: 0, endMinute: 0, isOff: true },
    annual: { name: '연가', color: '#16A085', startHour: 0, startMinute: 0, endHour: 0, endMinute: 0, isOff: true },
    official: { name: '공가', color: '#5E81AC', startHour: 0, startMinute: 0, endHour: 0, endMinute: 0, isOff: true },
  };
  const { escapeHTML, safeColor, moveMonth, findPresetKey, snapshotOverrides } = ShiftWebUtils;
  const timeParts = value => { const [hour, minute] = String(value || '09:00').split(':').map(Number); return { hour: hour || 0, minute: minute || 0 }; };
  const timeValue = (hour, minute) => `${String(hour || 0).padStart(2, '0')}:${String(minute || 0).padStart(2, '0')}`;
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

  const todayKey = () => ShiftEngine.key(new Date());
  const fmt = date => `${date.getFullYear()}년 ${date.getMonth() + 1}월`;

  function renderToday() {
    const shift = ShiftEngine.shiftFor(new Date(), data.settings, data.overrides);
    const note = data.notes[todayKey()];
    $('todayCard').innerHTML = `<div class="today-label">오늘 · ${escapeHTML(new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }))}</div><div class="today-shift">${escapeHTML(shift.name)}</div><div class="today-meta">${escapeHTML(ShiftEngine.timeRange(shift))}${data.overrides[todayKey()] !== undefined ? ' · 근무 변경됨' : ''}${note ? ' · 메모 있음' : ''}</div>`;
  }

  function renderLegend() {
    const pattern = ShiftEngine.PATTERNS[data.settings.pattern] || ShiftEngine.PATTERNS.threeShift;
    const seen = new Set();
    $('legend').innerHTML = '';
    pattern.types.forEach(tuple => {
      if (seen.has(tuple[0])) return;
      seen.add(tuple[0]);
      const item = document.createElement('span');
      item.className = 'legend-item';
      item.innerHTML = `<i class="legend-dot" style="background:${safeColor(tuple[1])}"></i>${escapeHTML(tuple[0])}`;
      $('legend').append(item);
    });
  }

  function renderCalendar() {
    $('monthTitle').textContent = fmt(viewDate);
    $('calendarGrid').innerHTML = '';
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1 - first.getDay());
    for (let i = 0; i < 42; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = ShiftEngine.key(date);
      const shift = ShiftEngine.shiftFor(date, data.settings, data.overrides);
      const holiday = HolidayEngine.eventFor(date);
      const cell = document.createElement('button');
      cell.className = 'day-cell';
      if (date.getMonth() !== viewDate.getMonth()) cell.classList.add('muted');
      if (date.getDay() === 0) cell.classList.add('sunday');
      if (date.getDay() === 6) cell.classList.add('saturday');
      if (key === todayKey()) cell.classList.add('today');
      if (holiday) cell.classList.add(holiday.type === 'holiday' ? 'holiday-cell' : 'anniversary-cell');
      cell.setAttribute('aria-label', `${key} ${shift.name}${holiday ? ` ${holiday.name}` : ''}${data.notes[key] ? ' 메모 있음' : ''}`);
      cell.innerHTML = `<span class="day-number">${date.getDate()}</span>${holiday ? `<span class="holiday-label ${holiday.type}">${escapeHTML(holiday.name)}</span>` : ''}<span class="shift-pill ${shift.isOff ? 'off' : ''}" style="background:${safeColor(shift.color)}">${escapeHTML(shift.name)}</span>${data.overrides[key] !== undefined ? '<i class="override-dot"></i>' : ''}${data.notes[key] ? '<i class="note-dot" title="메모 있음"></i>' : ''}`;
      cell.addEventListener('click', () => openOverride(date));
      $('calendarGrid').append(cell);
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
    $('allowanceNote').textContent = `현업·교대근무 예상치 · 근무 1회당 식사·수면·휴식 ${summary.allowanceBreakMinutes}분 공제 · 시간외 월 합계는 1시간 미만 절사 · 야간 구간의 휴게시간과 대체휴무, 기관별 승인·예산 조건은 별도 확인이 필요합니다.`;
    const entries = Object.entries(summary.shiftCounts);
    $('shiftBreakdown').innerHTML = entries.map(([name, count]) => `<div class="breakdown-row"><span>${escapeHTML(name)}</span><strong>${count}일</strong></div>`).join('');
  }

  function render() {
    renderToday();
    renderCalendar();
    renderLegend();
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
    const presetValue = findPresetKey(current, presets);
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

  $('previousMonth').onclick = () => { viewDate = moveMonth(viewDate, -1); render(); };
  $('nextMonth').onclick = () => { viewDate = moveMonth(viewDate, 1); render(); };
  $('todayButton').onclick = () => { viewDate = new Date(); render(); };
  $('settingsButton').onclick = openSettings;
  $('bottomSettings').onclick = openSettings;
  $('patternSelect').onchange = populateAnchorOptions;
  $('overrideSelect').onchange = handleOverrideChoice;
  document.querySelectorAll('.bottom-nav-item[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));

  $('settingsForm').addEventListener('submit', event => {
    if (event.submitter?.id !== 'saveSettings') return;
    data.overrides = snapshotOverrides(data.overrides, data.settings, ShiftEngine);
    data.settings = { pattern: $('patternSelect').value, anchorDate: $('anchorDate').value, anchorIndex: Number($('anchorIndex').value) };
    data.settings.allowanceBreakMinutes = Number($('allowanceBreakMinutes').value) || 0;
    ShiftStorage.save(data);
    render();
  });

  $('overrideForm').addEventListener('submit', event => {
    if (event.submitter?.id !== 'saveOverride' || !overrideDate) return;
    const key = ShiftEngine.key(overrideDate);
    const selected = $('overrideSelect').value;
    if (selected === 'default') delete data.overrides[key];
    else if (presets[selected]) data.overrides[key] = { ...presets[selected], custom: false };
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
