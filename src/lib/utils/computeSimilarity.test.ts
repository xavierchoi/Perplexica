import { describe, it, expect } from 'vitest';
import computeSimilarity from './computeSimilarity';

describe('computeSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const vec = [1, 2, 3, 4, 5];
    const similarity = computeSimilarity(vec, vec);
    expect(similarity).toBeCloseTo(1, 5);
  });

  it('should return -1 for opposite vectors', () => {
    const vec1 = [1, 0, 0];
    const vec2 = [-1, 0, 0];
    const similarity = computeSimilarity(vec1, vec2);
    expect(similarity).toBeCloseTo(-1, 5);
  });

  it('should return 0 for orthogonal vectors', () => {
    const vec1 = [1, 0, 0];
    const vec2 = [0, 1, 0];
    const similarity = computeSimilarity(vec1, vec2);
    expect(similarity).toBeCloseTo(0, 5);
  });

  it('should throw error for vectors of different lengths', () => {
    const vec1 = [1, 2, 3];
    const vec2 = [1, 2];
    expect(() => computeSimilarity(vec1, vec2)).toThrow(
      'Vectors must be of the same length'
    );
  });

  it('should return 0 for zero vectors', () => {
    const vec1 = [0, 0, 0];
    const vec2 = [1, 2, 3];
    const similarity = computeSimilarity(vec1, vec2);
    expect(similarity).toBe(0);
  });

  it('should return 0 when both vectors are zero', () => {
    const vec1 = [0, 0, 0];
    const vec2 = [0, 0, 0];
    const similarity = computeSimilarity(vec1, vec2);
    expect(similarity).toBe(0);
  });

  it('should handle large vectors', () => {
    const size = 1000;
    const vec1 = Array.from({ length: size }, () => Math.random());
    const vec2 = [...vec1];
    const similarity = computeSimilarity(vec1, vec2);
    expect(similarity).toBeCloseTo(1, 5);
  });

  it('should calculate correct similarity for known values', () => {
    // Known cosine similarity example
    const vec1 = [1, 2, 3];
    const vec2 = [4, 5, 6];
    // cos(theta) = (1*4 + 2*5 + 3*6) / (sqrt(1+4+9) * sqrt(16+25+36))
    // = 32 / (sqrt(14) * sqrt(77))
    // = 32 / 32.833 = 0.9746
    const similarity = computeSimilarity(vec1, vec2);
    expect(similarity).toBeCloseTo(0.9746, 3);
  });

  it('should handle negative values', () => {
    const vec1 = [-1, -2, -3];
    const vec2 = [-1, -2, -3];
    const similarity = computeSimilarity(vec1, vec2);
    expect(similarity).toBeCloseTo(1, 5);
  });

  it('should handle mixed positive and negative values', () => {
    const vec1 = [1, -1, 1];
    const vec2 = [-1, 1, -1];
    const similarity = computeSimilarity(vec1, vec2);
    expect(similarity).toBeCloseTo(-1, 5);
  });
});
