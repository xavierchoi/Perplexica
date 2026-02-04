import { NextRequest, NextResponse } from 'next/server';
import { memoryManager, CreateMemoryInput, UpdateMemoryInput } from '@/lib/memory';
import { MemoryType } from '@/lib/db/schema';

const VALID_MEMORY_TYPES = ['preference', 'fact', 'instruction'];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    if (type && !VALID_MEMORY_TYPES.includes(type)) {
      return NextResponse.json(
        { message: 'Invalid memory type.' },
        { status: 400 },
      );
    }

    let memories;
    if (type) {
      memories = await memoryManager.getByType(type as MemoryType, activeOnly);
    } else {
      memories = await memoryManager.getAll(activeOnly);
    }

    return NextResponse.json({ memories }, { status: 200 });
  } catch (err) {
    console.error('Error fetching memories:', err);
    return NextResponse.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateMemoryInput = await req.json();

    if (!body.type || !body.content?.trim()) {
      return NextResponse.json(
        { message: 'Type and content are required.' },
        { status: 400 },
      );
    }

    if (!VALID_MEMORY_TYPES.includes(body.type)) {
      return NextResponse.json(
        { message: 'Invalid memory type.' },
        { status: 400 },
      );
    }

    const memory = await memoryManager.create(body);

    return NextResponse.json({ memory }, { status: 201 });
  } catch (err) {
    console.error('Error creating memory:', err);
    return NextResponse.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
}
