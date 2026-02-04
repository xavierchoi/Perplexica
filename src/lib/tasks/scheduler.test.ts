import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseSchedule,
  getNextCronRun,
  shouldRunNow,
  formatScheduleDescription,
} from './scheduler';

describe('scheduler', () => {
  describe('parseSchedule', () => {
    it('should return immediate run for "once" schedule', () => {
      const fromDate = new Date('2024-01-15T10:00:00.000Z');
      const result = parseSchedule('once', undefined, fromDate);

      expect(result.nextRun).toEqual(fromDate);
      expect(result.cronExpression).toBeUndefined();
    });

    it('should return next day 9AM for "daily" schedule', () => {
      const fromDate = new Date('2024-01-15T10:00:00.000Z');
      const result = parseSchedule('daily', undefined, fromDate);

      expect(result.nextRun.getDate()).toBe(16);
      expect(result.nextRun.getHours()).toBe(9);
      expect(result.nextRun.getMinutes()).toBe(0);
      expect(result.cronExpression).toBe('0 9 * * *');
    });

    it('should return next Monday 9AM for "weekly" schedule', () => {
      const fromDate = new Date('2024-01-15T10:00:00.000Z'); // Monday
      const result = parseSchedule('weekly', undefined, fromDate);

      // Next Monday should be 7 days later
      expect(result.nextRun.getDay()).toBe(1); // Monday
      expect(result.nextRun.getHours()).toBe(9);
      expect(result.cronExpression).toBe('0 9 * * 1');
    });

    it('should return first of next month 9AM for "monthly" schedule', () => {
      const fromDate = new Date('2024-01-15T10:00:00.000Z');
      const result = parseSchedule('monthly', undefined, fromDate);

      expect(result.nextRun.getMonth()).toBe(1); // February
      expect(result.nextRun.getDate()).toBe(1);
      expect(result.nextRun.getHours()).toBe(9);
      expect(result.cronExpression).toBe('0 9 1 * *');
    });

    it('should use cron expression for "cron" schedule', () => {
      const fromDate = new Date('2024-01-15T10:00:00.000Z');
      const cronExpression = '30 14 * * *'; // 2:30 PM every day
      const result = parseSchedule('cron', cronExpression, fromDate);

      expect(result.cronExpression).toBe(cronExpression);
      expect(result.nextRun.getHours()).toBe(14);
      expect(result.nextRun.getMinutes()).toBe(30);
    });

    it('should throw error for "cron" schedule without expression', () => {
      expect(() => parseSchedule('cron')).toThrow(
        'Cron expression is required for cron schedule type'
      );
    });

    it('should throw error for unknown schedule type', () => {
      expect(() => parseSchedule('unknown' as any)).toThrow(
        'Unknown schedule type: unknown'
      );
    });
  });

  describe('getNextCronRun', () => {
    it('should parse simple cron expression', () => {
      const fromDate = new Date('2024-01-15T10:00:00.000Z');
      const result = getNextCronRun('0 12 * * *', fromDate); // noon every day

      expect(result.getHours()).toBe(12);
      expect(result.getMinutes()).toBe(0);
    });

    it('should parse cron with specific day of week', () => {
      const fromDate = new Date('2024-01-15T10:00:00.000Z'); // Monday
      const result = getNextCronRun('0 9 * * 5', fromDate); // Friday 9AM

      expect(result.getDay()).toBe(5); // Friday
      expect(result.getHours()).toBe(9);
    });

    it('should parse cron with range', () => {
      const fromDate = new Date('2024-01-15T10:00:00.000Z');
      const result = getNextCronRun('0 9-17 * * *', fromDate); // 9AM-5PM

      expect(result.getHours()).toBeGreaterThanOrEqual(9);
      expect(result.getHours()).toBeLessThanOrEqual(17);
    });

    it('should parse cron with step', () => {
      const fromDate = new Date('2024-01-15T10:00:00.000Z');
      const result = getNextCronRun('*/15 * * * *', fromDate); // every 15 minutes

      expect(result.getMinutes() % 15).toBe(0);
    });

    it('should parse cron with comma-separated values', () => {
      const fromDate = new Date('2024-01-15T10:00:00.000Z');
      const result = getNextCronRun('0 9,12,18 * * *', fromDate); // 9AM, 12PM, 6PM

      expect([9, 12, 18]).toContain(result.getHours());
    });

    it('should throw error for invalid cron expression', () => {
      expect(() => getNextCronRun('0 9 * *')).toThrow(
        'Invalid cron expression. Expected 5 parts'
      );
    });

    it('should throw error for out of range minute', () => {
      expect(() => getNextCronRun('60 9 * * *')).toThrow(
        'minute value 60 is out of range'
      );
    });

    it('should throw error for out of range hour', () => {
      expect(() => getNextCronRun('0 25 * * *')).toThrow(
        'hour value 25 is out of range'
      );
    });

    it('should throw error for out of range day', () => {
      expect(() => getNextCronRun('0 9 32 * *')).toThrow(
        'day value 32 is out of range'
      );
    });

    it('should throw error for out of range month', () => {
      expect(() => getNextCronRun('0 9 * 13 *')).toThrow(
        'month value 13 is out of range'
      );
    });

    it('should throw error for out of range weekday', () => {
      expect(() => getNextCronRun('0 9 * * 7')).toThrow(
        'weekday value 7 is out of range'
      );
    });

    it('should handle specific day and month', () => {
      const fromDate = new Date('2024-01-15T10:00:00.000Z');
      const result = getNextCronRun('0 9 25 12 *', fromDate); // Dec 25 9AM

      expect(result.getMonth()).toBe(11); // December
      expect(result.getDate()).toBe(25);
    });
  });

  describe('shouldRunNow', () => {
    it('should return false for null nextRunAt', () => {
      expect(shouldRunNow(null)).toBe(false);
    });

    it('should return true for past date', () => {
      const pastDate = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
      expect(shouldRunNow(pastDate)).toBe(true);
    });

    it('should return true for current time', () => {
      const now = new Date().toISOString();
      expect(shouldRunNow(now)).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date(Date.now() + 60000).toISOString(); // 1 minute in future
      expect(shouldRunNow(futureDate)).toBe(false);
    });
  });

  describe('formatScheduleDescription', () => {
    it('should format "once" schedule', () => {
      expect(formatScheduleDescription('once')).toBe('Run once');
    });

    it('should format "daily" schedule', () => {
      expect(formatScheduleDescription('daily')).toBe('Daily at 9:00 AM');
    });

    it('should format "weekly" schedule', () => {
      expect(formatScheduleDescription('weekly')).toBe(
        'Weekly on Monday at 9:00 AM'
      );
    });

    it('should format "monthly" schedule', () => {
      expect(formatScheduleDescription('monthly')).toBe(
        'Monthly on the 1st at 9:00 AM'
      );
    });

    it('should format "cron" schedule with expression', () => {
      expect(formatScheduleDescription('cron', '0 12 * * *')).toBe(
        'Custom schedule: 0 12 * * *'
      );
    });

    it('should return unknown for unrecognized schedule', () => {
      expect(formatScheduleDescription('invalid' as any)).toBe(
        'Unknown schedule'
      );
    });
  });
});
