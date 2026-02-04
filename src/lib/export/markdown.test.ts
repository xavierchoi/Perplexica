import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock downloadFile before importing the module
vi.mock('./utils', () => ({
  downloadFile: vi.fn(),
}));

import { exportAsMarkdown } from './markdown';
import { downloadFile } from './utils';
import { Section } from '@/lib/hooks/useChat';

describe('exportAsMarkdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockSection = (overrides: Partial<Section> = {}): Section => ({
    message: {
      messageId: 'msg-1',
      query: 'Test question',
      createdAt: '2024-01-15T10:00:00.000Z',
      responseBlocks: [],
      status: 'completed',
    },
    widgets: [],
    parsedTextBlocks: [],
    speechMessage: '',
    thinkingEnded: true,
    ...overrides,
  });

  it('should export basic chat to markdown', () => {
    const sections: Section[] = [
      createMockSection({
        message: {
          messageId: 'msg-1',
          query: 'What is JavaScript?',
          createdAt: '2024-01-15T10:00:00.000Z',
          responseBlocks: [
            { type: 'text', data: 'JavaScript is a programming language.' },
          ],
          status: 'completed',
        },
        parsedTextBlocks: ['JavaScript is a programming language.'],
      }),
    ];

    exportAsMarkdown(sections, 'Test Chat');

    expect(downloadFile).toHaveBeenCalledTimes(1);
    const [filename, content, mimeType] = (downloadFile as any).mock.calls[0];

    expect(filename).toBe('Test Chat.md');
    expect(mimeType).toBe('text/markdown');
    expect(content).toContain('Chat Export: Test Chat');
    expect(content).toContain('User');
    expect(content).toContain('What is JavaScript?');
    expect(content).toContain('Assistant');
    expect(content).toContain('JavaScript is a programming language.');
  });

  it('should include citations when sources are present', () => {
    const sections: Section[] = [
      createMockSection({
        message: {
          messageId: 'msg-1',
          query: 'Test query',
          createdAt: '2024-01-15T10:00:00.000Z',
          responseBlocks: [
            { type: 'text', data: 'Answer with citations' },
            {
              type: 'source',
              data: [
                { metadata: { url: 'https://example.com/page1' } },
                { metadata: { url: 'https://example.com/page2' } },
              ],
            },
          ],
          status: 'completed',
        },
      }),
    ];

    exportAsMarkdown(sections, 'Citations Test');

    const [, content] = (downloadFile as any).mock.calls[0];
    expect(content).toContain('**Citations:**');
    expect(content).toContain('[1] [https://example.com/page1]');
    expect(content).toContain('[2] [https://example.com/page2]');
  });

  it('should handle multiple sections', () => {
    const sections: Section[] = [
      createMockSection({
        message: {
          messageId: 'msg-1',
          query: 'First question',
          createdAt: '2024-01-15T10:00:00.000Z',
          responseBlocks: [{ type: 'text', data: 'First answer' }],
          status: 'completed',
        },
      }),
      createMockSection({
        message: {
          messageId: 'msg-2',
          query: 'Second question',
          createdAt: '2024-01-15T10:05:00.000Z',
          responseBlocks: [{ type: 'text', data: 'Second answer' }],
          status: 'completed',
        },
      }),
    ];

    exportAsMarkdown(sections, 'Multi Section');

    const [, content] = (downloadFile as any).mock.calls[0];
    expect(content).toContain('First question');
    expect(content).toContain('First answer');
    expect(content).toContain('Second question');
    expect(content).toContain('Second answer');
  });

  it('should handle empty response blocks', () => {
    const sections: Section[] = [
      createMockSection({
        message: {
          messageId: 'msg-1',
          query: 'Question without answer',
          createdAt: '2024-01-15T10:00:00.000Z',
          responseBlocks: [],
          status: 'completed',
        },
      }),
    ];

    exportAsMarkdown(sections, 'Empty Response');

    expect(downloadFile).toHaveBeenCalledTimes(1);
    const [, content] = (downloadFile as any).mock.calls[0];
    expect(content).toContain('Question without answer');
    expect(content).not.toContain('**Assistant**');
  });

  it('should use fallback filename when title is empty', () => {
    const sections: Section[] = [createMockSection()];

    exportAsMarkdown(sections, '');

    const [filename] = (downloadFile as any).mock.calls[0];
    expect(filename).toBe('chat.md');
  });

  it('should handle multiline queries', () => {
    const sections: Section[] = [
      createMockSection({
        message: {
          messageId: 'msg-1',
          query: 'Line 1\nLine 2\nLine 3',
          createdAt: '2024-01-15T10:00:00.000Z',
          responseBlocks: [],
          status: 'completed',
        },
      }),
    ];

    exportAsMarkdown(sections, 'Multiline');

    const [, content] = (downloadFile as any).mock.calls[0];
    // Should be quoted with > for each line
    expect(content).toContain('> Line 1');
    expect(content).toContain('> Line 2');
    expect(content).toContain('> Line 3');
  });
});
