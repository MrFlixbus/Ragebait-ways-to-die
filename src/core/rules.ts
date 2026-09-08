import type { Difficulty } from './types';
export function difficultyFor(score: number): Difficulty {
  const level = Math.max(0, Math.floor(score / 4));
  return {
    level,
    timeScale: Math.max(0.58, 1 - level * 0.07),
    speed: Math.min(1.65, 1 + level * 0.08),
  };
}
export function nextId(ids: string[], previous: string | undefined, random = Math.random): string {
  const candidates = ids.filter((id) => id !== previous);
  const pool = candidates.length ? candidates : ids;
  if (!pool.length) throw new Error('The scenario registry is empty.');
  return pool[Math.min(pool.length - 1, Math.floor(Math.max(0, random()) * pool.length))];
}
export function recordFor(record: number, score: number): number {
  return Math.max(record, score);
}
