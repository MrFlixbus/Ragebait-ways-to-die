import { AudioSystem } from '../audio/audio';
import { box, burst, character, ellipse, line, palette, text } from '../art/draw';
import { Input } from '../input/input';
import { Viewport } from '../input/viewport';
import { scenarios } from '../scenarios/registry';
import { loadSave, persist, type Settings } from '../systems/save';
import { difficultyFor, nextId, recordFor } from './rules';
import type { GameInput, ScenarioDefinition, ScenarioInstance } from './types';

type Screen =
  'menu' | 'settings' | 'intro' | 'playing' | 'result' | 'dead' | 'pause' | 'quit' | 'error';
const menuMusic = [55, 58, 62, 65, 62, 58, 53, 58];
export class Game {
  private canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
  private ctx = this.canvas.getContext('2d')!;
  private ui = document.querySelector<HTMLElement>('#ui')!;
  private save = loadSave();
  private audio = new AudioSystem(this.save.settings);
  private screen: Screen = 'menu';
  private previousScreen: Screen = 'playing';
  private settingsBack: Screen = 'menu';
  private instance?: ScenarioInstance;
  private definition?: ScenarioDefinition;
  private previousId?: string;
  private score = 0;
  private initialRecord = 0;
  private remaining = 0;
  private duration = 0;
  private phase = 0;
  private time = 0;
  private last = 0;
  private success = false;
  private message = '';
  private frame = 0;
  private debug = new URLSearchParams(location.search).get('debug') === '1';
  private forcedId = new URLSearchParams(location.search).get('scenario') ?? '';
  private lastSeconds = -1;
  constructor() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = 960 * ratio;
    this.canvas.height = 540 * ratio;
    this.ctx.scale(ratio, ratio);
    const viewport = new Viewport(document.querySelector('#game')!);
    new Input(this.canvas, viewport, (event) => this.input(event));
    this.ui.addEventListener('click', (e) => {
      const button = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
      if (!button) return;
      this.audio.unlock();
      this.audio.effect('tap');
      this.action(button.dataset.action!);
    });
    this.ui.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      const key = input.dataset.setting as keyof Settings | undefined;
      if (!key) return;
      if (key === 'master' || key === 'music' || key === 'sfx') {
        this.save.settings[key] = Number(input.value) / 100;
        input.nextElementSibling!.textContent = `${input.value}%`;
      } else this.save.settings[key] = input.checked;
      this.applySettings();
    });
    this.ui.addEventListener('change', (e) => {
      if ((e.target as HTMLElement).id === 'scenario-select')
        this.forcedId = (e.target as HTMLSelectElement).value;
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.screen === 'settings') this.action('back');
        else if (this.screen === 'pause') this.action('resume');
        else this.pause();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
        this.audio.suspend();
      } else this.audio.resume();
    });
    window.addEventListener('blur', () => this.pause());
    this.applySettings();
    this.renderUI();
    this.frame = requestAnimationFrame(this.tick);
    window.addEventListener('pagehide', () => {
      cancelAnimationFrame(this.frame);
      this.dispose();
      this.audio.stop();
    });
  }
  private applySettings(): void {
    persist(this.save);
    this.audio.apply(this.save.settings);
    document.body.classList.toggle('reduced-motion', this.save.settings.reducedMotion);
  }
  private dispose(): void {
    try {
      this.instance?.destroy();
    } finally {
      this.instance = undefined;
      this.audio.stop();
    }
  }
  private setScreen(screen: Screen): void {
    this.screen = screen;
    document.body.classList.toggle('playing', screen === 'playing');
    this.renderUI();
  }
  private action(action: string): void {
    if (action === 'start') this.start();
    if (action === 'menu') {
      this.dispose();
      this.audio.playMusic(menuMusic);
      this.setScreen('menu');
    }
    if (action === 'settings') {
      this.settingsBack = this.screen;
      this.setScreen('settings');
    }
    if (action === 'back') this.setScreen(this.settingsBack);
    if (action === 'quit') this.setScreen('quit');
    if (action === 'pause') this.pause();
    if (action === 'resume' && this.screen === 'pause') {
      this.audio.resume();
      this.setScreen(this.previousScreen);
    }
    if (action === 'fullscreen') void this.fullscreen();
    if (action === 'debug-restart') this.next(this.definition?.id);
    if (action === 'debug-skip') this.next();
    if (action === 'mute') {
      this.save.settings.mute = !this.save.settings.mute;
      this.applySettings();
      this.renderUI();
    }
  }
  private async fullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        await document.documentElement.requestFullscreen();
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (type: string) => Promise<void>;
        };
        await orientation.lock?.('landscape').catch(() => {});
      }
      const status = this.ui.querySelector('#fullscreen-status');
      if (status)
        status.textContent = document.fullscreenElement ? 'Fullscreen on' : 'Fullscreen off';
    } catch {
      const status = this.ui.querySelector('#fullscreen-status');
      if (status) status.textContent = 'Not supported here. The game still fits your screen.';
    }
  }
  private pause(): void {
    if (['playing', 'intro', 'result'].includes(this.screen)) {
      this.previousScreen = this.screen;
      this.audio.suspend();
      this.setScreen('pause');
    }
  }
  private start(): void {
    (document.activeElement as HTMLElement)?.blur();
    this.score = 0;
    this.initialRecord = this.save.record;
    this.previousId = undefined;
    this.next();
  }
  private next(id?: string): void {
    this.dispose();
    const selected =
      id ||
      this.forcedId ||
      nextId(
        scenarios.map((s) => s.id),
        this.previousId,
      );
    this.definition = scenarios.find((s) => s.id === selected) ?? scenarios[0];
    this.previousId = this.definition.id;
    this.phase = 0;
    this.success = false;
    this.message = '';
    this.time = 0;
    this.lastSeconds = -1;
    this.duration = this.definition.duration * difficultyFor(this.score).timeScale;
    this.remaining = this.duration;
    this.setScreen('intro');
  }
  private launch(): void {
    try {
      const settings = this.save.settings;
      this.instance = this.definition!.create({
        difficulty: difficultyFor(this.score),
        get reducedMotion() {
          return settings.reducedMotion;
        },
        sound: this.audio.effect,
        finish: (s, m) => this.finish(s, m),
      });
      this.audio.playMusic(this.definition!.music);
      this.setScreen('playing');
    } catch (e) {
      this.handleError(e);
    }
  }
  private finish(success: boolean, message: string): void {
    if (this.screen !== 'playing') return;
    this.success = success;
    this.message = message;
    this.phase = 0;
    if (success) {
      this.score++;
      this.save.record = recordFor(this.save.record, this.score);
      persist(this.save);
    }
    this.audio.stop();
    this.audio.effect(success ? 'good' : 'bad');
    this.setScreen('result');
  }
  private input(e: GameInput): void {
    if (this.screen !== 'playing' && !(e.type === 'up' || (e.type === 'action' && !e.pressed)))
      return;
    if (e.type === 'action' && e.action === 'cancel') return;
    try {
      this.instance?.input(e);
    } catch (error) {
      this.handleError(error);
    }
  }
  private handleError(error: unknown): void {
    console.error('Scenario failed:', this.definition?.id, error);
    this.dispose();
    this.setScreen('error');
  }
  private tick = (now: number): void => {
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 0;
    this.last = now;
    const active = !['pause', 'settings'].includes(this.screen);
    if (active) this.time += dt;
    if (this.screen === 'intro') {
      this.phase += dt;
      if (this.phase > 1.1) this.launch();
    } else if (this.screen === 'playing') {
      this.remaining = Math.max(0, this.remaining - dt);
      try {
        this.instance?.update(dt);
      } catch (error) {
        this.handleError(error);
      }
      if (this.remaining <= 0) this.finish(false, this.definition!.timeout);
      const timer = this.ui.querySelector<HTMLElement>('.timer-fill');
      if (timer) timer.style.transform = `scaleX(${this.remaining / this.duration})`;
      const sec = Math.ceil(this.remaining);
      if (sec !== this.lastSeconds) {
        this.lastSeconds = sec;
        const label = this.ui.querySelector('#seconds');
        if (label) label.textContent = `${sec}s`;
      }
    } else if (this.screen === 'result') {
      this.phase += dt;
      try {
        this.instance?.update(dt);
      } catch (error) {
        this.handleError(error);
      }
      if (this.phase > 1.35) {
        if (this.success) this.next();
        else {
          this.dispose();
          this.setScreen('dead');
        }
      }
    }
    try {
      this.draw();
    } catch (error) {
      this.handleError(error);
    }
    this.frame = requestAnimationFrame(this.tick);
  };
  private draw(): void {
    const c = this.ctx;
    c.save();
    c.clearRect(0, 0, 960, 540);
    if (this.instance && ['playing', 'result', 'pause'].includes(this.screen)) {
      if (
        this.screen === 'result' &&
        !this.success &&
        this.phase < 0.3 &&
        this.save.settings.shake &&
        !this.save.settings.reducedMotion
      )
        c.translate(Math.sin(this.phase * 120) * 6, 0);
      this.instance.draw(c, this.save.settings.reducedMotion ? 0 : this.time);
      if (this.screen === 'result' && this.success && !this.save.settings.reducedMotion)
        burst(c, 480, 280, this.phase / 1.35);
    } else {
      c.fillStyle = palette.ink;
      c.fillRect(0, 0, 960, 540);
      const dead = this.screen === 'dead';
      for (let y = 0; y < 540; y += 26)
        for (let x = 0; x < 960; x += 26) ellipse(c, x, y, 1, 1, '#ffffff12');
      c.save();
      c.translate(715, 278);
      c.rotate(this.save.settings.reducedMotion ? -0.12 : Math.sin(this.time * 0.35) * 0.06 - 0.12);
      c.fillStyle = dead ? '#f995c5' : '#d5fa43';
      c.beginPath();
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2,
          r = i % 2 ? 162 : 198;
        if (i === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.closePath();
      c.fill();
      ellipse(c, 9, 139, 103, 20, '#20212530');
      character(
        c,
        0,
        14,
        1.55,
        dead ? 'dead' : 'panic',
        this.save.settings.reducedMotion ? 0 : this.time,
      );
      c.restore();
      c.save();
      c.translate(581, 123);
      c.rotate(-0.2);
      box(c, -30, -30, 60, 60, '#fff9e9', 4);
      text(c, '!', 0, 0, 43);
      c.restore();
      c.save();
      c.translate(861, 410);
      c.rotate(0.16);
      box(c, -44, -24, 88, 48, '#f995c5', 4);
      text(c, 'RIP?', 0, 0, 25);
      c.restore();
      line(c, [884, 100, 889, 81, 906, 78], '#f995c5', 5);
    }
    c.restore();
  }
  private debugUI(): string {
    return this.debug
      ? `<div class="debug"><span>DEV · LEVEL ${difficultyFor(this.score).level}</span><select aria-label="Debug scenario" id="scenario-select"><option value="">Random</option>${scenarios.map((s) => `<option value="${s.id}" ${this.forcedId === s.id ? 'selected' : ''}>${s.title}</option>`).join('')}</select><button data-action="debug-restart">Restart</button><button data-action="debug-skip">Next</button></div>`
      : '';
  }
  private renderUI(): void {
    const button = (label: string, action: string, cls = '') =>
      `<button class="${cls}" data-action="${action}">${label}</button>`;
    const footer = `<footer><span>${scenarios.length} BAD IDEAS. ZERO SURVIVAL INSTINCT.</span><span>ORIGINAL RECIPE · V1.0</span></footer>`;
    const brand = `<div class="eyebrow"><span class="dot"></span> THE BAD DECISION ARCADE</div><h1><span>RAGEBAIT</span><br>WAYS TO <em>DIE.</em></h1>`;
    let content = '';
    if (this.screen === 'menu')
      content = `<div class="menu">${brand}<p class="tagline">Think fast. Regret faster.</p><div class="menu-actions">${button('START A BAD IDEA <span>↗</span>', 'start', 'primary')}<div class="small-actions">${button('SETTINGS', 'settings')}${button('QUIT ↗', 'quit')}</div></div><div class="record"><span>PERSONAL BEST</span><strong>${String(this.save.record).padStart(2, '0')}</strong><small>SURVIVED</small></div></div><div class="hero-label">MEET THE TEMP.<br><span>Very replaceable.</span></div>${footer}`;
    if (this.screen === 'settings') {
      const s = this.save.settings;
      content = `<section class="panel settings"><div class="eyebrow">CONTROL THE CHAOS</div><h2>SETTINGS<span>.</span></h2><div class="settings-grid"><div>${(['master', 'music', 'sfx'] as const).map((key) => `<label class="slider-label"><span>${key === 'sfx' ? 'Sound effects' : key === 'master' ? 'Master volume' : 'Music volume'}</span><input aria-label="${key} volume" data-setting="${key}" type="range" min="0" max="100" value="${Math.round(s[key] * 100)}"><output>${Math.round(s[key] * 100)}%</output></label>`).join('')}</div><div>${(['mute', 'shake', 'reducedMotion'] as const).map((key) => `<label class="toggle-label">${key === 'mute' ? 'Mute everything' : key === 'shake' ? 'Screen shake' : 'Reduced motion'}<input type="checkbox" data-setting="${key}" ${s[key] ? 'checked' : ''}><span class="switch"></span></label>`).join('')}${button('TOGGLE FULLSCREEN ↗', 'fullscreen', 'full-button')}<p id="fullscreen-status">${document.fullscreenEnabled ? 'Available in supported browsers.' : 'Fullscreen is unavailable in this browser.'}</p></div></div>${button('← BACK', 'back', 'primary back')}</section>`;
    }
    if (this.screen === 'intro')
      content = `<section class="intro" style="--accent:${this.definition!.color}"><div class="eyebrow">BAD IDEA #${String(this.score + 1).padStart(2, '0')}</div><h2>${this.definition!.title}</h2><p>${this.definition!.command}</p><div class="instruction">${this.definition!.hint}</div></section>`;
    if (this.screen === 'playing' || this.screen === 'result')
      content = `<header class="hud"><span class="stage">${String(this.score + (this.screen === 'result' && this.success ? 0 : 1)).padStart(2, '0')} <b>${this.definition!.title}</b></span><span class="survived">${this.score} SURVIVED</span>${button('Ⅱ PAUSE', 'pause', 'pause-button')}</header><div class="timer"><div class="timer-fill"></div></div><div class="play-hint">${this.definition!.hint}<strong id="seconds">${Math.ceil(this.remaining)}s</strong></div>${this.screen === 'result' ? `<div class="result ${this.success ? 'win' : 'lose'}"><strong>${this.success ? 'SOMEHOW, ALIVE.' : 'WELL. THAT HAPPENED.'}</strong></div>` : ''}`;
    if (this.screen === 'dead')
      content = `<section class="menu death"><div class="eyebrow">INCIDENT REPORT #${String(this.score + 1).padStart(3, '0')}</div><h1>YOU HAD<br><em>ONE JOB.</em></h1><p class="death-message">${this.message}</p><div class="scores"><div><span>SURVIVED</span><strong>${String(this.score).padStart(2, '0')}</strong></div><div><span>${this.score > this.initialRecord ? 'NEW RECORD!' : 'PERSONAL BEST'}</span><strong>${String(this.save.record).padStart(2, '0')}</strong></div></div><div class="death-actions">${button('TRY ANOTHER BAD IDEA ↗', 'start', 'primary')}${button('← MAIN MENU', 'menu')}</div></section>${footer}`;
    if (this.screen === 'pause')
      content = `<section class="modal"><div class="eyebrow">A RARE GOOD DECISION</div><h2>TAKE A BREATH.</h2><p>The nonsense can wait.</p>${button('BACK TO THE CHAOS ↗', 'resume', 'primary')}<div class="small-actions">${button('SETTINGS', 'settings')}${button('MAIN MENU', 'menu')}</div></section>`;
    if (this.screen === 'quit')
      content = `<section class="modal"><div class="eyebrow">RESIGNATION ACCEPTED</div><h2>YOU SURVIVED<br>THE MENU.</h2><p>You may now close this tab.<br>We cannot legally eat your cursor.</p>${button('ACTUALLY, ONE MORE ↗', 'menu', 'primary')}</section>`;
    if (this.screen === 'error')
      content = `<section class="modal"><h2>THE GAME DIED.</h2><p>For once, this one is on us. Your record is safe.</p>${button('BACK TO MENU', 'menu', 'primary')}</section>`;
    this.ui.innerHTML = content + this.debugUI();
    if (['settings', 'pause', 'dead', 'quit', 'error'].includes(this.screen))
      this.ui.querySelector<HTMLElement>('button, input')?.focus({ preventScroll: true });
  }
}
