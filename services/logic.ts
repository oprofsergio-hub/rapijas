
import { AppState, CalendarStatus, DayOfWeek, RapiReportItem, Segment } from '../types';

const STORAGE_KEY = 'rapi_pro_v2'; // Bumped version for schema change

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
      // Migration check: if old state layout (no segments), migrate it
      if (!parsed.segments) {
        return {
          ...DEFAULT_STATE,
          teachers: parsed.teachers || [],
          classes: (parsed.classes || []).map((c: any) => ({ ...c, segmentId: 'default' })),
          schedule: parsed.schedule || {},
          calendars: { 'default': parsed.calendar || {} }, // Migrate old calendar to default segment
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
  // Create date as UTC to avoid timezone issues
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCDay(); // 0 = Sun, 1 = Mon, ...
};

export const calculateRapi = (
  state: AppState,
  yearMonth: string,
  view: 'detailed' | 'teacher_summary'
): RapiReportItem[] => {
  const { calendars, schedule, absences, teachers, classes, segments } = state;
  
  // 1. Calculate Expected Classes (Aulas Previstas)
  // Map Key: teacherId|classId|subject -> count
  const expectedCounts: Record<string, number> = {};

  // We iterate over CLASSES first, because each class dictates its own calendar (via segment)
  classes.forEach(cls => {
    const segment = segments.find(s => s.id === cls.segmentId);
    if (!segment) return;

    const classCalendar = calendars[cls.segmentId]?.[yearMonth] || {};
    const dailySchedule = schedule[cls.id]; // { [day]: { [period]: Item } }

    if (!dailySchedule) return;

    Object.entries(classCalendar).forEach(([dateStr, status]) => {
      if (status !== 'letivo' && status !== 'sabado_letivo') return;

      const dayOfWeek = getWeekdayFromDate(dateStr);
      
      // If Saturday letivo, we assume it follows a specific schedule or logic.
      // For simplicity in this version, if 'sabado_letivo', we skip automatic calculation 
      // UNLESS the user explicitly mapped Saturdays (which we removed for simplicity in V2 to focus on Segments).
      // However, to keep it functional: let's assume Sat Letivo doesn't add automatic schedule 
      // unless we add specific Saturday mapping feature back. 
      // Standard RAPI usually ignores Saturday unless it's a "make up" day for a specific weekday.
      // Let's count weekday classes only for now to be safe, or assume strict Weekday matching.
      if (dayOfWeek === 0 || dayOfWeek === 6) return; 

      const slots = dailySchedule[dayOfWeek];
      if (!slots) return;

      Object.values(slots).forEach(slot => {
        if (slot.teacherId && slot.subject) {
          const key = `${slot.teacherId}|${cls.id}|${slot.subject}`;
          expectedCounts[key] = (expectedCounts[key] || 0) + 1;
        }
      });
    });
  });

  // 2. Aggregate Absences
  const absenceCounts: Record<string, number> = {};
  
  absences.forEach(abs => {
    if (abs.date.startsWith(yearMonth)) {
       const key = `${abs.teacherId}|${abs.classId}|${abs.subject}`;
       absenceCounts[key] = (absenceCounts[key] || 0) + abs.amount;
    }
  });

  // 3. Merge and Build Report
  const allKeys = new Set([...Object.keys(expectedCounts), ...Object.keys(absenceCounts)]);
  const report: RapiReportItem[] = [];

  allKeys.forEach(key => {
    const [teacherId, classId, subject] = key.split('|');
    const teacher = teachers.find(t => t.id === teacherId);
    const classGroup = classes.find(c => c.id === classId);

    const expected = expectedCounts[key] || 0;
    const abs = absenceCounts[key] || 0;
    const given = Math.max(0, expected - abs);
    const percentage = expected > 0 ? (given / expected) * 100 : 0;

    if (teacher && classGroup) {
      report.push({
        teacherName: teacher.name,
        className: classGroup.name,
        subject,
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
