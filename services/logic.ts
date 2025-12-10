
import { AppState, CalendarStatus, RapiReportItem, Segment } from '../types';

const STORAGE_KEY = 'rapi_pro_v2';

// Initial Seed Data
const DEFAULT_SEGMENT: Segment = { id: 'default', name: 'Ensino Regular', dailyPeriods: 5 };

const DEFAULT_STATE: AppState = {
  teachers: [],
  segments: [DEFAULT_SEGMENT],
  classes: [],
  schedule: {},
  calendars: { 'default': {} },
  absences: []
};

export const loadState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (!parsed.segments) {
        return {
          ...DEFAULT_STATE,
          teachers: parsed.teachers || [],
          classes: (parsed.classes || []).map((c: any) => ({ ...c, segmentId: 'default' })),
          schedule: parsed.schedule || {},
          calendars: { 'default': parsed.calendar || {} },
          absences: parsed.absences || []
        };
      }
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load state", e);
  }
  return DEFAULT_STATE;
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log("State saved successfully");
  } catch (e) {
    console.error("Failed to save state", e);
  }
};

export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- RAPI Calculation Engine ---

export const getWeekdayFromDate = (dateStr: string): number => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCDay(); // 0 = Sun, 1 = Mon, ...
};

// Helper to get all dates between start and end
export const getDatesInRange = (startDate: string, endDate: string): string[] => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Safety check to prevent infinite loops if dates are bad
  if (start > end) return [];

  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

export interface ReportFilter {
  startDate: string;
  endDate: string;
  segmentId?: string;
  classId?: string;
  teacherId?: string;
}

export const calculateRapi = (
  state: AppState,
  filters: ReportFilter,
  view: 'detailed' | 'teacher_summary' | 'daily_log'
): RapiReportItem[] => {
  const { calendars, schedule, absences, teachers, classes, segments } = state;
  const { startDate, endDate, segmentId, classId, teacherId } = filters;

  const dateRange = getDatesInRange(startDate, endDate);
  
  // Detailed tracking for "daily_log" view
  const dailyLog: RapiReportItem[] = [];
  
  // Accumulators for summary views
  // Key: teacherId|classId|subject
  const expectedCounts: Record<string, number> = {};

  // 1. Iterate Classes
  classes.forEach(cls => {
    // Apply Class Filter
    if (classId && cls.id !== classId) return;
    // Apply Segment Filter
    if (segmentId && cls.segmentId !== segmentId) return;

    const segment = segments.find(s => s.id === cls.segmentId);
    if (!segment) return;

    // Get Calendar for this segment
    // We need to look up month by month, but the calendar structure is { 'YYYY-MM': { 'YYYY-MM-DD': status } }
    // Or we can just access direct date keys if we flattened it, but currently it is nested.
    
    const dailySchedule = schedule[cls.id]; 
    if (!dailySchedule) return;

    // Iterate every date in the selected range
    dateRange.forEach(dateStr => {
      const ym = dateStr.substring(0, 7);
      // Fallback: if calendário não tem status definido, considerar dia útil como letivo.
      const status = calendars[cls.segmentId]?.[ym]?.[dateStr] || 'letivo';

      // Ignorar feriados/dias não letivos explícitos.
      if (status === 'nao_letivo' || status === 'feriado') return;

      const dayOfWeek = getWeekdayFromDate(dateStr);
      // Só contar sábado se marcado como "sabado_letivo"; nunca contar domingo.
      if (dayOfWeek === 0 || (dayOfWeek === 6 && status !== 'sabado_letivo')) return;

      const slots = dailySchedule[dayOfWeek];
      if (!slots) return;

      Object.entries(slots).forEach(([periodIdx, slot]) => {
        if (slot.teacherId && slot.subject) {
          // Apply Teacher Filter
          if (teacherId && slot.teacherId !== teacherId) return;

          const key = `${slot.teacherId}|${cls.id}|${slot.subject}`;
          expectedCounts[key] = (expectedCounts[key] || 0) + 1;

          // Add to daily log if requested
          if (view === 'daily_log') {
             const tName = teachers.find(t => t.id === slot.teacherId)?.name || 'Unknown';
             dailyLog.push({
                 date: dateStr,
                 teacherName: tName,
                 className: cls.name,
                 subject: slot.subject,
                 expected: 1,
                 given: 1, // Will subtract later if absence found
                 absences: 0,
                 percentage: 100
             });
          }
        }
      });
    });
  });

  // 2. Aggregate Absences
  const absenceCounts: Record<string, number> = {};
  
  // We need to map absences to the specific daily log entries if in daily view
  // But absences in the system are "Bulk" (amount: 2). 
  // For the Daily Log, we might just list the absence record separately or try to deduct.
  // For simplicity in Daily Log: We list absences as negative entries or distinct entries.
  
  absences.forEach(abs => {
    if (abs.date >= startDate && abs.date <= endDate) {
       // Filters
       if (teacherId && abs.teacherId !== teacherId) return;
       if (classId && abs.classId !== classId) return;
       // We can't easily filter absence by segment unless we lookup class -> segment, which is expensive, but ok.
       if (segmentId) {
           const c = classes.find(cx => cx.id === abs.classId);
           if (c?.segmentId !== segmentId) return;
       }

       const key = `${abs.teacherId}|${abs.classId}|${abs.subject}`;
       absenceCounts[key] = (absenceCounts[key] || 0) + abs.amount;

       if (view === 'daily_log') {
          const tName = teachers.find(t => t.id === abs.teacherId)?.name || 'Unknown';
          const cName = classes.find(c => c.id === abs.classId)?.name || 'Unknown';
          dailyLog.push({
              date: abs.date,
              teacherName: tName,
              className: cName,
              subject: abs.subject,
              expected: 0,
              given: 0,
              absences: abs.amount,
              percentage: 0,
              isAbsenceRecord: true
          });
       }
    }
  });

  if (view === 'daily_log') {
      return dailyLog.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }

  // 3. Merge Summary Data
  const allKeys = new Set([...Object.keys(expectedCounts), ...Object.keys(absenceCounts)]);
  const report: RapiReportItem[] = [];

  allKeys.forEach(key => {
    const [tIdKey, cIdKey, subjKey] = key.split('|');
    const teacher = teachers.find(t => t.id === tIdKey);
    const classGroup = classes.find(c => c.id === cIdKey);

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
        percentage
      });
    }
  });

  // 4. Grouping if view is summary
  if (view === 'teacher_summary') {
    const summaryMap: Record<string, RapiReportItem> = {};
    
    report.forEach(item => {
      const key = item.teacherName;
      if (!summaryMap[key]) {
        summaryMap[key] = {
          teacherName: item.teacherName,
          className: '-',
          subject: '-',
          expected: 0,
          given: 0,
          absences: 0,
          percentage: 0
        };
      }
      summaryMap[key].expected += item.expected;
      summaryMap[key].given += item.given;
      summaryMap[key].absences += item.absences;
    });

    return Object.values(summaryMap).map(item => ({
      ...item,
      percentage: item.expected > 0 ? (item.given / item.expected) * 100 : 0
    })).sort((a, b) => a.teacherName.localeCompare(b.teacherName));
  }

  // Detailed Sort
  return report.sort((a, b) => a.teacherName.localeCompare(b.teacherName) || a.className.localeCompare(b.className));
};

export const parseCSV = (content: string): string[][] => {
  return content.trim().split(/\r?\n/).map(line => line.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
};
