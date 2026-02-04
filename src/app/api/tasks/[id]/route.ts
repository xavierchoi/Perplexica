import { eq } from 'drizzle-orm';
import db from '@/lib/db';
import { tasks, taskResults, TaskScheduleType } from '@/lib/db/schema';
import { parseSchedule } from '@/lib/tasks/scheduler';

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
    });

    if (!task) {
      return Response.json({ message: 'Task not found' }, { status: 404 });
    }

    const results = await db.query.taskResults.findMany({
      where: eq(taskResults.taskId, id),
    });

    const sortedResults = results.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );

    return Response.json(
      { task, results: sortedResults },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error fetching task:', err);
    return Response.json({ message: 'An error has occurred.' }, { status: 500 });
  }
};

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, query, scheduleType, cronExpression, spaceId, isActive } = body;

    const existingTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
    });

    if (!existingTask) {
      return Response.json({ message: 'Task not found' }, { status: 404 });
    }

    const updates: Partial<{
      name: string;
      query: string;
      scheduleType: TaskScheduleType;
      cronExpression: string | null;
      spaceId: string | null;
      isActive: boolean;
      nextRunAt: string | null;
      updatedAt: string;
    }> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return Response.json({ message: 'Name cannot be empty' }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (query !== undefined) {
      if (typeof query !== 'string' || query.trim().length === 0) {
        return Response.json({ message: 'Query cannot be empty' }, { status: 400 });
      }
      updates.query = query.trim();
    }

    if (scheduleType !== undefined) {
      if (!['once', 'daily', 'weekly', 'monthly', 'cron'].includes(scheduleType)) {
        return Response.json({ message: 'Invalid schedule type' }, { status: 400 });
      }

      const cron = cronExpression ?? existingTask.cronExpression;
      if (scheduleType === 'cron' && !cron) {
        return Response.json(
          { message: 'Cron expression is required for cron schedule type' },
          { status: 400 },
        );
      }

      const schedule = parseSchedule(
        scheduleType as TaskScheduleType,
        cron || undefined,
      );

      updates.scheduleType = scheduleType as TaskScheduleType;
      updates.cronExpression = schedule.cronExpression || null;
      updates.nextRunAt = schedule.nextRun.toISOString();
    }

    if (spaceId !== undefined) {
      updates.spaceId = spaceId || null;
    }

    if (isActive !== undefined) {
      updates.isActive = Boolean(isActive);
    }

    await db.update(tasks).set(updates).where(eq(tasks.id, id)).execute();

    const updatedTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
    });

    return Response.json({ task: updatedTask }, { status: 200 });
  } catch (err) {
    console.error('Error updating task:', err);
    return Response.json({ message: 'An error has occurred.' }, { status: 500 });
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
    });

    if (!task) {
      return Response.json({ message: 'Task not found' }, { status: 404 });
    }

    await db.delete(tasks).where(eq(tasks.id, id)).execute();

    return Response.json({ message: 'Task deleted successfully' }, { status: 200 });
  } catch (err) {
    console.error('Error deleting task:', err);
    return Response.json({ message: 'An error has occurred.' }, { status: 500 });
  }
};
