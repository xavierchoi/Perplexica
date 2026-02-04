import { describe, it, expect } from 'vitest';
import formatChatHistoryAsString from './formatHistory';
import { ChatTurnMessage } from '../types';

describe('formatChatHistoryAsString', () => {
  it('should return empty string for empty history', () => {
    const result = formatChatHistoryAsString([]);
    expect(result).toBe('');
  });

  it('should format single user message', () => {
    const history: ChatTurnMessage[] = [
      { role: 'user', content: 'Hello' },
    ];
    const result = formatChatHistoryAsString(history);
    expect(result).toBe('User: Hello');
  });

  it('should format single assistant message', () => {
    const history: ChatTurnMessage[] = [
      { role: 'assistant', content: 'Hi there!' },
    ];
    const result = formatChatHistoryAsString(history);
    expect(result).toBe('AI: Hi there!');
  });

  it('should format multiple messages with newlines', () => {
    const history: ChatTurnMessage[] = [
      { role: 'user', content: 'What is JavaScript?' },
      { role: 'assistant', content: 'JavaScript is a programming language.' },
    ];
    const result = formatChatHistoryAsString(history);
    expect(result).toBe(
      'User: What is JavaScript?\nAI: JavaScript is a programming language.'
    );
  });

  it('should handle conversation with multiple turns', () => {
    const history: ChatTurnMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
      { role: 'user', content: 'How are you?' },
      { role: 'assistant', content: 'I am doing well.' },
    ];
    const result = formatChatHistoryAsString(history);
    const lines = result.split('\n');
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe('User: Hello');
    expect(lines[1]).toBe('AI: Hi!');
    expect(lines[2]).toBe('User: How are you?');
    expect(lines[3]).toBe('AI: I am doing well.');
  });

  it('should handle messages with special characters', () => {
    const history: ChatTurnMessage[] = [
      { role: 'user', content: 'What is 2 + 2?' },
      { role: 'assistant', content: '2 + 2 = 4' },
    ];
    const result = formatChatHistoryAsString(history);
    expect(result).toContain('What is 2 + 2?');
    expect(result).toContain('2 + 2 = 4');
  });

  it('should handle messages with newlines in content', () => {
    const history: ChatTurnMessage[] = [
      { role: 'user', content: 'Line1\nLine2' },
    ];
    const result = formatChatHistoryAsString(history);
    expect(result).toBe('User: Line1\nLine2');
  });

  it('should handle empty message content', () => {
    const history: ChatTurnMessage[] = [
      { role: 'user', content: '' },
    ];
    const result = formatChatHistoryAsString(history);
    expect(result).toBe('User: ');
  });

  it('should handle long messages', () => {
    const longContent = 'A'.repeat(1000);
    const history: ChatTurnMessage[] = [
      { role: 'user', content: longContent },
    ];
    const result = formatChatHistoryAsString(history);
    expect(result).toBe(`User: ${longContent}`);
  });
});
