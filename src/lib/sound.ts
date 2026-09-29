/**
 * Original atelier score. A low drone plus a thin air band.
 * Started only after the enter click so autoplay policy is satisfied.
 */
class AtelierSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private ready = false;
  musicOn = false;

  private async ensure() {
    if (this.ready) {
      if (this.ctx?.state === "suspended") await this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);

    const music = ctx.createGain();
    music.gain.value = 0;
    music.connect(master);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 480;
    filter.connect(music);

    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 55;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.09;
    drone.connect(droneGain).connect(filter);

    const overtone = ctx.createOscillator();
    overtone.type = "triangle";
    overtone.frequency.value = 110.2;
    const overtoneGain = ctx.createGain();
    overtoneGain.gain.value = 0.018;
    overtone.connect(overtoneGain).connect(filter);

    const fifth = ctx.createOscillator();
    fifth.type = "sine";
    fifth.frequency.value = 164.8;
    const fifthGain = ctx.createGain();
    fifthGain.gain.value = 0.008;
    fifth.connect(fifthGain).connect(music);

    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1600;
    band.Q.value = 0.6;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.015;
    noise.connect(band).connect(noiseGain).connect(music);

    drone.start();
    overtone.start();
    fifth.start();
    noise.start();

    this.ctx = ctx;
    this.master = master;
    this.music = music;
    this.ready = true;
    if (ctx.state === "suspended") await ctx.resume();
  }

  async setMusic(on: boolean) {
    await this.ensure();
    if (!this.ctx || !this.music) return;
    const now = this.ctx.currentTime;
    this.music.gain.cancelScheduledValues(now);
    this.music.gain.linearRampToValueAtTime(on ? 1 : 0, now + 1.15);
    this.musicOn = on;
  }

  async blip(brightness = 0.45) {
    await this.ensure();
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(420 + brightness * 380, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.2);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  async duck(muted: boolean) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.85, now + 0.25);
  }
}

export const sound = new AtelierSound();
