import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateRapi, getDatesInRange, getWeekdayFromDate } from '../services/logic.ts';
import { AppState, CalendarStatus } from '../types';

// Simulate an environment with DST changes to ensure we never drop a date when iterating ranges.
process.env.TZ = 'America/New_York';

test('getDatesInRange preserves all days across DST boundaries', () => {
  const dates = getDatesInRange('2024-11-01', '2024-11-30');
  assert.equal(dates.length, 30);

  const weekdays = dates.filter((d) => {
    const dow = getWeekdayFromDate(d);
    return dow !== 0 && dow !== 6;
  });
  assert.equal(weekdays.length, 21);
});

test('calculateRapi counts aulas on sábado letivo even in DST months', () => {
  const teacherId = 't1';
  const classId = 'c1';
  const segmentId = 'seg1';
  const month = '2024-11';

  const dates = getDatesInRange('2024-11-01', '2024-11-30');
  const monthCalendar: Record<string, CalendarStatus> = {};

  dates.forEach((date) => {
    const dow = getWeekdayFromDate(date);
    if (dow === 0) {
      monthCalendar[date] = 'nao_letivo';
    } else if (dow === 6) {
      // Only the last Saturday is letivo; others remain não letivo
      monthCalendar[date] = date === '2024-11-30' ? 'sabado_letivo' : 'nao_letivo';
    } else {
      monthCalendar[date] = 'letivo';
    }
  });

  const slot = { subject: 'Multisseriado', teacherId };
  const dayTemplate = { 0: slot, 1: slot, 2: slot, 3: slot };

  const state: AppState = {
    teachers: [{ id: teacherId, name: 'Prof. Valéria' }],
    segments: [{ id: segmentId, name: 'Regular', dailyPeriods: 4 }],
    classes: [{ id: classId, name: 'Multisseriada', segmentId }],
    schedule: {
      [classId]: {
        1: dayTemplate,
        2: dayTemplate,
        3: dayTemplate,
        4: dayTemplate,
        5: dayTemplate,
        6: dayTemplate, // sábado letivo replicates the weekday carga horária
      },
    },
    calendars: { [segmentId]: { [month]: monthCalendar } },
    absences: [],
  };

  const [report] = calculateRapi(
    state,
    {
      startDate: '2024-11-01',
      endDate: '2024-11-30',
      segmentId: '',
      classId: '',
      teacherId: teacherId,
    },
    'teacher_summary',
  );

  assert.equal(report.expected, 88);
  assert.equal(report.given, 88);
});
