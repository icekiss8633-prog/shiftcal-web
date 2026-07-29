(() => {
  const $ = id => document.getElementById(id);
  let data = ShiftStorage.load();
  let viewDate = new Date();
  let overrideDate = null;
  let currentView = 'calendarView';
  const todayKey = () => ShiftEngine.key(new Date());
  const fmt = date => `${date.getFullYear()}년 ${date.getMonth() + 1}월`;

  function renderToday() {
    const shift = ShiftEngine.shiftFor(new Date(), data.settings, data.overrides);
    const note = data.notes[todayKey()];
    $('todayCard').innerHTML = `<div class="today-label">오늘 · ${new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</div><div class="today-shift">${shift.name}</div><div class="today-meta">${ShiftEngine.timeRange(shift)}${data.overrides[todayKey()] !== undefined ? ' · 날짜별 변경' : ''}${note ? ' · 메모 있음' : ''}</div>`;
  }

  function renderLegend() {
    const pattern = ShiftEngine.PATTERNS[data.settings.pattern];
    const seen = new Set();
    $('legend').innerHTML = '';
    pattern.types.forEach(tuple => {
      if (seen.has(tuple[0])) return;
      seen.add(tuple[0]);
      const item = document.createElement('span');
      item.className = 'legend-item';
      item.innerHTML = `<i class="legend-dot" style="background:${tuple[1]}"></i>${tuple[0]}`;
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
      cell.innerHTML = `<span class="day-number">${date.getDate()}</span>${holiday ? `<span class="holiday-label ${holiday.type}">${holiday.name}</span>` : ''}<span class="shift-pill ${shift.isOff ? 'off' : ''}" style="background:${shift.color}">${shift.name}</span>${data.overrides[key] !== undefined ? '<i class="override-dot"></i>' : ''}${data.notes[key] ? '<i class="note-dot" title="메모 있음"></i>' : ''}`;
      cell.addEventListener('click', () => openOverride(date));
      $('calendarGrid').append(cell);
    }
  }

  function renderNotes() {
    const entries = Object.entries(data.notes).filter(([, note]) => String(note).trim()).sort(([a], [b]) => b.localeCompare(a));
    $('notesCount').textContent = `${entries.length}개`;
    $('notesList').innerHTML = '';
    if (!entries.length) {
      $('notesList').innerHTML = '<div class="empty-card"><strong>아직 메모가 없어</strong><span>달력에서 날짜를 누르면 메모를 남길 수 있어.</span></div>';
      return;
    }
    entries.forEach(([dateKey, note]) => {
      const date = ShiftEngine.fromKey(dateKey);
      const shift = ShiftEngine.shiftFor(date, data.settings, data.overrides);
      const item = document.createElement('button');
      item.className = 'note-card';
      item.innerHTML = `<span class="note-date">${date.getMonth() + 1}월 ${date.getDate()}일 · ${shift.name}</span><strong></strong><span class="note-arrow">›</span>`;
      item.querySelector('strong').textContent = note;
      item.addEventListener('click', () => openOverride(date));
      $('notesList').append(item);
    });
  }

  function renderStats() {
    const summary = ShiftStats.monthSummary(viewDate, data.settings, data.overrides, data.notes);
    $('statsTitle').textContent = `${fmt(viewDate)} 통계`;
    $('statsPattern').textContent = ShiftEngine.PATTERNS[data.settings.pattern].name;
    $('statsCards').innerHTML = [
      ['근무일', summary.totalDays - summary.offDays, '일'],
      ['휴무·비번', summary.offDays, '일'],
      ['야간', summary.nightDays, '일'],
      ['근무시간', summary.workHours, '시간'],
      ['메모', summary.noteCount, '개'],
    ].map(([label, value, unit]) => `<div class="stat-card"><span>${label}</span><strong>${value}<small>${unit}</small></strong></div>`).join('');
    const entries = Object.entries(summary.shiftCounts);
    $('shiftBreakdown').innerHTML = entries.map(([name, count]) => `<div class="breakdown-row"><span>${name}</span><strong>${count}일</strong></div>`).join('');
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
    const pattern = ShiftEngine.PATTERNS[data.settings.pattern];
    const key = ShiftEngine.key(date);
    $('overrideTitle').textContent = `${date.getMonth() + 1}월 ${date.getDate()}일 근무 변경`;
    const select = $('overrideSelect');
    select.innerHTML = '';
    pattern.types.forEach((tuple, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${index + 1}일차 · ${tuple[0]}`;
      select.append(option);
    });
    const anchor = new Date(`${data.settings.anchorDate}T00:00:00`);
    const defaultIndex = (data.settings.anchorIndex + Math.round((date - anchor) / 86400000)) % pattern.types.length;
    select.value = String(data.overrides[key] ?? (defaultIndex + pattern.types.length) % pattern.types.length);
    $('noteInput').value = data.notes[key] || '';
    $('overrideDialog').showModal();
  }

  $('previousMonth').onclick = () => { viewDate.setMonth(viewDate.getMonth() - 1); render(); };
  $('nextMonth').onclick = () => { viewDate.setMonth(viewDate.getMonth() + 1); render(); };
  $('todayButton').onclick = () => { viewDate = new Date(); render(); };
  $('settingsButton').onclick = openSettings;
  $('bottomSettings').onclick = openSettings;
  $('patternSelect').onchange = populateAnchorOptions;
  document.querySelectorAll('.bottom-nav-item[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));

  $('settingsForm').addEventListener('submit', event => {
    if (event.submitter?.id !== 'saveSettings') return;
    data.settings = { pattern: $('patternSelect').value, anchorDate: $('anchorDate').value, anchorIndex: Number($('anchorIndex').value) };
    data.overrides = {};
    ShiftStorage.save(data);
    render();
  });

  $('overrideForm').addEventListener('submit', event => {
    if (event.submitter?.id !== 'saveOverride' || !overrideDate) return;
    const key = ShiftEngine.key(overrideDate);
    data.overrides[key] = Number($('overrideSelect').value);
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
    });
  };

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  render();
  showView(currentView);
})();
