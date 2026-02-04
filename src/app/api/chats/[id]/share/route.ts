import db from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;

    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, id),
    });

    if (!chat) {
      return Response.json({ message: 'Chat not found' }, { status: 404 });
    }

    if (chat.shareId) {
      return Response.json(
        {
          shareId: chat.shareId,
          shareUrl: `/share/${chat.shareId}`,
        },
        { status: 200 },
      );
    }

    const shareId = nanoid(10);

    await db
      .update(chats)
      .set({ shareId, isPublic: true })
      .where(eq(chats.id, id))
      .execute();

    return Response.json(
      {
        shareId,
        shareUrl: `/share/${shareId}`,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error in creating share link: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;

    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, id),
    });

    if (!chat) {
      return Response.json({ message: 'Chat not found' }, { status: 404 });
    }

    await db
      .update(chats)
      .set({ shareId: null, isPublic: false })
      .where(eq(chats.id, id))
      .execute();

    return Response.json(
      { message: 'Share link removed successfully' },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error in removing share link: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
