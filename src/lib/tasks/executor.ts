import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import db from '../db';
import { tasks, taskResults, TaskStatus } from '../db/schema';
import { parseSchedule } from './scheduler';

interface TaskExecutionResult {
  success: boolean;
  resultId: string;
  summary?: string;
  sources?: { title: string; url: string }[];
  error?: string;
}

export async function executeTask(taskId: string): Promise<TaskExecutionResult> {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });

  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  // Check for concurrent execution - prevent duplicate runs
  const runningResult = await db.query.taskResults.findFirst({
    where: (tr, { and, eq }) =>
      and(eq(tr.taskId, taskId), eq(tr.status, 'running')),
  });

  if (runningResult) {
    throw new Error(`Task ${taskId} is already running`);
  }

  // Additional guard: check if task was run very recently (within 30 seconds)
  if (task.lastRunAt) {
    const lastRun = new Date(task.lastRunAt);
    const timeSinceLastRun = Date.now() - lastRun.getTime();
    if (timeSinceLastRun < 30000) {
      throw new Error(
        `Task ${taskId} was run ${Math.floor(timeSinceLastRun / 1000)} seconds ago. Please wait.`,
      );
    }
  }

  const resultId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  await db
    .insert(taskResults)
    .values({
      id: resultId,
      taskId,
      status: 'running' as TaskStatus,
      startedAt,
    })
    .execute();

  try {
    const searchResult = await performSearch(task.query);

    await db
      .update(taskResults)
      .set({
        status: 'completed' as TaskStatus,
        resultSummary: searchResult.summary,
        sources: searchResult.sources,
        completedAt: new Date().toISOString(),
      })
      .where(eq(taskResults.id, resultId))
      .execute();

    const nextRunAt =
      task.scheduleType === 'once'
        ? null
        : parseSchedule(task.scheduleType, task.cronExpression ?? undefined).nextRun.toISOString();

    await db
      .update(tasks)
      .set({
        lastRunAt: new Date().toISOString(),
        nextRunAt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tasks.id, taskId))
      .execute();

    return {
      success: true,
      resultId,
      summary: searchResult.summary,
      sources: searchResult.sources,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    await db
      .update(taskResults)
      .set({
        status: 'failed' as TaskStatus,
        error: errorMessage,
        completedAt: new Date().toISOString(),
      })
      .where(eq(taskResults.id, resultId))
      .execute();

    return {
      success: false,
      resultId,
      error: errorMessage,
    };
  }
}

async function performSearch(
  query: string,
): Promise<{ summary: string; sources: { title: string; url: string }[] }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const response = await fetch(`${baseUrl}/api/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      optimizationMode: 'balanced',
    }),
  });

  if (!response.ok) {
    throw new Error(`Search API returned ${response.status}`);
  }

  const data = await response.json();

  return {
    summary: data.message || 'No summary available',
    sources: (data.sources || []).map(
      (s: { title?: string; url: string; metadata?: { title?: string } }) => ({
        title: s.title || s.metadata?.title || s.url,
        url: s.url,
      }),
    ),
  };
}

export async function getTasksReadyToRun(): Promise<
  { id: string; name: string; query: string }[]
> {
  const now = new Date().toISOString();

  const readyTasks = await db.query.tasks.findMany({
    where: (tasks, { and, eq, lte, isNotNull }) =>
      and(eq(tasks.isActive, true), lte(tasks.nextRunAt, now)),
  });

  return readyTasks.map((t) => ({
    id: t.id,
    name: t.name,
    query: t.query,
  }));
}

export async function runDueTasks(): Promise<{
  executed: number;
  results: TaskExecutionResult[];
}> {
  const dueTasks = await getTasksReadyToRun();
  const results: TaskExecutionResult[] = [];

  for (const task of dueTasks) {
    try {
      const result = await executeTask(task.id);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        resultId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    executed: dueTasks.length,
    results,
  };
}
