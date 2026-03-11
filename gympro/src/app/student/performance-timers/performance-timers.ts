import { Component, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  
  // State
  currentRound = signal(1);
  timeLeft = signal(20);
  isWorkPhase = signal(true);
  
  private interval: any;
  private audioContext: AudioContext | null = null;

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
  }

  ngOnDestroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  start() {
    if (this.isRunning()) return;
    
    this.isRunning.set(true);
    this.isPaused.set(false);
    this.currentRound.set(1);
    this.isWorkPhase.set(true);
    this.timeLeft.set(this.workTime());
    
    this.playSound('start');
    this.runTick();
  }

  pause() {
    this.isPaused.set(!this.isPaused());
  }

  stop() {
    this.isRunning.set(false);
    this.isPaused.set(false);
    clearInterval(this.interval);
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
    this.interval = setInterval(() => {
      if (this.isPaused()) return;

      this.timeLeft.update(t => t - 1);

      if (this.timeLeft() <= 5 && this.timeLeft() > 0) {
        this.playSound('warning');
      }

      if (this.timeLeft() <= 0) {
        this.handlePhaseEnd();
      }
    }, 1000);
  }

  private handlePhaseEnd() {
    if (this.mode() === 'EMOM') {
      if (this.currentRound() >= this.rounds()) {
        this.playSound('end');
        this.stop();
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
          this.playSound('end');
          this.stop();
        } else {
          this.isWorkPhase.set(true);
          this.currentRound.update(r => r + 1);
          this.timeLeft.set(this.workTime());
          this.playSound('start');
        }
      }
    } else if (this.mode() === 'REST') {
      this.playSound('end');
      this.stop();
    }
  }

  private playSound(type: 'start' | 'warning' | 'end' | 'rest') {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    if (type === 'start') {
      osc.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5
      gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.8); // Long beep
    } else if (type === 'warning') {
      osc.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
      gain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.1);
    } else if (type === 'end') {
      osc.frequency.setValueAtTime(1200, this.audioContext.currentTime);
      gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.8);
    } else if (type === 'rest') {
      osc.frequency.setValueAtTime(660, this.audioContext.currentTime);
      gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.8); // Long beep
    }
  }

  formatTime(s: number): string {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
