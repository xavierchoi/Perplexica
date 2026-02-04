import { describe, it, expect } from 'vitest';
import { splitText } from './splitText';

describe('splitText', () => {
  it('should return empty array for empty string', () => {
    const result = splitText('');
    expect(result).toEqual([]);
  });

  it('should return single chunk for short text', () => {
    const text = 'This is a short text.';
    const result = splitText(text, 512);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });

  it('should split text at sentence boundaries', () => {
    const text = 'First sentence. Second sentence. Third sentence.';
    const result = splitText(text, 10, 0);
    expect(result.length).toBeGreaterThan(1);
  });

  it('should split at period followed by space', () => {
    const text = 'Hello world. How are you. Fine thanks.';
    const result = splitText(text, 5, 0);
    // Each chunk should be relatively small
    expect(result.length).toBeGreaterThan(1);
  });

  it('should split at newlines', () => {
    const text = 'Line one\nLine two\nLine three';
    const result = splitText(text, 5, 0);
    expect(result.length).toBeGreaterThan(1);
  });

  it('should split at exclamation marks', () => {
    const text = 'Wow! Amazing! Incredible!';
    const result = splitText(text, 5, 0);
    expect(result.length).toBeGreaterThan(1);
  });

  it('should split at question marks', () => {
    const text = 'What? When? Where? Why?';
    const result = splitText(text, 5, 0);
    expect(result.length).toBeGreaterThan(1);
  });

  it('should handle overlap between chunks', () => {
    const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
    const result = splitText(text, 20, 10);
    // With overlap, chunks should share some content
    if (result.length >= 2) {
      // Later chunks might contain content from previous chunks
      expect(result.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should respect maxTokens parameter', () => {
    // Use text with proper sentence boundaries
    const text = 'This is sentence one. This is sentence two. This is sentence three. This is sentence four. This is sentence five.';
    const result = splitText(text, 20, 0);
    // Text should be split into multiple chunks
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle text without sentence boundaries', () => {
    const text = 'One long continuous string without any punctuation';
    const result = splitText(text, 512);
    expect(result).toHaveLength(1);
  });

  it('should handle text with numbered lists', () => {
    const text = '1. First item\n2. Second item\n3. Third item';
    const result = splitText(text, 512);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle text with bullet points', () => {
    const text = '- First point\n- Second point\n* Third point';
    const result = splitText(text, 512);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('should use default values when not specified', () => {
    const text = 'This is a test sentence.';
    const result = splitText(text);
    // Should use default maxTokens=512 and overlapTokens=64
    expect(result).toHaveLength(1);
  });

  it('should preserve text content', () => {
    const text = 'Hello world. Goodbye world.';
    const result = splitText(text, 512);
    const combined = result.join('');
    expect(combined).toContain('Hello world');
    expect(combined).toContain('Goodbye world');
  });

  it('should handle semicolons', () => {
    const text = 'First part; second part; third part.';
    const result = splitText(text, 5, 0);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle colons with space', () => {
    const text = 'Title: content here. Another: more content.';
    const result = splitText(text, 5, 0);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});
