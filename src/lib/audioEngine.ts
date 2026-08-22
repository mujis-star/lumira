'use client';

// Web Audio synthesizer and audio streaming engine for 100% reliable, zero-CORS playback
class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private currentHtmlAudio: HTMLAudioElement | null = null;
  private synthGainNode: GainNode | null = null;
  private synthOscillators: OscillatorNode[] = [];
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private volume: number = 0.8;
  private intervalId: NodeJS.Timeout | null = null;
  private currentTrackId: string | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play synthetic melody loop corresponding to track mood/genre
  private playSyntheticMusic(sourceId: string, startTime: number = 0, duration: number = 30, onTimeUpdate?: (curr: number) => void) {
    this.stop();
    const ctx = this.getAudioContext();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.25, ctx.currentTime);
    masterGain.connect(ctx.destination);
    this.synthGainNode = masterGain;

    // Define harmonic chord frequencies based on track profile
    let chordFreqs = [220, 261.63, 329.63, 392.0]; // Am7 default
    if (sourceId.includes('synth') || sourceId.includes('pulse')) {
      chordFreqs = [174.61, 220.0, 261.63, 329.63, 392.0]; // Fmaj7
    } else if (sourceId.includes('chill') || sourceId.includes('lofi')) {
      chordFreqs = [261.63, 329.63, 392.0, 493.88]; // Cmaj7
    } else if (sourceId.includes('acoustic') || sourceId.includes('golden')) {
      chordFreqs = [196.0, 246.94, 293.66, 392.0]; // G
    } else if (sourceId.includes('cinematic') || sourceId.includes('midnight')) {
      chordFreqs = [146.83, 174.61, 220.0, 261.63]; // Dm7
    }

    const oscs: OscillatorNode[] = [];
    chordFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Add gentle vibrato / rhythmic pulse
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.5 + idx * 0.2, ctx.currentTime);
      lfoGain.gain.setValueAtTime(3.5, ctx.currentTime);
      lfo.connect(osc.frequency);
      lfo.start();

      noteGain.gain.setValueAtTime(0.2 / chordFreqs.length, ctx.currentTime);
      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start();
      oscs.push(osc);
    });

    this.synthOscillators = oscs;
    this.isPlaying = true;

    let elapsed = startTime;
    this.intervalId = setInterval(() => {
      elapsed += 0.25;
      if (onTimeUpdate) {
        onTimeUpdate(elapsed);
      }
      if (elapsed >= startTime + duration) {
        this.stop();
      }
    }, 250);
  }

  public play(
    audioSource: string,
    startTime: number = 0,
    duration: number = 30,
    onTimeUpdate?: (curr: number) => void,
    onEnded?: () => void
  ) {
    this.stop();
    this.currentTrackId = audioSource;

    // If it's a real audio URL (starts with http or data:audio)
    if (audioSource.startsWith('http://') || audioSource.startsWith('https://') || audioSource.startsWith('data:audio')) {
      try {
        const audio = new Audio(audioSource);
        audio.currentTime = startTime;
        audio.volume = this.isMuted ? 0 : this.volume;
        audio.crossOrigin = 'anonymous';

        audio.ontimeupdate = () => {
          if (onTimeUpdate) {
            onTimeUpdate(audio.currentTime);
          }
          if (audio.currentTime >= startTime + duration) {
            this.stop();
            onEnded?.();
          }
        };

        audio.onended = () => {
          this.stop();
          onEnded?.();
        };

        audio.onerror = () => {
          // Fallback seamlessly to synthetic audio if remote network URL is blocked
          this.playSyntheticMusic(audioSource, startTime, duration, onTimeUpdate);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.currentHtmlAudio = audio;
              this.isPlaying = true;
            })
            .catch(() => {
              // Fallback to Web Audio synthesis on autoplay restriction or CORS
              this.playSyntheticMusic(audioSource, startTime, duration, onTimeUpdate);
            });
        }
      } catch {
        this.playSyntheticMusic(audioSource, startTime, duration, onTimeUpdate);
      }
    } else {
      // Synthetic sound generator ID
      this.playSyntheticMusic(audioSource, startTime, duration, onTimeUpdate);
    }
  }

  public pause() {
    if (this.currentHtmlAudio) {
      this.currentHtmlAudio.pause();
    }
    if (this.synthGainNode && this.audioCtx) {
      this.synthGainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
    }
    this.isPlaying = false;
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.currentHtmlAudio) {
      this.currentHtmlAudio.pause();
      this.currentHtmlAudio.src = '';
      this.currentHtmlAudio = null;
    }
    if (this.synthOscillators.length > 0) {
      this.synthOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      this.synthOscillators = [];
    }
    if (this.synthGainNode) {
      try {
        this.synthGainNode.disconnect();
      } catch {}
      this.synthGainNode = null;
    }
    this.isPlaying = false;
    this.currentTrackId = null;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.currentHtmlAudio) {
      this.currentHtmlAudio.muted = this.isMuted;
      this.currentHtmlAudio.volume = this.isMuted ? 0 : this.volume;
    }
    if (this.synthGainNode && this.audioCtx) {
      this.synthGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.25, this.audioCtx.currentTime);
    }
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.currentHtmlAudio) {
      this.currentHtmlAudio.volume = this.isMuted ? 0 : this.volume;
    }
    if (this.synthGainNode && this.audioCtx) {
      this.synthGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.25, this.audioCtx.currentTime);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }
}

export const audioEngine = typeof window !== 'undefined' ? new AudioEngine() : (null as unknown as AudioEngine);
