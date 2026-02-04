import db from '@/lib/db';
import { chats, messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ shareId: string }> },
) => {
  try {
    const { shareId } = await params;

    const chat = await db.query.chats.findFirst({
      where: eq(chats.shareId, shareId),
    });

    if (!chat || !chat.isPublic) {
      return Response.json(
        { message: 'Shared chat not found' },
        { status: 404 },
      );
    }

    const chatMessages = await db.query.messages.findMany({
      where: eq(messages.chatId, chat.id),
    });

    return Response.json(
      {
        chat: {
          id: chat.id,
          title: chat.title,
          createdAt: chat.createdAt,
          sources: chat.sources,
        },
        messages: chatMessages,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error in getting shared chat: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
