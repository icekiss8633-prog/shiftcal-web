(() => {
  const PATTERNS = {
    fiveDutyFiveOff: { name: '5당 5비', types: [['당직','#D35400',9,0,9,0,false],['당직','#D35400',9,0,9,0,false],['당직','#D35400',9,0,9,0,false],['당직','#D35400',9,0,9,0,false],['당직','#D35400',9,0,9,0,false],['비번','#95A5A6',0,0,0,0,true],['비번','#95A5A6',0,0,0,0,true],['비번','#95A5A6',0,0,0,0,true],['비번','#95A5A6',0,0,0,0,true],['비번','#95A5A6',0,0,0,0,true]] },
    threeShift: { name: '3교대 (주간/야간/비번)', types: [['주간','#4A90D9',8,0,16,0,false],['야간','#9B59B6',16,0,24,0,false],['비번','#95A5A6',0,0,0,0,true]] },
    fourTeam: { name: '4조 2교대', types: [['주간','#4A90D9',8,0,20,0,false],['주간','#4A90D9',8,0,20,0,false],['야간','#9B59B6',20,0,8,0,false],['야간','#9B59B6',20,0,8,0,false],['비번','#95A5A6',0,0,0,0,true],['비번','#95A5A6',0,0,0,0,true]] },
    fourTeamThreeShift: { name: '4조 3교대', types: [['주간','#4A90D9',7,0,15,0,false],['오후','#F39C12',15,0,23,0,false],['야간','#9B59B6',23,0,7,0,false],['비번','#95A5A6',0,0,0,0,true]] },
    alternateDay: { name: '격일제', types: [['근무','#27AE60',8,0,20,0,false],['휴무','#95A5A6',0,0,0,0,true]] },
    twoTwo: { name: '2근 2휴', types: [['근무','#27AE60',9,0,18,0,false],['근무','#27AE60',9,0,18,0,false],['휴무','#95A5A6',0,0,0,0,true],['휴무','#95A5A6',0,0,0,0,true]] },
    pitman: { name: '2-2-3 12시간', types: [['주간','#4A90D9',8,0,20,0,false],['주간','#4A90D9',8,0,20,0,false],['휴무','#95A5A6',0,0,0,0,true],['휴무','#95A5A6',0,0,0,0,true],['주간','#4A90D9',8,0,20,0,false],['주간','#4A90D9',8,0,20,0,false],['주간','#4A90D9',8,0,20,0,false],['휴무','#95A5A6',0,0,0,0,true],['휴무','#95A5A6',0,0,0,0,true],['주간','#4A90D9',8,0,20,0,false],['주간','#4A90D9',8,0,20,0,false],['휴무','#95A5A6',0,0,0,0,true],['휴무','#95A5A6',0,0,0,0,true],['휴무','#95A5A6',0,0,0,0,true]] },
    twentyFourFortyEight: { name: '24시간 근무 48시간 휴무', types: [['당직','#D35400',9,0,9,0,false],['비번','#95A5A6',0,0,0,0,true],['휴무','#BDC3C7',0,0,0,0,true]] },
    fiveTwo: { name: '5일 근무 2일 휴무', types: [['근무','#27AE60',9,0,18,0,false],['근무','#27AE60',9,0,18,0,false],['근무','#27AE60',9,0,18,0,false],['근무','#27AE60',9,0,18,0,false],['근무','#27AE60',9,0,18,0,false],['휴무','#95A5A6',0,0,0,0,true],['휴무','#95A5A6',0,0,0,0,true]] }
  };
  const pad = n => String(n).padStart(2, '0');
  const key = date => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  const fromKey = value => { const [y,m,d] = value.split('-').map(Number); return new Date(y,m-1,d); };
  const dayDiff = (anchor, target) => Math.round((new Date(target.getFullYear(),target.getMonth(),target.getDate()) - new Date(anchor.getFullYear(),anchor.getMonth(),anchor.getDate())) / 86400000);
  const typeFromTuple = (t, index) => ({ id: String(index), name:t[0], color:t[1], startHour:t[2], startMinute:t[3], endHour:t[4], endMinute:t[5], isOff:t[6] });
  function shiftFor(date, settings, overrides = {}) {
    const pattern = PATTERNS[settings.pattern] || PATTERNS.threeShift;
    const dateKey = key(date);
    if (overrides[dateKey] !== undefined) {
      const override = overrides[dateKey];
      if (typeof override === 'object' && override !== null) return { id: `custom-${dateKey}`, ...override };
      if (Number.isInteger(override) && pattern.types[override]) return typeFromTuple(pattern.types[override], override);
    }
    const anchor = fromKey(settings.anchorDate || key(new Date()));
    let index = (Number(settings.anchorIndex) + dayDiff(anchor, date)) % pattern.types.length;
    if (index < 0) index += pattern.types.length;
    return typeFromTuple(pattern.types[index], index);
  }
  function timeRange(shift) {
    if (shift.isOff) return '근무 시간 없음';
    const start = `${pad(shift.startHour % 24)}:${pad(shift.startMinute)}`;
    const end = `${pad(shift.endHour % 24)}:${pad(shift.endMinute)}`;
    return shift.endHour >= 24 || shift.endHour <= shift.startHour ? `${start} ~ 다음 날 ${end}` : `${start} ~ ${end}`;
  }
  window.ShiftEngine = { PATTERNS, key, fromKey, shiftFor, timeRange };
})();
