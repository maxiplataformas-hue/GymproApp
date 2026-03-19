import { Component, signal, effect, OnDestroy, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

type TimerMode = 'EMOM' | 'TABATA' | 'REST';

@Component({
  selector: 'app-performance-timers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './performance-timers.html',
  styleUrl: './performance-timers.css'
})
export class PerformanceTimers implements OnDestroy {
  timerModes: TimerMode[] = ['EMOM', 'TABATA', 'REST'];
  mode = signal<TimerMode>('TABATA');
  isRunning = signal(false);
  isPaused = signal(false);
  isFullscreen = signal(false);
  
  // Configuration
  workTime = signal(20); // seconds
  restTime = signal(10); // seconds
  rounds = signal(8);
  volume = signal(0.5); // Default to 50%
  
  // State
  currentRound = signal(1);
  timeLeft = signal(20);
  isWorkPhase = signal(true);
  isPrepPhase = signal(false);
  isFinished = signal(false);
  
  private worker: Worker | null = null;
  private audioContext: AudioContext | null = null;
  private wakeLock: any = null;
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private silentAudio: HTMLAudioElement | null = null;
  private phaseStartTime: number = 0;
  private activeOscillators: any[] = [];

  constructor() {
    effect(() => {
      if (this.isFullscreen()) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Handle ESC to exit fullscreen
    document.addEventListener('fullscreenchange', () => {
      this.ngZone.run(() => {
        this.isFullscreen.set(!!document.fullscreenElement);
      });
    });
    
    // Auto-fullscreen on landscape
    const orientationQuery = window.matchMedia('(orientation: landscape)');
    const handleOrientation = (e: MediaQueryListEvent | MediaQueryList) => {
      this.ngZone.run(() => {
        if (e.matches) {
          if (!document.fullscreenElement) {
            this.isFullscreen.set(true);
          }
        } else if (document.fullscreenElement) {
          this.isFullscreen.set(false);
        }
      });
    };
    
    orientationQuery.addEventListener('change', handleOrientation);
    window.addEventListener('resize', () => handleOrientation(orientationQuery));
    handleOrientation(orientationQuery);

    // Re-request wake lock if tab becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (this.wakeLock !== null && document.visibilityState === 'visible' && this.isRunning()) {
        this.requestWakeLock();
      }
    });

    this.initWorker();
    this.setupSilentAudio();
  }

  private setupSilentAudio() {
    const silentMp3 = 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFhYAAAAHAAAAGluZm8AMDAwMDAwMDAwMDAwMDAwMDAwMDAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZm8AAAAHAAAAAwAAAGUAAAABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXF1eX2BhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX5/gIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusrba3uLm6u7y9vr+AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/AAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uQZAAEA6G9pYm6e4ADuFpA67nEAAIuFpAAAAAIBi4WkAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    this.silentAudio = new Audio(silentMp3);
    this.silentAudio.loop = true;
  }

  private setupMediaSession() {
    if ('mediaSession' in navigator) {
      (navigator as any).mediaSession.metadata = new (window as any).MediaMetadata({
        title: `Temporizador - ${this.mode()}`,
        artist: 'CoachProApp',
        album: 'Entrenamiento de Intervalos',
        artwork: [
          { src: 'assets/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      (navigator as any).mediaSession.setActionHandler('play', () => this.start());
      (navigator as any).mediaSession.setActionHandler('pause', () => this.pause());
      (navigator as any).mediaSession.setActionHandler('stop', () => this.stop());
    }
  }

  private initWorker() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./timer.worker', import.meta.url));
      this.worker.onmessage = ({ data }) => {
        if (data === 'tick' && !this.isPaused()) {
          this.ngZone.run(() => this.tick());
        }
      };
    }
  }

  private tick() {
    if (!this.isRunning() || this.isPaused()) return;

    const elapsed = Math.floor((Date.now() - this.phaseStartTime) / 1000);
    const duration = this.isPrepPhase() ? 10 : (this.isWorkPhase() ? this.workTime() : this.restTime());
    const remaining = Math.max(0, duration - elapsed);
    
    this.timeLeft.set(remaining);

    if (remaining <= 0) {
      if (this.isPrepPhase()) {
        this.startPhase('work');
      } else {
        this.handlePhaseEnd();
      }
    }
  }

  ngOnDestroy() {
    this.stop();
    this.releaseWakeLock();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  start() {
    if (this.isRunning() && this.isPaused()) {
      this.isPaused.set(false);
      this.phaseStartTime = Date.now() - (this.isPrepPhase() ? 10 - this.timeLeft() : (this.isWorkPhase() ? this.workTime() - this.timeLeft() : this.restTime() - this.timeLeft())) * 1000;
      this.rescheduleCurrentPhase();
      if (this.silentAudio) this.silentAudio.play().catch(() => {});
      return;
    }

    if (this.isRunning()) return;

    this.isRunning.set(true);
    this.isPaused.set(false);
    this.isFinished.set(false);
    this.currentRound.set(1);
    
    this.startPhase('prep');
    
    if (this.worker) {
      this.worker.postMessage('start');
    }
    if (this.silentAudio) {
      this.silentAudio.play().catch(e => console.error('Silent audio failed:', e));
    }
    this.setupMediaSession();
    this.requestWakeLock();
  }

  private startPhase(phase: 'prep' | 'work' | 'rest') {
    this.clearScheduledAudio();
    this.phaseStartTime = Date.now();
    
    if (phase === 'prep') {
      this.isPrepPhase.set(true);
      this.isWorkPhase.set(true); // Prep is always a work-ish phase
      this.timeLeft.set(10);
      this.playSound('warning'); // Initial beep
      this.scheduleUpcomingAudio(10, 'start');
    } else if (phase === 'work') {
      this.isPrepPhase.set(false);
      this.isWorkPhase.set(true);
      this.timeLeft.set(this.workTime());
      this.playSound('start');
      this.scheduleUpcomingAudio(this.workTime(), 'end');
    } else if (phase === 'rest') {
      this.isPrepPhase.set(false);
      this.isWorkPhase.set(false);
      this.timeLeft.set(this.restTime());
      this.playSound('rest');
      this.scheduleUpcomingAudio(this.restTime(), 'end');
    }
  }

  private clearScheduledAudio() {
    this.activeOscillators.forEach(osc => {
      try { osc.stop(); } catch(e) {}
    });
    this.activeOscillators = [];
  }

  private rescheduleCurrentPhase() {
    const elapsed = Math.floor((Date.now() - this.phaseStartTime) / 1000);
    const duration = this.isPrepPhase() ? 10 : (this.isWorkPhase() ? this.workTime() : this.restTime());
    const remaining = duration - elapsed;
    if (remaining > 0) {
      this.scheduleUpcomingAudio(duration, 'dummy', elapsed); 
    }
  }

  pause() {
    this.isPaused.set(!this.isPaused());
    if (this.isPaused()) {
      this.clearScheduledAudio();
      if (this.silentAudio) this.silentAudio.pause();
    } else if (this.isRunning()) {
      this.phaseStartTime = Date.now() - (this.isPrepPhase() ? 10 - this.timeLeft() : (this.isWorkPhase() ? this.workTime() - this.timeLeft() : this.restTime() - this.timeLeft())) * 1000;
      this.rescheduleCurrentPhase();
      if (this.silentAudio) this.silentAudio.play().catch(() => {});
    }
  }

  stop() {
    this.isRunning.set(false);
    this.isPaused.set(false);
    this.clearScheduledAudio();
    if (this.worker) {
      this.worker.postMessage('stop');
    }
    if (this.silentAudio) {
      this.silentAudio.pause();
      this.silentAudio.currentTime = 0;
    }
    if ('mediaSession' in navigator) {
      (navigator as any).mediaSession.playbackState = 'none';
    }
    this.releaseWakeLock();
  }

  reset() {
    this.stop();
    this.isFinished.set(false);
    this.setMode(this.mode());
  }

  setMode(m: TimerMode) {
    this.mode.set(m);
    if (m === 'TABATA') {
      this.workTime.set(20);
      this.restTime.set(10);
      this.rounds.set(8);
      this.timeLeft.set(20);
    } else if (m === 'EMOM') {
      this.workTime.set(60);
      this.restTime.set(10);
      this.rounds.set(10);
      this.timeLeft.set(60);
    } else if (m === 'REST') {
      this.workTime.set(60);
      this.timeLeft.set(60);
    }
  }

  toggleFullscreen() {
    this.isFullscreen.set(!this.isFullscreen());
  }

  private handlePhaseEnd() {
    if (this.mode() === 'EMOM') {
      if (this.currentRound() >= this.rounds()) {
        this.handleCompletion();
      } else {
        this.currentRound.update(r => r + 1);
        this.startPhase('work');
      }
    } else if (this.mode() === 'TABATA') {
      if (this.isWorkPhase()) {
        if (this.currentRound() >= this.rounds()) {
          this.handleCompletion();
        } else {
          this.startPhase('rest');
        }
      } else {
        this.currentRound.update(r => r + 1);
        this.startPhase('work');
      }
    } else if (this.mode() === 'REST') {
      this.handleCompletion();
    }
  }

  private handleCompletion() {
    this.playSound('bell');
    setTimeout(() => this.playSound('bell'), 800);
    setTimeout(() => this.playSound('bell'), 1600);
    
    this.isFinished.set(true);
    this.stop();
    
    setTimeout(() => {
      const user = this.authService.currentUser();
      const alias = user?.nickname || user?.name || 'atleta';
      this.speak(`Bien hecho ${alias}, sigue así`);
    }, 4500); 
  }


  private async scheduleUpcomingAudio(duration: number, nextType: string, offset: number = 0) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const now = this.audioContext.currentTime;
    const vol = this.volume() / 100;

    // Schedule 5 warning beeps
    for (let i = 1; i <= 5; i++) {
        const timeToBeep = duration - i - offset;
        if (timeToBeep > 0) {
            this.scheduleBeep(now + timeToBeep, 0.2, 660, vol);
        }
    }

    // Schedule end beep (longer)
    const timeToEnd = duration - offset;
    if (timeToEnd > 0) {
        this.scheduleBeep(now + timeToEnd, 0.8, 880, vol);
    }
  }

  private scheduleBeep(startTime: number, duration: number, freq: number, volume: number) {
    if (!this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * 1.5, startTime + 0.01);
    gain.gain.setValueAtTime(volume * 1.5, startTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
    
    this.activeOscillators.push(osc);
  }

  private async playSound(type: 'start' | 'warning' | 'end' | 'rest' | 'bell') {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    const baseVolume = this.volume() * 1.5; 
    
    if (type === 'start') {
      osc.frequency.setValueAtTime(880, this.audioContext.currentTime);
      gain.gain.setValueAtTime(baseVolume, this.audioContext.currentTime);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.8);
    } else if (type === 'warning') {
      osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
      gain.gain.setValueAtTime(baseVolume * 0.4, this.audioContext.currentTime);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.1);
    } else if (type === 'end') {
      osc.frequency.setValueAtTime(1200, this.audioContext.currentTime);
      gain.gain.setValueAtTime(baseVolume * 1.5, this.audioContext.currentTime); 
      osc.start();
      osc.stop(this.audioContext.currentTime + 3.0);
    } else if (type === 'rest') {
      osc.frequency.setValueAtTime(660, this.audioContext.currentTime);
      gain.gain.setValueAtTime(baseVolume, this.audioContext.currentTime);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.8);
    } else if (type === 'bell') {
      const mod = this.audioContext.createOscillator();
      const modGain = this.audioContext.createGain();
      mod.type = 'triangle';
      mod.frequency.setValueAtTime(300, this.audioContext.currentTime);
      modGain.gain.setValueAtTime(200, this.audioContext.currentTime);

      osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
      mod.connect(modGain);
      modGain.connect(osc.frequency);
      
      gain.gain.setValueAtTime(baseVolume * 1.5, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2.0);
      
      mod.start();
      osc.start();
      mod.stop(this.audioContext.currentTime + 2.0);
      osc.stop(this.audioContext.currentTime + 2.0);
    }
  }

  private speak(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = this.volume();
      window.speechSynthesis.speak(utterance);
    }
  }

  private async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  }

  private releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release().then(() => {
        this.wakeLock = null;
      });
    }
  }

  formatTime(s: number): string {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
