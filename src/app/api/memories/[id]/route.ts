import { NextRequest, NextResponse } from 'next/server';
import { memoryManager, UpdateMemoryInput } from '@/lib/memory';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const memory = await memoryManager.getById(id);

    if (!memory) {
      return NextResponse.json(
        { message: 'Memory not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ memory }, { status: 200 });
  } catch (err) {
    console.error('Error fetching memory:', err);
    return NextResponse.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body: UpdateMemoryInput = await req.json();

    if (body.type && !['preference', 'fact', 'instruction'].includes(body.type)) {
      return NextResponse.json(
        { message: 'Invalid memory type.' },
        { status: 400 },
      );
    }

    const memory = await memoryManager.update(id, body);

    if (!memory) {
      return NextResponse.json(
        { message: 'Memory not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ memory }, { status: 200 });
  } catch (err) {
    console.error('Error updating memory:', err);
    return NextResponse.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await memoryManager.getById(id);

    if (!existing) {
      return NextResponse.json(
        { message: 'Memory not found.' },
        { status: 404 },
      );
    }

    await memoryManager.delete(id);

    return NextResponse.json(
      { message: 'Memory deleted successfully.' },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error deleting memory:', err);
    return NextResponse.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
}
