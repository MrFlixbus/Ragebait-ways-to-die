export interface Settings {
  master: number;
  music: number;
  sfx: number;
  mute: boolean;
  shake: boolean;
  reducedMotion: boolean;
}
export interface Save {
  version: 1;
  record: number;
  settings: Settings;
}
export const defaults: Settings = {
  master: 0.65,
  music: 0.35,
  sfx: 0.7,
  mute: false,
  shake: true,
  reducedMotion: false,
};
const key = 'ragebait-save-v1';
export function parseSave(raw: string | null, reducedMotion = false): Save {
  const result: Save = { version: 1, record: 0, settings: { ...defaults, reducedMotion } };
  try {
    const data = JSON.parse(raw ?? 'null');
    if (!data || data.version !== 1) return result;
    if (Number.isSafeInteger(data.record) && data.record >= 0) result.record = data.record;
    for (const k of ['master', 'music', 'sfx'] as const) {
      const v = data.settings?.[k];
      if (typeof v === 'number' && Number.isFinite(v))
        result.settings[k] = Math.max(0, Math.min(1, v));
    }
    for (const k of ['mute', 'shake', 'reducedMotion'] as const) {
      if (typeof data.settings?.[k] === 'boolean') result.settings[k] = data.settings[k];
    }
  } catch {
    /* Corrupt or older saves safely reset. */
  }
  return result;
}
export function loadSave(): Save {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    return parseSave(localStorage.getItem(key), reduced);
  } catch {
    return parseSave(null, reduced);
  }
}
export function persist(save: Save): void {
  try {
    localStorage.setItem(key, JSON.stringify(save));
  } catch {
    /* Private mode and full storage do not block play. */
  }
}
