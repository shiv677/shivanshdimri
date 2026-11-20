// Lightweight procedural Web Audio API sound engine for Active Theory UI micro-interactions & ambient drone

class ActiveSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleAudio(): boolean {
    this.ensureContext();
    if (!this.ctx) return false;

    this.isMuted = !this.isMuted;

    if (!this.isMuted) {
      if (!this.droneOsc1) {
        this.startAmbientDrone();
      } else if (this.droneGain) {
        this.droneGain.gain.setTargetAtTime(0.04, this.ctx.currentTime, 0.5);
      }
      this.playClick(880);
    } else {
      if (this.droneGain && this.ctx) {
        this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
      }
    }

    return !this.isMuted;
  }

  private startAmbientDrone() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Deep futuristic sub-drone (D2 + A2 fifth)
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(73.42, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(110.0, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.setTargetAtTime(0.04, now, 1.2);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);

    this.droneOsc1 = osc1;
    this.droneOsc2 = osc2;
    this.droneGain = gain;
  }

  public playHover() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.035);

    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playClick(freq = 640) {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + 0.07);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  public get active(): boolean {
    return !this.isMuted;
  }
}

export const soundEngine = new ActiveSoundEngine();
