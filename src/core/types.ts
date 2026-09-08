export type Action = 'left' | 'right' | 'up' | 'down' | 'confirm' | 'cancel';
export type GameInput =
  | { type: 'down' | 'move' | 'up'; x: number; y: number }
  | { type: 'action'; action: Action; pressed: boolean };
export interface Difficulty {
  level: number;
  timeScale: number;
  speed: number;
}
export interface ScenarioContext {
  difficulty: Difficulty;
  reducedMotion: boolean;
  sound: (effect: 'tap' | 'bad' | 'good' | 'step') => void;
  finish: (success: boolean, message: string) => void;
}
export interface ScenarioInstance {
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D, time: number): void;
  input(event: GameInput): void;
  destroy(): void;
}
export interface ScenarioDefinition {
  id: string;
  title: string;
  command: string;
  hint: string;
  duration: number;
  color: string;
  music: number[];
  timeout: string;
  create(context: ScenarioContext): ScenarioInstance;
}
