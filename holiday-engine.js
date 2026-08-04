(() => {
  const recurring = {
    '01-01': { name: '신정', type: 'holiday' },
    '03-01': { name: '삼일절', type: 'holiday' },
    '04-05': { name: '식목일', type: 'anniversary' },
    '05-05': { name: '어린이날', type: 'holiday' },
    '05-08': { name: '어버이날', type: 'anniversary' },
    '05-15': { name: '스승의날', type: 'anniversary' },
    '06-06': { name: '현충일', type: 'holiday' },
    '08-15': { name: '광복절', type: 'holiday' },
    '10-01': { name: '국군의날', type: 'anniversary' },
    '10-03': { name: '개천절', type: 'holiday' },
    '10-09': { name: '한글날', type: 'holiday' },
    '12-25': { name: '성탄절', type: 'holiday' },
  };

  const effectiveRecurring = {
    '05-01': { name: '노동절', type: 'holiday', since: 2026 },
    '07-17': { name: '제헌절', type: 'holiday', since: 2026 },
  };

  // 우주항공청 2026년 월력요항과 2026년 개정 관공서 공휴일 기준.
  const yearly = {
    2026: {
      '02-16': { name: '설날 연휴', type: 'holiday' },
      '02-17': { name: '설날', type: 'holiday' },
      '02-18': { name: '설날 연휴', type: 'holiday' },
      '03-02': { name: '삼일절 대체공휴일', type: 'holiday' },
      '05-24': { name: '부처님오신날', type: 'holiday' },
      '05-25': { name: '부처님오신날 대체공휴일', type: 'holiday' },
      '06-03': { name: '제9회 전국동시지방선거', type: 'holiday' },
      '08-17': { name: '광복절 대체공휴일', type: 'holiday' },
      '09-24': { name: '추석 연휴', type: 'holiday' },
      '09-25': { name: '추석', type: 'holiday' },
      '09-26': { name: '추석 연휴', type: 'holiday' },
      '10-05': { name: '개천절 대체공휴일', type: 'holiday' },
    },
  };

  const key = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  function eventFor(date) {
    const fullKey = key(date);
    const yearEvent = yearly[date.getFullYear()]?.[fullKey.slice(5)];
    if (yearEvent) return { ...yearEvent, dateKey: fullKey };
    const monthDay = fullKey.slice(5);
    const effectiveEvent = effectiveRecurring[monthDay];
    if (effectiveEvent && date.getFullYear() >= effectiveEvent.since) {
      return { name: effectiveEvent.name, type: effectiveEvent.type, dateKey: fullKey };
    }
    const event = recurring[monthDay];
    return event ? { ...event, dateKey: fullKey } : null;
  }
  function eventsInMonth(monthDate) {
    const totalDays = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const events = [];
    for (let day = 1; day <= totalDays; day += 1) {
      const event = eventFor(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
      if (event) events.push(event);
    }
    return events;
  }
  window.HolidayEngine = { key, eventFor, eventsInMonth, recurring, effectiveRecurring, yearly };
})();
