import db from '@/lib/db';
import { spaces } from '@/lib/db/schema';
import crypto from 'crypto';

export const GET = async (req: Request) => {
  try {
    let allSpaces = await db.query.spaces.findMany();
    allSpaces = allSpaces.reverse();
    return Response.json({ spaces: allSpaces }, { status: 200 });
  } catch (err) {
    console.error('Error in getting spaces: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};

export const POST = async (req: Request) => {
  try {
    const { name, description } = await req.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return Response.json(
        { message: 'Name is required' },
        { status: 400 },
      );
    }

    if (name.trim().length > 100) {
      return Response.json(
        { message: 'Name must be 100 characters or less' },
        { status: 400 },
      );
    }

    const newSpace = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description?.trim() || null,
      createdAt: new Date().toISOString(),
    };

    await db.insert(spaces).values(newSpace).execute();

    return Response.json({ space: newSpace }, { status: 201 });
  } catch (err) {
    console.error('Error in creating space: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
