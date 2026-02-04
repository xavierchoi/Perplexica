import { TaskScheduleType } from '../db/schema';

interface ParsedSchedule {
  nextRun: Date;
  cronExpression?: string;
}

export function parseSchedule(
  scheduleType: TaskScheduleType,
  cronExpression?: string,
  fromDate: Date = new Date(),
): ParsedSchedule {
  const now = new Date(fromDate);

  switch (scheduleType) {
    case 'once':
      return { nextRun: now };

    case 'daily': {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0);
      return { nextRun: next, cronExpression: '0 9 * * *' };
    }

    case 'weekly': {
      const next = new Date(now);
      const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
      next.setDate(next.getDate() + daysUntilMonday);
      next.setHours(9, 0, 0, 0);
      return { nextRun: next, cronExpression: '0 9 * * 1' };
    }

    case 'monthly': {
      const next = new Date(now);
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      next.setHours(9, 0, 0, 0);
      return { nextRun: next, cronExpression: '0 9 1 * *' };
    }

    case 'cron': {
      if (!cronExpression) {
        throw new Error('Cron expression is required for cron schedule type');
      }
      const nextRun = getNextCronRun(cronExpression, now);
      return { nextRun, cronExpression };
    }

    default:
      throw new Error(`Unknown schedule type: ${scheduleType}`);
  }
}

export function getNextCronRun(
  cronExpression: string,
  fromDate: Date = new Date(),
): Date {
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(
      'Invalid cron expression. Expected 5 parts: minute hour day month weekday',
    );
  }

  const [minutePart, hourPart, dayPart, monthPart, weekdayPart] = parts;

  const parseField = (
    field: string,
    min: number,
    max: number,
    fieldName: string,
  ): number[] | null => {
    if (field === '*') return null;

    const values: number[] = [];
    const ranges = field.split(',');

    const validateNumber = (num: number, context: string): void => {
      if (isNaN(num)) {
        throw new Error(`Invalid ${fieldName} value in cron expression: ${context}`);
      }
      if (num < min || num > max) {
        throw new Error(
          `${fieldName} value ${num} is out of range (${min}-${max})`,
        );
      }
    };

    for (const range of ranges) {
      if (range.includes('/')) {
        const [base, stepStr] = range.split('/');
        const step = parseInt(stepStr, 10);
        validateNumber(step, `step "${stepStr}"`);
        const start = base === '*' ? min : parseInt(base, 10);
        if (base !== '*') validateNumber(start, `base "${base}"`);
        for (let i = start; i <= max; i += step) {
          values.push(i);
        }
      } else if (range.includes('-')) {
        const [startStr, endStr] = range.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        validateNumber(start, `range start "${startStr}"`);
        validateNumber(end, `range end "${endStr}"`);
        for (let i = start; i <= end; i++) {
          values.push(i);
        }
      } else {
        const num = parseInt(range, 10);
        validateNumber(num, `"${range}"`);
        values.push(num);
      }
    }

    return values.length > 0 ? values : null;
  };

  const minutes = parseField(minutePart, 0, 59, 'minute');
  const hours = parseField(hourPart, 0, 23, 'hour');
  const days = parseField(dayPart, 1, 31, 'day');
  const months = parseField(monthPart, 1, 12, 'month');
  const weekdays = parseField(weekdayPart, 0, 6, 'weekday');

  const matches = (date: Date): boolean => {
    const m = date.getMinutes();
    const h = date.getHours();
    const d = date.getDate();
    const mo = date.getMonth() + 1;
    const wd = date.getDay();

    if (minutes && !minutes.includes(m)) return false;
    if (hours && !hours.includes(h)) return false;
    if (days && !days.includes(d)) return false;
    if (months && !months.includes(mo)) return false;
    if (weekdays && !weekdays.includes(wd)) return false;

    return true;
  };

  const next = new Date(fromDate);
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);

  const maxIterations = 366 * 24 * 60;
  for (let i = 0; i < maxIterations; i++) {
    if (matches(next)) {
      return next;
    }
    next.setMinutes(next.getMinutes() + 1);
  }

  throw new Error('Could not find next run time within one year');
}

export function shouldRunNow(nextRunAt: string | null): boolean {
  if (!nextRunAt) return false;
  const nextRun = new Date(nextRunAt);
  const now = new Date();
  return nextRun <= now;
}

export function formatScheduleDescription(
  scheduleType: TaskScheduleType,
  cronExpression?: string,
): string {
  switch (scheduleType) {
    case 'once':
      return 'Run once';
    case 'daily':
      return 'Daily at 9:00 AM';
    case 'weekly':
      return 'Weekly on Monday at 9:00 AM';
    case 'monthly':
      return 'Monthly on the 1st at 9:00 AM';
    case 'cron':
      return `Custom schedule: ${cronExpression}`;
    default:
      return 'Unknown schedule';
  }
}
