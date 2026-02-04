import crypto from 'crypto';
import db from '@/lib/db';
import { tasks, TaskScheduleType } from '@/lib/db/schema';
import { parseSchedule } from '@/lib/tasks/scheduler';

export const GET = async () => {
  try {
    let allTasks = await db.query.tasks.findMany();
    allTasks = allTasks.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return Response.json({ tasks: allTasks }, { status: 200 });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    return Response.json({ message: 'An error has occurred.' }, { status: 500 });
  }
};

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { name, query, scheduleType, cronExpression, spaceId } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json({ message: 'Name is required' }, { status: 400 });
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return Response.json({ message: 'Query is required' }, { status: 400 });
    }

    if (!scheduleType || !['once', 'daily', 'weekly', 'monthly', 'cron'].includes(scheduleType)) {
      return Response.json({ message: 'Valid schedule type is required' }, { status: 400 });
    }

    if (scheduleType === 'cron' && (!cronExpression || typeof cronExpression !== 'string')) {
      return Response.json(
        { message: 'Cron expression is required for cron schedule type' },
        { status: 400 },
      );
    }

    const schedule = parseSchedule(
      scheduleType as TaskScheduleType,
      cronExpression,
    );

    const now = new Date().toISOString();
    const newTask = {
      id: crypto.randomUUID(),
      name: name.trim(),
      query: query.trim(),
      scheduleType: scheduleType as TaskScheduleType,
      cronExpression: schedule.cronExpression || null,
      spaceId: spaceId || null,
      isActive: true,
      lastRunAt: null,
      nextRunAt: schedule.nextRun.toISOString(),
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(tasks).values(newTask).execute();

    return Response.json({ task: newTask }, { status: 201 });
  } catch (err) {
    console.error('Error creating task:', err);
    return Response.json({ message: 'An error has occurred.' }, { status: 500 });
  }
};
