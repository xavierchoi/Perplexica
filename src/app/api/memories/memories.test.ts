import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock memory manager
const mockMemories = [
  {
    id: 'mem-1',
    type: 'preference',
    content: 'User prefers dark mode',
    keywords: ['dark', 'mode', 'theme'],
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    isActive: true,
  },
  {
    id: 'mem-2',
    type: 'fact',
    content: 'User is a software developer',
    keywords: ['developer', 'software'],
    createdAt: '2024-01-15T11:00:00.000Z',
    updatedAt: '2024-01-15T11:00:00.000Z',
    isActive: true,
  },
];

const mockMemoryManager = {
  getAll: vi.fn().mockResolvedValue(mockMemories),
  getByType: vi.fn().mockResolvedValue([mockMemories[0]]),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@/lib/memory', () => ({
  memoryManager: mockMemoryManager,
}));

describe('Memories API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMemoryManager.getAll.mockResolvedValue(mockMemories);
    mockMemoryManager.getByType.mockResolvedValue([mockMemories[0]]);
  });

  describe('GET /api/memories', () => {
    it('should return all active memories by default', async () => {
      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost/api/memories');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.memories).toHaveLength(2);
      expect(mockMemoryManager.getAll).toHaveBeenCalledWith(true);
    });

    it('should filter by type when provided', async () => {
      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost/api/memories?type=preference');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockMemoryManager.getByType).toHaveBeenCalledWith('preference', true);
    });

    it('should include inactive memories when activeOnly=false', async () => {
      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost/api/memories?activeOnly=false');

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockMemoryManager.getAll).toHaveBeenCalledWith(false);
    });

    it('should handle database errors', async () => {
      mockMemoryManager.getAll.mockRejectedValueOnce(new Error('DB Error'));

      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost/api/memories');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('An error has occurred.');
    });
  });

  describe('POST /api/memories', () => {
    it('should create a new memory', async () => {
      const newMemory = {
        id: 'mem-3',
        type: 'instruction',
        content: 'Always respond in Korean',
        keywords: ['korean', 'language'],
        createdAt: '2024-01-15T12:00:00.000Z',
        updatedAt: '2024-01-15T12:00:00.000Z',
        isActive: true,
      };
      mockMemoryManager.create.mockResolvedValueOnce(newMemory);

      const { POST } = await import('./route');
      const request = new NextRequest('http://localhost/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'instruction',
          content: 'Always respond in Korean',
          keywords: ['korean', 'language'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.memory.type).toBe('instruction');
    });

    it('should return 400 when type is missing', async () => {
      const { POST } = await import('./route');
      const request = new NextRequest('http://localhost/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Some content' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Type and content are required.');
    });

    it('should return 400 when content is missing', async () => {
      const { POST } = await import('./route');
      const request = new NextRequest('http://localhost/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'preference' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Type and content are required.');
    });

    it('should return 400 for invalid memory type', async () => {
      const { POST } = await import('./route');
      const request = new NextRequest('http://localhost/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'invalid', content: 'Content' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Invalid memory type.');
    });

    it('should accept all valid memory types', async () => {
      const validTypes = ['preference', 'fact', 'instruction'];

      for (const type of validTypes) {
        mockMemoryManager.create.mockResolvedValueOnce({
          id: `mem-${type}`,
          type,
          content: 'Test content',
          keywords: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
        });

        const { POST } = await import('./route');
        const request = new NextRequest('http://localhost/api/memories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, content: 'Test content' }),
        });

        const response = await POST(request);
        expect(response.status).toBe(201);
      }
    });
  });
});

describe('Memories API - Individual Memory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/memories/[id]', () => {
    it('should return memory by id', async () => {
      mockMemoryManager.getById.mockResolvedValueOnce(mockMemories[0]);

      const { GET } = await import('./[id]/route');
      const request = new NextRequest('http://localhost/api/memories/mem-1');

      const response = await GET(request, {
        params: Promise.resolve({ id: 'mem-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.memory.id).toBe('mem-1');
    });

    it('should return 404 when memory not found', async () => {
      mockMemoryManager.getById.mockResolvedValueOnce(null);

      const { GET } = await import('./[id]/route');
      const request = new NextRequest('http://localhost/api/memories/nonexistent');

      const response = await GET(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Memory not found.');
    });
  });

  describe('PATCH /api/memories/[id]', () => {
    it('should update memory content', async () => {
      const updatedMemory = { ...mockMemories[0], content: 'Updated content' };
      mockMemoryManager.update.mockResolvedValueOnce(updatedMemory);

      const { PATCH } = await import('./[id]/route');
      const request = new NextRequest('http://localhost/api/memories/mem-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated content' }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'mem-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.memory.content).toBe('Updated content');
    });

    it('should return 404 when updating nonexistent memory', async () => {
      mockMemoryManager.update.mockResolvedValueOnce(null);

      const { PATCH } = await import('./[id]/route');
      const request = new NextRequest('http://localhost/api/memories/nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated content' }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Memory not found.');
    });

    it('should return 400 for invalid memory type in update', async () => {
      const { PATCH } = await import('./[id]/route');
      const request = new NextRequest('http://localhost/api/memories/mem-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'invalid' }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'mem-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Invalid memory type.');
    });
  });

  describe('DELETE /api/memories/[id]', () => {
    it('should delete memory', async () => {
      mockMemoryManager.getById.mockResolvedValueOnce(mockMemories[0]);
      mockMemoryManager.delete.mockResolvedValueOnce(undefined);

      const { DELETE } = await import('./[id]/route');
      const request = new NextRequest('http://localhost/api/memories/mem-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'mem-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Memory deleted successfully.');
      expect(mockMemoryManager.delete).toHaveBeenCalledWith('mem-1');
    });

    it('should return 404 when deleting nonexistent memory', async () => {
      mockMemoryManager.getById.mockResolvedValueOnce(null);

      const { DELETE } = await import('./[id]/route');
      const request = new NextRequest('http://localhost/api/memories/nonexistent', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Memory not found.');
    });
  });
});
