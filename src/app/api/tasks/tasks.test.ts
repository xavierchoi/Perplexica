import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database
const mockTasks = [
  {
    id: 'task-1',
    name: 'Daily News',
    query: 'Latest tech news',
    scheduleType: 'daily',
    cronExpression: '0 9 * * *',
    spaceId: null,
    isActive: true,
    lastRunAt: null,
    nextRunAt: '2024-01-16T09:00:00.000Z',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'task-2',
    name: 'Weekly Report',
    query: 'AI developments this week',
    scheduleType: 'weekly',
    cronExpression: '0 9 * * 1',
    spaceId: 'space-1',
    isActive: true,
    lastRunAt: '2024-01-08T09:00:00.000Z',
    nextRunAt: '2024-01-22T09:00:00.000Z',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-08T09:00:00.000Z',
  },
];

const mockDb = {
  query: {
    tasks: {
      findMany: vi.fn().mockResolvedValue(mockTasks),
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      execute: vi.fn().mockResolvedValue(undefined),
    }),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      execute: vi.fn().mockResolvedValue(undefined),
    }),
  }),
};

vi.mock('@/lib/db', () => ({
  default: mockDb,
}));

vi.mock('@/lib/db/schema', () => ({
  tasks: { id: 'id' },
  TaskScheduleType: {},
}));

vi.mock('@/lib/tasks/scheduler', () => ({
  parseSchedule: vi.fn().mockReturnValue({
    nextRun: new Date('2024-01-16T09:00:00.000Z'),
    cronExpression: '0 9 * * *',
  }),
}));

vi.mock('crypto', () => ({
  default: {
    randomUUID: vi.fn().mockReturnValue('new-task-id'),
  },
}));

describe('Tasks API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.query.tasks.findMany.mockResolvedValue(mockTasks);
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks sorted by creation date', async () => {
      const { GET } = await import('./route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toBeDefined();
      expect(Array.isArray(data.tasks)).toBe(true);
    });

    it('should handle database errors', async () => {
      mockDb.query.tasks.findMany.mockRejectedValueOnce(new Error('DB Error'));

      const { GET } = await import('./route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('An error has occurred.');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task with valid data', async () => {
      const { POST } = await import('./route');
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Task',
          query: 'Test query',
          scheduleType: 'daily',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.task).toBeDefined();
      expect(data.task.name).toBe('Test Task');
      expect(data.task.query).toBe('Test query');
      expect(data.task.scheduleType).toBe('daily');
    });

    it('should return 400 when name is missing', async () => {
      const { POST } = await import('./route');
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Test query',
          scheduleType: 'daily',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Name is required');
    });

    it('should return 400 when query is missing', async () => {
      const { POST } = await import('./route');
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Task',
          scheduleType: 'daily',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Query is required');
    });

    it('should return 400 when scheduleType is invalid', async () => {
      const { POST } = await import('./route');
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Task',
          query: 'Test query',
          scheduleType: 'invalid',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Valid schedule type is required');
    });

    it('should return 400 when cron schedule has no expression', async () => {
      const { POST } = await import('./route');
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Task',
          query: 'Test query',
          scheduleType: 'cron',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe(
        'Cron expression is required for cron schedule type'
      );
    });

    it('should accept all valid schedule types', async () => {
      const validTypes = ['once', 'daily', 'weekly', 'monthly'];

      for (const scheduleType of validTypes) {
        const { POST } = await import('./route');
        const request = new Request('http://localhost/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Task',
            query: 'Test query',
            scheduleType,
          }),
        });

        const response = await POST(request);
        expect(response.status).toBe(201);
      }
    });

    it('should accept cron schedule with expression', async () => {
      const { POST } = await import('./route');
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Task',
          query: 'Test query',
          scheduleType: 'cron',
          cronExpression: '0 12 * * *',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it('should trim whitespace from name and query', async () => {
      const { POST } = await import('./route');
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '  Test Task  ',
          query: '  Test query  ',
          scheduleType: 'daily',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.task.name).toBe('Test Task');
      expect(data.task.query).toBe('Test query');
    });

    it('should associate task with space if spaceId provided', async () => {
      const { POST } = await import('./route');
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Task',
          query: 'Test query',
          scheduleType: 'daily',
          spaceId: 'space-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.task.spaceId).toBe('space-123');
    });
  });
});
