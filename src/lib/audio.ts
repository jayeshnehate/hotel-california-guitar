class MetronomeAudio {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private nextNoteTime: number = 0;
  private currentBeat: number = 0;
  private timerId: number | null = null;
  private bpm: number = 60;
  private beatsPerMeasure: number = 4;
  private onBeatCallback: ((beat: number) => void) | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(30, Math.min(240, bpm));
  }

  public setOnBeat(cb: ((beat: number) => void) | null) {
    this.onBeatCallback = cb;
  }

  public start(bpm: number, beatsPerMeasure: number = 4) {
    this.initCtx();
    if (this.isRunning) return;

    this.bpm = bpm;
    this.beatsPerMeasure = beatsPerMeasure;
    this.isRunning = true;
    this.currentBeat = 0;
    if (this.ctx) {
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }

    this.scheduleLoop();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.currentBeat = 0;
  }

  private playClick(time: number, isAccent: boolean) {
    if (!this.ctx) return;

    // Woody click synthesis using short bandpass burst and exponential decay
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // High woody pitch on beat 1 (1200Hz), lower on subsequent beats (800Hz)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isAccent ? 1400 : 900, time);
    filter.Q.setValueAtTime(3, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(isAccent ? 0.9 : 0.6, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  private scheduleLoop = () => {
    if (!this.isRunning || !this.ctx) return;

    const secondsPerBeat = 60.0 / this.bpm;
    const scheduleAheadTime = 0.1;

    while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
      const beat = this.currentBeat;
      const isAccent = beat === 0;
      this.playClick(this.nextNoteTime, isAccent);

      const delayMs = Math.max(0, (this.nextNoteTime - this.ctx.currentTime) * 1000);
      window.setTimeout(() => {
        if (this.isRunning && this.onBeatCallback) {
          this.onBeatCallback(beat);
        }
      }, delayMs);

      this.nextNoteTime += secondsPerBeat;
      this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
    }

    this.timerId = window.setTimeout(this.scheduleLoop, 25);
  };
}

export const metronome = new MetronomeAudio();
