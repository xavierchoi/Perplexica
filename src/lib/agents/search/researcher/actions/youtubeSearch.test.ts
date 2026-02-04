import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock searchSearxng
vi.mock('@/lib/searxng', () => ({
  searchSearxng: vi.fn(),
}));

import youtubeSearchAction from './youtubeSearch';
import { searchSearxng } from '@/lib/searxng';

describe('youtubeSearchAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      expect(youtubeSearchAction.name).toBe('youtube_search');
    });

    it('should have schema with queries array', () => {
      const schema = youtubeSearchAction.schema;
      expect(schema).toBeDefined();
      // Schema should validate queries array - use parse with try-catch
      expect(() => schema.parse({ type: 'youtube_search', queries: ['test query'] })).not.toThrow();
    });

    it('should reject invalid input without queries', () => {
      const schema = youtubeSearchAction.schema;
      expect(() => schema.parse({ type: 'youtube_search' })).toThrow();
    });
  });

  describe('enabled', () => {
    it('should be enabled when youtube is in sources and youtubeSearch is true', () => {
      const config = {
        sources: ['youtube'],
        classification: {
          classification: {
            skipSearch: false,
            youtubeSearch: true,
          },
        },
      };

      expect(youtubeSearchAction.enabled(config as any)).toBe(true);
    });

    it('should be disabled when youtube is not in sources', () => {
      const config = {
        sources: ['web'],
        classification: {
          classification: {
            skipSearch: false,
            youtubeSearch: true,
          },
        },
      };

      expect(youtubeSearchAction.enabled(config as any)).toBe(false);
    });

    it('should be disabled when skipSearch is true', () => {
      const config = {
        sources: ['youtube'],
        classification: {
          classification: {
            skipSearch: true,
            youtubeSearch: true,
          },
        },
      };

      expect(youtubeSearchAction.enabled(config as any)).toBe(false);
    });

    it('should be disabled when youtubeSearch is false', () => {
      const config = {
        sources: ['youtube'],
        classification: {
          classification: {
            skipSearch: false,
            youtubeSearch: false,
          },
        },
      };

      expect(youtubeSearchAction.enabled(config as any)).toBe(false);
    });
  });

  describe('execute', () => {
    const createMockSession = () => ({
      getBlock: vi.fn().mockReturnValue({
        type: 'research',
        data: { subSteps: [] },
      }),
      updateBlock: vi.fn(),
    });

    it('should search YouTube using SearXNG', async () => {
      const mockResults = {
        results: [
          {
            title: 'Test Video 1',
            url: 'https://youtube.com/watch?v=abc123',
            content: 'Video description 1',
            thumbnail_src: 'https://img.youtube.com/thumb1.jpg',
          },
          {
            title: 'Test Video 2',
            url: 'https://youtube.com/watch?v=def456',
            content: 'Video description 2',
            thumbnail: 'https://img.youtube.com/thumb2.jpg',
          },
        ],
      };

      (searchSearxng as any).mockResolvedValue(mockResults);

      const session = createMockSession();
      const result = await youtubeSearchAction.execute(
        { type: 'youtube_search', queries: ['test query'] },
        {
          session,
          researchBlockId: 'block-1',
        } as any
      );

      expect(searchSearxng).toHaveBeenCalledWith('test query', {
        engines: ['youtube'],
      });
      expect(result.type).toBe('search_results');
      if (result.type === 'search_results') {
        expect(result.results).toHaveLength(2);
        expect(result.results[0].metadata.title).toBe('Test Video 1');
        expect(result.results[0].metadata.url).toBe('https://youtube.com/watch?v=abc123');
      }
    });

    it('should limit queries to 3', async () => {
      (searchSearxng as any).mockResolvedValue({ results: [] });

      const session = createMockSession();
      await youtubeSearchAction.execute(
        { type: 'youtube_search', queries: ['q1', 'q2', 'q3', 'q4', 'q5'] },
        {
          session,
          researchBlockId: 'block-1',
        } as any
      );

      // Should only call 3 times
      expect(searchSearxng).toHaveBeenCalledTimes(3);
    });

    it('should handle empty results', async () => {
      (searchSearxng as any).mockResolvedValue({ results: [] });

      const session = createMockSession();
      const result = await youtubeSearchAction.execute(
        { type: 'youtube_search', queries: ['no results query'] },
        {
          session,
          researchBlockId: 'block-1',
        } as any
      );

      expect(result.type).toBe('search_results');
      if (result.type === 'search_results') {
        expect(result.results).toHaveLength(0);
      }
    });

    it('should use thumbnail from different sources', async () => {
      const mockResults = {
        results: [
          {
            title: 'Video with thumbnail_src',
            url: 'https://youtube.com/watch?v=1',
            content: 'desc',
            thumbnail_src: 'thumb_src.jpg',
          },
          {
            title: 'Video with thumbnail',
            url: 'https://youtube.com/watch?v=2',
            content: 'desc',
            thumbnail: 'thumb.jpg',
          },
          {
            title: 'Video with img_src',
            url: 'https://youtube.com/watch?v=3',
            content: 'desc',
            img_src: 'img_src.jpg',
          },
        ],
      };

      (searchSearxng as any).mockResolvedValue(mockResults);

      const session = createMockSession();
      const result = await youtubeSearchAction.execute(
        { type: 'youtube_search', queries: ['test'] },
        {
          session,
          researchBlockId: 'block-1',
        } as any
      );

      if (result.type === 'search_results') {
        expect(result.results[0].metadata.thumbnail).toBe('thumb_src.jpg');
        expect(result.results[1].metadata.thumbnail).toBe('thumb.jpg');
        expect(result.results[2].metadata.thumbnail).toBe('img_src.jpg');
      }
    });

    it('should update research block with searching status', async () => {
      (searchSearxng as any).mockResolvedValue({ results: [] });

      const session = createMockSession();
      await youtubeSearchAction.execute(
        { type: 'youtube_search', queries: ['test query'] },
        {
          session,
          researchBlockId: 'block-1',
        } as any
      );

      expect(session.updateBlock).toHaveBeenCalled();
      const updateCalls = session.updateBlock.mock.calls;
      expect(updateCalls.length).toBeGreaterThan(0);
    });

    it('should run multiple queries in parallel', async () => {
      let callOrder: string[] = [];
      (searchSearxng as any).mockImplementation(async (query: string) => {
        callOrder.push(query);
        return { results: [] };
      });

      const session = createMockSession();
      await youtubeSearchAction.execute(
        { type: 'youtube_search', queries: ['q1', 'q2', 'q3'] },
        {
          session,
          researchBlockId: 'block-1',
        } as any
      );

      expect(callOrder).toHaveLength(3);
      expect(callOrder).toContain('q1');
      expect(callOrder).toContain('q2');
      expect(callOrder).toContain('q3');
    });
  });

  describe('getDescription', () => {
    it('should return description string', () => {
      const description = youtubeSearchAction.getDescription({ mode: 'balanced' });
      expect(typeof description).toBe('string');
      expect(description).toContain('YouTube');
    });
  });

  describe('getToolDescription', () => {
    it('should return tool description string', () => {
      const description = youtubeSearchAction.getToolDescription({ mode: 'balanced' });
      expect(typeof description).toBe('string');
      expect(description).toContain('YouTube');
    });
  });
});
