import { eq } from 'drizzle-orm';
import db from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { executeTask } from '@/lib/tasks/executor';

export const POST = async (
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

    const result = await executeTask(id);

    if (result.success) {
      return Response.json(
        {
          message: 'Task executed successfully',
          resultId: result.resultId,
          summary: result.summary,
          sources: result.sources,
        },
        { status: 200 },
      );
    } else {
      return Response.json(
        {
          message: 'Task execution failed',
          resultId: result.resultId,
          error: result.error,
        },
        { status: 500 },
      );
    }
  } catch (err) {
    console.error('Error running task:', err);
    return Response.json({ message: 'An error has occurred.' }, { status: 500 });
  }
};
