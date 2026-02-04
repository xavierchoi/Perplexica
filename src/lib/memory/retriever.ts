import { memoryManager, Memory } from './manager';
import { MemoryType } from '@/lib/db/schema';

export interface RetrievedMemory {
  memory: Memory;
  relevanceScore: number;
}

export interface MemoryContext {
  preferences: Memory[];
  facts: Memory[];
  instructions: Memory[];
}

class MemoryRetriever {
  /**
   * Retrieve relevant memories based on the query
   */
  async retrieve(query: string, limit: number = 10): Promise<RetrievedMemory[]> {
    const allMemories = await memoryManager.getAll(true);

    if (allMemories.length === 0) {
      return [];
    }

    const queryKeywords = this.extractQueryKeywords(query);
    const scoredMemories: RetrievedMemory[] = [];

    for (const memory of allMemories) {
      const score = this.calculateRelevance(queryKeywords, memory);
      if (score > 0) {
        scoredMemories.push({
          memory,
          relevanceScore: score,
        });
      }
    }

    // Sort by relevance score (descending)
    scoredMemories.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return scoredMemories.slice(0, limit);
  }

  /**
   * Get all active memories grouped by type for context injection
   */
  async getMemoryContext(): Promise<MemoryContext> {
    const [preferences, facts, instructions] = await Promise.all([
      memoryManager.getByType('preference', true),
      memoryManager.getByType('fact', true),
      memoryManager.getByType('instruction', true),
    ]);

    return {
      preferences,
      facts,
      instructions,
    };
  }

  /**
   * Format memories for injection into the prompt
   */
  formatMemoriesForPrompt(context: MemoryContext): string {
    const sections: string[] = [];

    if (context.instructions.length > 0) {
      sections.push(
        `<user_instructions>\n${context.instructions.map((m) => `- ${m.content}`).join('\n')}\n</user_instructions>`,
      );
    }

    if (context.preferences.length > 0) {
      sections.push(
        `<user_preferences>\n${context.preferences.map((m) => `- ${m.content}`).join('\n')}\n</user_preferences>`,
      );
    }

    if (context.facts.length > 0) {
      sections.push(
        `<user_facts>\n${context.facts.map((m) => `- ${m.content}`).join('\n')}\n</user_facts>`,
      );
    }

    if (sections.length === 0) {
      return '';
    }

    return `<memory note="The user has provided the following information about themselves. Use this to personalize responses when relevant.">\n${sections.join('\n')}\n</memory>`;
  }

  /**
   * Get formatted memory context for prompt injection
   */
  async getFormattedMemoryContext(): Promise<string> {
    const context = await this.getMemoryContext();
    return this.formatMemoriesForPrompt(context);
  }

  private extractQueryKeywords(query: string): Set<string> {
    const words = query
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2);

    return new Set(words);
  }

  private calculateRelevance(queryKeywords: Set<string>, memory: Memory): number {
    let score = 0;

    // Check keyword matches
    for (const keyword of memory.keywords) {
      if (queryKeywords.has(keyword.toLowerCase())) {
        score += 2;
      }
    }

    // Check content word matches
    const contentWords = memory.content.toLowerCase().split(/\s+/);
    for (const word of contentWords) {
      if (queryKeywords.has(word) && word.length > 2) {
        score += 1;
      }
    }

    // Boost score based on memory type
    // Instructions are always relevant, preferences and facts depend on context
    if (memory.type === 'instruction') {
      score += 1;
    }

    return score;
  }
}

export const memoryRetriever = new MemoryRetriever();
export default MemoryRetriever;
