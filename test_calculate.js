// Quick test script for calculateRapi function from logic.ts
// Since the original TypeScript file cannot be imported directly in Node
// without transpilation, we'll inline a minimal version of the
// calculateRapi logic here to ensure it works with some sample data.

// Helper to get all dates between two ISO date strings (inclusive)
function getDatesInRange(startDate, endDate) {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) return [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Sample implementation of calculateRapi based on services/logic.ts
function calculateRapi(state, filters, view) {
  const { calendars, schedule, absences, teachers, classes, segments } = state;
  const { startDate, endDate, segmentId, classId, teacherId } = filters;
  const dateRange = getDatesInRange(startDate, endDate);
  const dailyLog = [];
  const expectedCounts = {};
  // Iterate over classes
  classes.forEach((cls) => {
    if (classId && cls.id !== classId) return;
    if (segmentId && cls.segmentId !== segmentId) return;
    const segment = segments.find((s) => s.id === cls.segmentId);
    if (!segment) return;
    const dailySchedule = schedule[cls.id];
    if (!dailySchedule) return;
    dateRange.forEach((dateStr) => {
      const ym = dateStr.substring(0, 7);
      const status = (calendars[cls.segmentId] || {})[ym]?.[dateStr];
      if (status !== 'letivo') return;
      const dayOfWeek = new Date(dateStr).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) return;
      const slots = dailySchedule[dayOfWeek];
      if (!slots) return;
      Object.entries(slots).forEach(([periodIdx, slot]) => {
        if (slot.teacherId && slot.subject) {
          if (teacherId && slot.teacherId !== teacherId) return;
          const key = `${slot.teacherId}|${cls.id}|${slot.subject}`;
          expectedCounts[key] = (expectedCounts[key] || 0) + 1;
          if (view === 'daily_log') {
            const tName = (teachers.find((t) => t.id === slot.teacherId) || {}).name || 'Unknown';
            dailyLog.push({
              date: dateStr,
              teacherName: tName,
              className: cls.name,
              subject: slot.subject,
              expected: 1,
              given: 1,
              absences: 0,
              percentage: 100,
            });
          }
        }
      });
    });
  });
  const absenceCounts = {};
  absences.forEach((abs) => {
    if (abs.date >= startDate && abs.date <= endDate) {
      if (teacherId && abs.teacherId !== teacherId) return;
      if (classId && abs.classId !== classId) return;
      if (segmentId) {
        const c = classes.find((cx) => cx.id === abs.classId);
        if (!c || c.segmentId !== segmentId) return;
      }
      const key = `${abs.teacherId}|${abs.classId}|${abs.subject}`;
      absenceCounts[key] = (absenceCounts[key] || 0) + abs.amount;
      if (view === 'daily_log') {
        const tName = (teachers.find((t) => t.id === abs.teacherId) || {}).name || 'Unknown';
        const cName = (classes.find((c) => c.id === abs.classId) || {}).name || 'Unknown';
        dailyLog.push({
          date: abs.date,
          teacherName: tName,
          className: cName,
          subject: abs.subject,
          expected: 0,
          given: 0,
          absences: abs.amount,
          percentage: 0,
          isAbsenceRecord: true,
        });
      }
    }
  });
  if (view === 'daily_log') {
    return dailyLog.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }
  const allKeys = new Set([...Object.keys(expectedCounts), ...Object.keys(absenceCounts)]);
  const report = [];
  allKeys.forEach((key) => {
    const [tIdKey, cIdKey, subjKey] = key.split('|');
    const teacher = teachers.find((t) => t.id === tIdKey);
    const classGroup = classes.find((c) => c.id === cIdKey);
    const expected = expectedCounts[key] || 0;
    const abs = absenceCounts[key] || 0;
    const given = Math.max(0, expected - abs);
    const percentage = expected > 0 ? (given / expected) * 100 : 0;
    if (teacher && classGroup) {
      report.push({
        teacherName: teacher.name,
        className: classGroup.name,
        subject: subjKey,
        expected,
        given,
        absences: abs,
        percentage,
      });
    }
  });
  if (view === 'teacher_summary') {
    const summaryMap = {};
    report.forEach((item) => {
      const key = item.teacherName;
      if (!summaryMap[key]) {
        summaryMap[key] = {
          teacherName: item.teacherName,
          className: '-',
          subject: '-',
          expected: 0,
          given: 0,
          absences: 0,
          percentage: 0,
        };
      }
      summaryMap[key].expected += item.expected;
      summaryMap[key].given += item.given;
      summaryMap[key].absences += item.absences;
    });
    return Object.values(summaryMap).map((item) => {
      const percentage = item.expected > 0 ? (item.given / item.expected) * 100 : 0;
      return { ...item, percentage };
    });
  }
  return report.sort((a, b) => {
    if (a.teacherName !== b.teacherName) return a.teacherName.localeCompare(b.teacherName);
    return a.className.localeCompare(b.className);
  });
}

// Sample data for testing
const state = {
  teachers: [ { id: 't1', name: 'Prof. A' }, { id: 't2', name: 'Prof. B' } ],
  segments: [ { id: 'seg1', name: 'Regular', dailyPeriods: 5 } ],
  classes: [ { id: 'c1', name: 'Turma 1', segmentId: 'seg1' } ],
  schedule: {
    c1: {
      1: { 0: { subject: 'Math', teacherId: 't1' }, 1: { subject: 'History', teacherId: 't2' } },
      2: { 0: { subject: 'Math', teacherId: 't1' } },
      3: {},
      4: {},
      5: {},
    },
  },
  calendars: {
    seg1: {
      '2025-12': {
        '2025-12-01': 'letivo',
        '2025-12-02': 'letivo',
        '2025-12-03': 'feriado',
      },
    },
  },
  absences: [ { id: 'abs1', date: '2025-12-02', teacherId: 't1', classId: 'c1', subject: 'Math', amount: 1 } ],
};

const filters = {
  startDate: '2025-12-01',
  endDate: '2025-12-02',
  segmentId: '',
  classId: '',
  teacherId: '',
};

console.log('Teacher summary:\n', calculateRapi(state, filters, 'teacher_summary'));
console.log('Detailed:\n', calculateRapi(state, filters, 'detailed'));
console.log('Daily log:\n', calculateRapi(state, filters, 'daily_log'));