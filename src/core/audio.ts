/**
 * Síntese Sonora Procedural (Web Audio API) e Narração Acessível (Web Speech API)
 * Zero arquivos externos (.mp3/.wav) — 100% livre de erros 404 e com controle de estímulos.
 */

class SoundAndVoiceController {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private voiceEnabled = true;
  private reducedStimuli = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public configure(opts: {
    soundEnabled: boolean;
    voiceEnabled: boolean;
    reducedStimuli: boolean;
  }) {
    this.soundEnabled = opts.soundEnabled;
    this.voiceEnabled = opts.voiceEnabled;
    this.reducedStimuli = opts.reducedStimuli;
    if (!opts.voiceEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Feedback háptico suave para telas touch Android (ex: Motorola Moto G34 5G)
   */
  public triggerHaptic(type: 'light' | 'medium' | 'success' = 'light') {
    if (this.reducedStimuli || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      if (type === 'light') navigator.vibrate(8);
      else if (type === 'medium') navigator.vibrate(15);
      else if (type === 'success') navigator.vibrate([16, 45, 22]);
    } catch {
      // Ignora caso dispositivo não tenha motor háptico
    }
  }

  /**
   * Toque sutil de madeira/marimba ao mudar divisões ou mover o marcador na reta
   */
  public playTick(stepRatio = 0.5) {
    this.triggerHaptic('light');
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 280 + stepRatio * 240;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.12, now + 0.06);

    const maxGain = this.reducedStimuli ? 0.04 : 0.09;
    gain.gain.setValueAtTime(maxGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.075);
  }

  /**
   * Acorde botânico suave quando o estudante acerta a fração unitária e transforma o terrário
   */
  public playSuccessChord() {
    this.triggerHaptic('success');
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // Dó5, Mi5, Sol5, Dó6
    const now = ctx.currentTime;
    const maxGain = this.reducedStimuli ? 0.04 : 0.08;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const startTime = now + idx * 0.07;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(maxGain, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.48);
    });
  }

  /**
   * Som acolhedor e não punitivo quando uma resposta precisa de revisão (pista formativa)
   */
  public playGentleHintTone() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(349.23, now); // Fá4
    osc.frequency.linearRampToValueAtTime(329.63, now + 0.18); // Mi4 suave

    const maxGain = this.reducedStimuli ? 0.035 : 0.07;
    gain.gain.setValueAtTime(maxGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Som cristalino curto ao posicionar um item no Modo Criativo do terrário
   */
  public playPlaceDecoration() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    const maxGain = this.reducedStimuli ? 0.04 : 0.08;
    gain.gain.setValueAtTime(maxGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Narração sintetizada em Português (pt-BR) para acessibilidade e autonomia de leitura
   */
  public speak(text: string) {
    if (!this.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.96;
      utterance.pitch = 1.04;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignorar caso o navegador bloqueie síntese sem gesto prévio
    }
  }
}

export const soundController = new SoundAndVoiceController();
