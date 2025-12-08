
export interface Teacher {
  id: string;
  name: string;
}

export interface Segment {
  id: string;
  name: string;
  dailyPeriods: number; // e.g., 4 for EJA, 5 for Regular
}

export interface ClassGroup {
  id: string;
  name: string;
  segmentId: string; // Links class to a context (EJA, Fund I, etc)
}

// 1 = Monday, 5 = Friday
export type DayOfWeek = 1 | 2 | 3 | 4 | 5;

export interface ScheduleItem {
  subject: string;
  teacherId: string;
}

// Structure: { [classId]: { [dayOfWeek]: { [periodIndex]: ScheduleItem } } }
export interface ScheduleGrid {
  [classId: string]: {
    [day: number]: {
      [period: number]: ScheduleItem; // period is 0-indexed (0 = 1st class)
    };
  };
}

export type CalendarStatus = 'letivo' | 'sabado_letivo' | 'feriado' | 'nao_letivo';

// Structure: { 'YYYY-MM': { 'YYYY-MM-DD': CalendarStatus } }
export interface CalendarData {
  [yearMonth: string]: {
    [fullDate: string]: CalendarStatus;
  };
}

// Structure: { [segmentId]: CalendarData }
export interface CalendarCollection {
  [segmentId: string]: CalendarData;
}

export interface Absence {
  id: string;
  date: string;
  teacherId: string;
  classId: string;
  subject: string;
  amount: number;
}

export interface AppState {
  teachers: Teacher[];
  segments: Segment[];
  classes: ClassGroup[];
  schedule: ScheduleGrid;
  calendars: CalendarCollection; // Changed from single calendar to collection
  absences: Absence[];
}

export interface RapiReportItem {
  teacherName: string;
  className: string;
  subject: string;
  expected: number;
  given: number;
  absences: number;
  percentage: number;
  // For daily log view
  date?: string;
  isAbsenceRecord?: boolean;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  segmentId: string;
  classId: string;
  teacherId: string;
}
