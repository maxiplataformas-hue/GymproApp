import { Component, signal, effect, OnDestroy, inject } from '@angular/core';
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

  constructor() {
    effect(() => {
      if (this.isFullscreen()) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Handle ESC to exit fullscreen
    document.onfullscreenchange = () => {
      this.isFullscreen.set(!!document.fullscreenElement);
    };

    // Auto-fullscreen on landscape (Robust detection)
    const orientationQuery = window.matchMedia('(orientation: landscape)');
    const handleOrientation = (e: MediaQueryListEvent | MediaQueryList) => {
      // If running and rotated to landscape, force visual fullscreen
      if (e.matches) {
        this.isFullscreen.set(true);
      } else if (!document.fullscreenElement) {
        // Only exit visual fullscreen if we are not in actual browser fullscreen
        this.isFullscreen.set(false);
      }
    };
    
    orientationQuery.addEventListener('change', handleOrientation);
    // Also listen for resize as a backup for some mobile browsers
    window.addEventListener('resize', () => handleOrientation(orientationQuery));
    // Initial check
    handleOrientation(orientationQuery);

    // Re-request wake lock if tab becomes visible again
    document.addEventListener('visibilitychange', async () => {
      if (this.wakeLock !== null && document.visibilityState === 'visible' && this.isRunning()) {
        await this.requestWakeLock();
      }
    });

    this.initWorker();
  }

  private initWorker() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./timer.worker', import.meta.url));
      this.worker.onmessage = ({ data }) => {
        if (data === 'tick' && !this.isPaused()) {
          this.tick();
        }
      };
    }
  }

  private tick() {
    this.timeLeft.update(t => t - 1);

    if (this.timeLeft() <= 5 && this.timeLeft() > 0) {
      this.playSound('warning');
    }

    if (this.timeLeft() <= 0) {
      if (this.isPrepPhase()) {
        this.isPrepPhase.set(false);
        this.timeLeft.set(this.workTime());
        this.playSound('start');
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
    if (this.isRunning()) return;
    
    this.isRunning.set(true);
    this.isPaused.set(false);
    this.isFinished.set(false);
    this.isPrepPhase.set(true); // Always start with a 10s prep
    this.timeLeft.set(10);
    this.currentRound.set(1);
    this.isWorkPhase.set(true);
    
    this.playSound('warning');
    if (this.worker) {
      this.worker.postMessage('start');
    }
    this.requestWakeLock();
  }

  pause() {
    this.isPaused.set(!this.isPaused());
  }

  stop() {
    this.isRunning.set(false);
    this.isPaused.set(false);
    if (this.worker) {
      this.worker.postMessage('stop');
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

  private runTick() {
    // Methods replaced by worker
  }

  private handlePhaseEnd() {
    if (this.mode() === 'EMOM') {
      if (this.currentRound() >= this.rounds()) {
        this.handleCompletion();
      } else {
        this.currentRound.update(r => r + 1);
        this.timeLeft.set(this.workTime());
        this.playSound('start');
      }
    } else if (this.mode() === 'TABATA') {
      if (this.isWorkPhase()) {
        this.isWorkPhase.set(false);
        this.timeLeft.set(this.restTime());
        this.playSound('rest'); // Or just start
      } else {
        if (this.currentRound() >= this.rounds()) {
          this.handleCompletion();
        } else {
          this.isWorkPhase.set(true);
          this.currentRound.update(r => r + 1);
          this.timeLeft.set(this.workTime());
          this.playSound('start');
        }
      }
    } else if (this.mode() === 'REST') {
      this.handleCompletion();
    }
  }

  private handleCompletion() {
    this.playSound('end');
    this.isFinished.set(true);
    this.stop();
    
    setTimeout(() => {
      const user = this.authService.currentUser();
      const alias = user?.nickname || user?.name || 'atleta';
      this.speak(`Bien hecho ${alias}, sigue así`);
    }, 3500); // Speak after the 3s long beep
  }

  private async playSound(type: 'start' | 'warning' | 'end' | 'rest' | 'bell') {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Ensure the audio context is active (necessary if the screen was locked/backgrounded)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'square'; // More "piercing" sound for noisy gyms
    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    // Increase perceived volume by allowing gain up to 1.5x (be careful with clipping)
    const baseVolume = this.volume() * 1.5; 
    
    if (type === 'start') {
      osc.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5
      gain.gain.setValueAtTime(baseVolume, this.audioContext.currentTime);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.8); // Long beep
    } else if (type === 'warning') {
      osc.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
      gain.gain.setValueAtTime(baseVolume * 0.4, this.audioContext.currentTime);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.1);
    } else if (type === 'end') {
      osc.frequency.setValueAtTime(1200, this.audioContext.currentTime);
      gain.gain.setValueAtTime(baseVolume * 1.5, this.audioContext.currentTime); 
      osc.start();
      osc.stop(this.audioContext.currentTime + 3.0); // Very long beep per request
    } else if (type === 'rest') {
      osc.frequency.setValueAtTime(660, this.audioContext.currentTime);
      gain.gain.setValueAtTime(baseVolume, this.audioContext.currentTime);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.8); // Long beep
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
