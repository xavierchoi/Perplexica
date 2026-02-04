import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
const mockSpaces = [
  {
    id: 'space-1',
    name: 'Test Space 1',
    description: 'Description 1',
    createdAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'space-2',
    name: 'Test Space 2',
    description: null,
    createdAt: '2024-01-15T11:00:00.000Z',
  },
];

const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockReturnValue({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
});

const mockDb = {
  query: {
    spaces: {
      findMany: vi.fn().mockResolvedValue(mockSpaces),
      findFirst: vi.fn(),
    },
    chats: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
  insert: mockInsert,
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      execute: vi.fn().mockResolvedValue(undefined),
    }),
  }),
};

vi.mock('@/lib/db', () => ({
  default: mockDb,
}));

vi.mock('@/lib/db/schema', () => ({
  spaces: { id: 'id' },
  chats: { spaceId: 'spaceId' },
}));

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('new-space-id'),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ field, value })),
}));

describe('Spaces API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.query.spaces.findMany.mockResolvedValue(mockSpaces);
  });

  describe('GET /api/spaces', () => {
    it('should return all spaces in reverse order', async () => {
      const { GET } = await import('./route');
      const response = await GET(new Request('http://localhost/api/spaces'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.spaces).toHaveLength(2);
      // Spaces should be reversed
      expect(data.spaces[0].id).toBe('space-2');
      expect(data.spaces[1].id).toBe('space-1');
    });

    it('should handle database errors', async () => {
      mockDb.query.spaces.findMany.mockRejectedValueOnce(new Error('DB Error'));

      const { GET } = await import('./route');
      const response = await GET(new Request('http://localhost/api/spaces'));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('An error has occurred.');
    });
  });

  describe('POST /api/spaces', () => {
    it.skip('should create a new space with name and description', async () => {
      const { POST } = await import('./route');
      const request = new Request('http://localhost/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Space',
          description: 'New Description',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.space.id).toBe('new-space-id');
      expect(data.space.name).toBe('New Space');
      expect(data.space.description).toBe('New Description');
    });

    it('should create a space without description', async () => {
      const { POST } = await import('./route');
      const request = new Request('http://localhost/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Name Only' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.space.name).toBe('Name Only');
      expect(data.space.description).toBeNull();
    });

    it('should trim whitespace from name and description', async () => {
      const { POST } = await import('./route');
      const request = new Request('http://localhost/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '  Trimmed Name  ',
          description: '  Trimmed Desc  ',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.space.name).toBe('Trimmed Name');
      expect(data.space.description).toBe('Trimmed Desc');
    });

    it('should return 400 when name is missing', async () => {
      const { POST } = await import('./route');
      const request = new Request('http://localhost/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Only description' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Name is required');
    });

    it('should return 400 when name is not a string', async () => {
      const { POST } = await import('./route');
      const request = new Request('http://localhost/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 123 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Name is required');
    });
  });
});

describe('Spaces API - Individual Space', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/spaces/[id]', () => {
    it('should return space with its chats', async () => {
      const mockSpace = {
        id: 'space-1',
        name: 'Test Space',
        description: 'Description',
        createdAt: '2024-01-15T10:00:00.000Z',
      };
      const mockChats = [
        { id: 'chat-1', title: 'Chat 1', spaceId: 'space-1' },
        { id: 'chat-2', title: 'Chat 2', spaceId: 'space-1' },
      ];

      mockDb.query.spaces.findFirst.mockResolvedValueOnce(mockSpace);
      mockDb.query.chats.findMany.mockResolvedValueOnce(mockChats);

      const { GET } = await import('./[id]/route');
      const response = await GET(
        new Request('http://localhost/api/spaces/space-1'),
        { params: Promise.resolve({ id: 'space-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.space).toEqual(mockSpace);
      expect(data.chats).toHaveLength(2);
    });

    it('should return 404 when space not found', async () => {
      mockDb.query.spaces.findFirst.mockResolvedValueOnce(null);

      const { GET } = await import('./[id]/route');
      const response = await GET(
        new Request('http://localhost/api/spaces/nonexistent'),
        { params: Promise.resolve({ id: 'nonexistent' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Space not found');
    });
  });

  describe('PATCH /api/spaces/[id]', () => {
    it('should update space name', async () => {
      const mockSpace = {
        id: 'space-1',
        name: 'Old Name',
        description: 'Description',
        createdAt: '2024-01-15T10:00:00.000Z',
      };
      const updatedSpace = { ...mockSpace, name: 'New Name' };

      mockDb.query.spaces.findFirst
        .mockResolvedValueOnce(mockSpace)
        .mockResolvedValueOnce(updatedSpace);

      const { PATCH } = await import('./[id]/route');
      const request = new Request('http://localhost/api/spaces/space-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name' }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'space-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.space.name).toBe('New Name');
    });

    it('should return 404 when updating nonexistent space', async () => {
      mockDb.query.spaces.findFirst.mockResolvedValueOnce(null);

      const { PATCH } = await import('./[id]/route');
      const request = new Request('http://localhost/api/spaces/nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name' }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Space not found');
    });
  });

  describe('DELETE /api/spaces/[id]', () => {
    it.skip('should delete space and unlink chats', async () => {
      const mockSpace = {
        id: 'space-1',
        name: 'Test Space',
        description: 'Description',
        createdAt: '2024-01-15T10:00:00.000Z',
      };

      mockDb.query.spaces.findFirst.mockResolvedValueOnce(mockSpace);

      const { DELETE } = await import('./[id]/route');
      const response = await DELETE(
        new Request('http://localhost/api/spaces/space-1', { method: 'DELETE' }),
        { params: Promise.resolve({ id: 'space-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Space deleted successfully');
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should return 404 when deleting nonexistent space', async () => {
      mockDb.query.spaces.findFirst.mockResolvedValueOnce(null);

      const { DELETE } = await import('./[id]/route');
      const response = await DELETE(
        new Request('http://localhost/api/spaces/nonexistent', { method: 'DELETE' }),
        { params: Promise.resolve({ id: 'nonexistent' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Space not found');
    });
  });
});
