import db from '@/lib/db';
import { memories, MemoryType } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateMemoryInput {
  type: MemoryType;
  content: string;
  keywords?: string[];
}

export interface UpdateMemoryInput {
  type?: MemoryType;
  content?: string;
  keywords?: string[];
  isActive?: boolean;
}

class MemoryManager {
  async create(input: CreateMemoryInput): Promise<Memory> {
    const now = new Date().toISOString();
    const memory: Memory = {
      id: crypto.randomUUID(),
      type: input.type,
      content: input.content,
      keywords: input.keywords || this.extractKeywords(input.content),
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    await db.insert(memories).values(memory);

    return memory;
  }

  async getById(id: string): Promise<Memory | null> {
    const result = await db.query.memories.findFirst({
      where: eq(memories.id, id),
    });

    return result as Memory | null;
  }

  async getAll(activeOnly: boolean = true): Promise<Memory[]> {
    if (activeOnly) {
      const result = await db.query.memories.findMany({
        where: eq(memories.isActive, true),
      });
      return result as Memory[];
    }

    const result = await db.query.memories.findMany();
    return result as Memory[];
  }

  async getByType(type: MemoryType, activeOnly: boolean = true): Promise<Memory[]> {
    if (activeOnly) {
      const result = await db.query.memories.findMany({
        where: and(eq(memories.type, type), eq(memories.isActive, true)),
      });
      return result as Memory[];
    }

    const result = await db.query.memories.findMany({
      where: eq(memories.type, type),
    });
    return result as Memory[];
  }

  async update(id: string, input: UpdateMemoryInput): Promise<Memory | null> {
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    const updated: Partial<Memory> = {
      updatedAt: new Date().toISOString(),
    };

    if (input.type !== undefined) updated.type = input.type;
    if (input.content !== undefined) {
      updated.content = input.content;
      updated.keywords = input.keywords || this.extractKeywords(input.content);
    } else if (input.keywords !== undefined) {
      updated.keywords = input.keywords;
    }
    if (input.isActive !== undefined) updated.isActive = input.isActive;

    await db.update(memories).set(updated).where(eq(memories.id, id));

    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) {
      return false;
    }
    await db.delete(memories).where(eq(memories.id, id));
    return true;
  }

  async toggleActive(id: string): Promise<Memory | null> {
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    return this.update(id, { isActive: !existing.isActive });
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction: split by common delimiters and filter
    const words = content
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2);

    // Remove common stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
      'that', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
      'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
    ]);

    const keywords = [...new Set(words.filter((word) => !stopWords.has(word)))];

    return keywords.slice(0, 10); // Limit to 10 keywords
  }
}

export const memoryManager = new MemoryManager();
export default MemoryManager;
