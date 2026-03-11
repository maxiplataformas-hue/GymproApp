import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ai-routine-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-routine-view.html',
  styleUrl: './ai-routine-view.css'
})
export class AiRoutineView implements OnInit {
  private router = inject(Router);

  // Simulated AI-generated routine
  routine = signal<any>({
    title: 'Entrenamiento Full Body Pro',
    description: 'Rutina dinámica generada según tu nivel intermedio y disponibilidad de gimnasio completo.',
    exercises: [
      { name: 'Press de Banca', sets: 4, reps: '10-12', rest: '60s', icon: '🏋️' },
      { name: 'Sentadilla con Barra', sets: 4, reps: '12', rest: '90s', icon: '🦵' },
      { name: 'Remo con Barra', sets: 3, reps: '10', rest: '60s', icon: '🛶' },
      { name: 'Press Militar', sets: 3, reps: '12', rest: '45s', icon: '🎖️' }
    ],
    timers: [
      { id: 'tabata-finisher', name: 'Tabata Finisher (4 min)', type: 'TABATA', rounds: 8, work: 20, rest: 10 }
    ]
  });

  ngOnInit() {
    // In a real implementation, we would fetch the onboarding data 
    // and call an AI service to generate this routine on the fly.
  }

  startTimer(timer: any) {
    // Redirect to the existing timers module with preset values
    this.router.navigate(['/app/student/timers'], { 
      queryParams: { 
        type: timer.type, 
        rounds: timer.rounds, 
        work: timer.work, 
        rest: timer.rest 
      } 
    });
  }

  shareRoutine() {
    console.log('Sharing routine...');
  }
}
