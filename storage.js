(() => {
  const STORAGE_KEY = 'shiftcal-web-v1';
  const defaults = () => ({ settings: { pattern:'threeShift', anchorDate: new Date().toISOString().slice(0,10), anchorIndex:0 }, overrides:{}, notes:{}, customShifts:[] });
  function normalize(data) { const base = defaults(); return { ...base, ...data, notes:{ ...base.notes, ...(data.notes || {}) }, customShifts:Array.isArray(data.customShifts) ? data.customShifts : [] }; }
  function load() { try { return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch { return defaults(); } }
  function save(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  function exportData(data) {
    const blob = new Blob([JSON.stringify({ ...data, exportedAt:new Date().toISOString(), app:'ShiftCal Web', version:1 }, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`ShiftCal-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  }
  function importData(file, done) { const reader = new FileReader(); reader.onload = () => { try { const parsed=JSON.parse(reader.result); if (!parsed.settings || !parsed.settings.pattern) throw new Error('invalid'); const data=normalize({ ...parsed, settings:{...defaults().settings,...parsed.settings} }); save(data); done(data); } catch { alert('백업 파일을 읽지 못했어. ShiftCal 백업 JSON인지 확인해줘.'); } }; reader.readAsText(file); }
  window.ShiftStorage = { load, save, exportData, importData };
})();
