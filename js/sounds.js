export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
  }

  init() {
    if (!this.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === 'suspended') this.audioContext.resume();
  }

  playTone(frequency, duration, type = 'sine', volume = 0.25) {
    if (!this.enabled || !this.audioContext) return;
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playCorrect() {
    this.playTone(523.25, 0.1);
    setTimeout(() => this.playTone(659.25, 0.1), 100);
    setTimeout(() => this.playTone(783.99, 0.15), 200);
  }

  playWrong() { this.playTone(200, 0.3, 'sawtooth', 0.18); }
  playWarning() { this.playTone(600, 0.08, 'square', 0.12); }

  playTimeUp() {
    this.playTone(300, 0.18, 'sawtooth', 0.22);
    setTimeout(() => this.playTone(200, 0.25, 'sawtooth', 0.22), 180);
  }

  playComplete() {
    [523.25, 659.25, 783.99, 1046.5].forEach((note, index) => {
      setTimeout(() => this.playTone(note, 0.18), index * 130);
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

export const soundManager = new SoundManager();
