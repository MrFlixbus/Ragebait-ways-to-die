import { describe, expect, it, vi } from 'vitest';
import { difficultyFor, nextId, recordFor } from '../src/core/rules';
import { parseSave } from '../src/systems/save';
import { layoutFor, logicalPoint } from '../src/input/viewport';
import { scenarios } from '../src/scenarios/registry';
import type { ScenarioContext } from '../src/core/types';
const context = (level = 0): ScenarioContext => ({
  difficulty: difficultyFor(level * 4),
  reducedMotion: true,
  sound: vi.fn(),
  finish: vi.fn(),
});
describe('run rules', () => {
  it('never immediately repeats and supports a single scenario', () => {
    for (const previous of scenarios.map((s) => s.id))
      for (const rng of [0, 0.2, 0.7, 0.999])
        expect(
          nextId(
            scenarios.map((s) => s.id),
            previous,
            () => rng,
          ),
        ).not.toBe(previous);
    expect(nextId(['only'], 'only')).toBe('only');
    expect(() => nextId([], '')).toThrow();
  });
  it('bounds difficulty while retaining playable timers', () => {
    expect(difficultyFor(0).timeScale).toBe(1);
    expect(difficultyFor(1000)).toEqual({ level: 250, timeScale: 0.58, speed: 1.65 });
    expect(difficultyFor(12).timeScale).toBeLessThan(difficultyFor(4).timeScale);
  });
  it('records only the highest survival score', () => {
    expect(recordFor(8, 4)).toBe(8);
    expect(recordFor(8, 9)).toBe(9);
  });
});
describe('save resilience', () => {
  it.each([null, 'broken', '{}', 'null', '{"version":99}'])('survives invalid data %s', (raw) => {
    expect(parseSave(raw).record).toBe(0);
  });
  it('clamps settings and rejects wrong types', () => {
    const save = parseSave(
      JSON.stringify({
        version: 1,
        record: -1,
        settings: { master: 99, music: -2, mute: 'yes', reducedMotion: true },
      }),
    );
    expect(save.settings.master).toBe(1);
    expect(save.settings.music).toBe(0);
    expect(save.settings.mute).toBe(false);
    expect(save.settings.reducedMotion).toBe(true);
    expect(save.record).toBe(0);
  });
  it('roundtrips valid values and system motion preference', () => {
    const s = parseSave(null, true);
    s.record = 42;
    expect(parseSave(JSON.stringify(s))).toEqual(s);
  });
});
describe('landscape and rotated portrait coordinates', () => {
  it.each([
    [1920, 1080, false],
    [844, 390, true],
    [390, 844, true],
    [320, 568, true],
    [768, 1024, false],
  ])('roundtrips every interaction region at %sx%s', (w, h, rotate) => {
    const l = layoutFor(w as number, h as number, rotate as boolean);
    expect((l.rotated ? 540 : 960) * l.scale).toBeLessThanOrEqual((w as number) + 0.001);
    expect((l.rotated ? 960 : 540) * l.scale).toBeLessThanOrEqual((h as number) + 0.001);
    for (const [x, y] of [
      [0, 0],
      [960, 540],
      [252, 316],
      [696, 300],
      [478, 273],
      [350, 470],
    ]) {
      const clientX = l.left + (l.rotated ? 540 - y : x) * l.scale;
      const clientY = l.top + (l.rotated ? x : y) * l.scale;
      const actual = logicalPoint(clientX, clientY, l);
      expect(actual.x).toBeCloseTo(x);
      expect(actual.y).toBeCloseTo(y);
    }
  });
});
describe('scenario contracts and actual solutions', () => {
  it('registers seven unique, complete modules', () => {
    expect(scenarios).toHaveLength(7);
    expect(new Set(scenarios.map((s) => s.id)).size).toBe(7);
    for (const s of scenarios) {
      expect(s.duration).toBeGreaterThanOrEqual(7);
      expect(s.music.length).toBeGreaterThan(3);
      expect(s.timeout).toBeTruthy();
    }
  });
  it('supports drag and keyboard resignation delivery', () => {
    for (const keyboard of [false, true]) {
      const c = context(),
        s = scenarios[0].create(c);
      if (keyboard) {
        for (let i = 0; i < 4; i++) s.input({ type: 'action', action: 'right', pressed: true });
        s.input({ type: 'action', action: 'confirm', pressed: true });
      } else {
        s.input({ type: 'down', x: 252, y: 316 });
        s.input({ type: 'move', x: 696, y: 300 });
        s.input({ type: 'up', x: 696, y: 300 });
      }
      expect(c.finish).toHaveBeenCalledWith(true, expect.any(String));
      s.destroy();
    }
  });
  it('kills the tempting print button', () => {
    const c = context(),
      s = scenarios[0].create(c);
    s.input({ type: 'down', x: 700, y: 450 });
    expect(c.finish).toHaveBeenCalledWith(false, expect.any(String));
  });
  it.each([0, 10])('retains a reachable gym timing window at level %s', (level) => {
    const c = context(level),
      s = scenarios[1].create(c);
    s.update(2 / c.difficulty.speed);
    s.input({ type: 'action', action: 'confirm', pressed: true });
    expect(c.finish).toHaveBeenCalledWith(true, expect.any(String));
  });
  it('punishes ringing during work', () => {
    const c = context(),
      s = scenarios[1].create(c);
    s.input({ type: 'action', action: 'confirm', pressed: true });
    expect(c.finish).toHaveBeenCalledWith(false, expect.any(String));
  });
  it.each([0, 10])('allows escaping against the belt at level %s', (level) => {
    const c = context(level),
      s = scenarios[2].create(c);
    s.input({ type: 'action', action: 'left', pressed: true });
    for (let i = 0; i < 180; i++) s.update(1 / 60);
    expect(c.finish).toHaveBeenCalledWith(true, expect.any(String));
  });
  it('kills the rightward promotion and stops on release', () => {
    const c = context(),
      s = scenarios[2].create(c);
    s.input({ type: 'down', x: 600, y: 460 });
    s.update(0.1);
    s.input({ type: 'up', x: 600, y: 460 });
    s.update(1);
    expect(c.finish).not.toHaveBeenCalled();
    s.input({ type: 'action', action: 'right', pressed: true });
    s.update(2);
    expect(c.finish).toHaveBeenCalledWith(false, expect.any(String));
  });
  it('eats cookies with either pointer or keyboard and settles once', () => {
    for (const keyboard of [false, true]) {
      const c = context(),
        s = scenarios[3].create(c);
      for (let i = 0; i < 10; i++)
        s.input(
          keyboard
            ? { type: 'action', action: 'confirm', pressed: true }
            : { type: 'down', x: 478, y: 273 },
        );
      expect(c.finish).toHaveBeenCalledTimes(1);
      expect(c.finish).toHaveBeenCalledWith(true, expect.any(String));
      s.destroy();
    }
  });
  it('punishes accepting all', () => {
    const c = context(),
      s = scenarios[3].create(c);
    s.input({ type: 'down', x: 680, y: 408 });
    expect(c.finish).toHaveBeenCalledWith(false, expect.any(String));
  });
});
