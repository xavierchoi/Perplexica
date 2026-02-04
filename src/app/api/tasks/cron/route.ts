import { runDueTasks } from '@/lib/tasks/executor';

export const POST = async (req: Request) => {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, CRON_SECRET must be configured
    if (process.env.NODE_ENV === 'production' && !cronSecret) {
      console.error('CRON_SECRET is not configured in production environment');
      return Response.json(
        { message: 'CRON_SECRET not configured' },
        { status: 500 },
      );
    }

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { executed, results } = await runDueTasks();

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return Response.json(
      {
        message: `Cron job completed. Executed ${executed} tasks.`,
        summary: {
          total: executed,
          successful,
          failed,
        },
        results: results.map((r) => ({
          resultId: r.resultId,
          success: r.success,
          error: r.error,
        })),
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error running cron:', err);
    return Response.json({ message: 'An error has occurred.' }, { status: 500 });
  }
};
