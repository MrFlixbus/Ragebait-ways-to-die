import { paperwork } from './paperwork';
import { gym } from './gym';
import { escalator } from './escalator';
import { cookies } from './cookies';
import { elevator } from './elevator';
import { crossing } from './crossing';
import { defuse } from './defuse';
import type { ScenarioDefinition } from '../core/types';
export const scenarios: ScenarioDefinition[] = [
  paperwork,
  gym,
  escalator,
  cookies,
  elevator,
  crossing,
  defuse,
];
if (new Set(scenarios.map((s) => s.id)).size !== scenarios.length)
  throw new Error('Duplicate scenario IDs');
