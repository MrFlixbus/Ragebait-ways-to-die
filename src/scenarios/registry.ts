import { paperwork } from './paperwork';
import { gym } from './gym';
import { escalator } from './escalator';
import { cookies } from './cookies';
import type { ScenarioDefinition } from '../core/types';
export const scenarios: ScenarioDefinition[] = [paperwork, gym, escalator, cookies];
if (new Set(scenarios.map((s) => s.id)).size !== scenarios.length)
  throw new Error('Duplicate scenario IDs');
