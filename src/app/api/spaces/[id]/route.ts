import db from '@/lib/db';
import { spaces, chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;

    const space = await db.query.spaces.findFirst({
      where: eq(spaces.id, id),
    });

    if (!space) {
      return Response.json({ message: 'Space not found' }, { status: 404 });
    }

    const spaceChats = await db.query.chats.findMany({
      where: eq(chats.spaceId, id),
    });

    return Response.json(
      {
        space,
        chats: spaceChats.reverse(),
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error in getting space by id: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const { name, description } = await req.json();

    const space = await db.query.spaces.findFirst({
      where: eq(spaces.id, id),
    });

    if (!space) {
      return Response.json({ message: 'Space not found' }, { status: 404 });
    }

    const updates: Partial<{ name: string; description: string | null }> = {};
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return Response.json({ message: 'Name cannot be empty' }, { status: 400 });
      }
      if (trimmedName.length > 100) {
        return Response.json({ message: 'Name must be 100 characters or less' }, { status: 400 });
      }
      updates.name = trimmedName;
    }
    if (description !== undefined) updates.description = description?.trim() || null;

    if (Object.keys(updates).length === 0) {
      return Response.json({ space }, { status: 200 });
    }

    await db.update(spaces).set(updates).where(eq(spaces.id, id)).execute();

    const updatedSpace = await db.query.spaces.findFirst({
      where: eq(spaces.id, id),
    });

    return Response.json({ space: updatedSpace }, { status: 200 });
  } catch (err) {
    console.error('Error in updating space: ', err);
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

    const space = await db.query.spaces.findFirst({
      where: eq(spaces.id, id),
    });

    if (!space) {
      return Response.json({ message: 'Space not found' }, { status: 404 });
    }

    // Use transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // Set spaceId to null for all chats in this space
      await tx.update(chats).set({ spaceId: null }).where(eq(chats.spaceId, id));
      // Delete the space
      await tx.delete(spaces).where(eq(spaces.id, id));
    });

    return Response.json(
      { message: 'Space deleted successfully' },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error in deleting space: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
