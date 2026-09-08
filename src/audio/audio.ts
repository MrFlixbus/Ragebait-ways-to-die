import type { Settings } from '../systems/save';
export class AudioSystem {
  private context?: AudioContext;
  private master?: GainNode;
  private musicBus?: GainNode;
  private sfxBus?: GainNode;
  private loop?: ReturnType<typeof setInterval>;
  private voices = new Set<OscillatorNode>();
  private melody = [55, 58, 62, 65, 62, 58, 53, 58];
  constructor(private settings: Settings) {}
  unlock(): void {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.connect(this.context.destination);
      this.musicBus = this.context.createGain();
      this.musicBus.connect(this.master);
      this.sfxBus = this.context.createGain();
      this.sfxBus.connect(this.master);
      this.apply(this.settings);
      this.playMusic(this.melody);
    }
    void this.context.resume().catch(() => {});
  }
  apply(settings: Settings): void {
    this.settings = settings;
    if (!this.context) return;
    const t = this.context.currentTime;
    this.master!.gain.setTargetAtTime(settings.mute ? 0 : settings.master, t, 0.04);
    this.musicBus!.gain.setTargetAtTime(settings.music * 0.2, t, 0.04);
    this.sfxBus!.gain.setTargetAtTime(settings.sfx * 0.35, t, 0.02);
  }
  private note(midi: number, length: number, music = false, delay = 0, end?: number): void {
    if (!this.context) return;
    const ctx = this.context,
      t = ctx.currentTime + delay;
    const osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = music ? 'triangle' : 'square';
    osc.frequency.setValueAtTime(440 * 2 ** ((midi - 69) / 12), t);
    if (end) osc.frequency.exponentialRampToValueAtTime(440 * 2 ** ((end - 69) / 12), t + length);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t + length);
    osc.connect(gain);
    gain.connect(music ? this.musicBus! : this.sfxBus!);
    this.voices.add(osc);
    osc.onended = () => {
      this.voices.delete(osc);
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(t);
    osc.stop(t + length + 0.01);
  }
  effect = (effect: 'tap' | 'bad' | 'good' | 'step'): void => {
    if (effect === 'good') [72, 76, 79, 84].forEach((n, i) => this.note(n, 0.15, false, i * 0.08));
    else if (effect === 'bad') this.note(49, 0.5, false, 0, 25);
    else this.note(effect === 'step' ? 45 : 76, 0.065);
  };
  playMusic(melody: number[]): void {
    this.stop();
    this.melody = melody;
    if (!this.context) return;
    let beat = 0;
    this.loop = setInterval(() => {
      this.note(melody[beat % melody.length], 0.17, true);
      if (beat % 2 === 0) this.note(melody[0] - 12, 0.13, true);
      beat++;
    }, 220);
  }
  stop(): void {
    clearInterval(this.loop);
    this.loop = undefined;
    for (const voice of this.voices) {
      try {
        voice.stop();
      } catch {
        /* Already stopped. */
      }
    }
    this.voices.clear();
  }
  suspend(): void {
    void this.context?.suspend();
  }
  resume(): void {
    void this.context?.resume().catch(() => {});
  }
}
