import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-ai-routine-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-routine-view.html',
  styleUrl: './ai-routine-view.css'
})
export class AiRoutineView implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'https://gymproapp.onrender.com/api';

  // State
  routine = signal<any>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.fetchRoutine();
  }

  fetchRoutine() {
    const user = this.auth.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    console.log(`Fetching routine for ${user.email} on ${today}`);
    this.http.get<any>(`${this.apiUrl}/routines/${user.email}/${today}`).subscribe({
      next: (data) => {
        console.log('Routine data received:', data);
        if (!data || !data.items || data.items.length === 0) {
          this.error.set('La IA no ha generado ejercicios para hoy. Reintenta el onboarding.');
          this.isLoading.set(false);
          return;
        }
        const routineData = {
          title: 'Tu Rutina IA de Hoy',
          description: 'Generada específicamente para tus objetivos y equipo disponible.',
          createdAt: data.createdAt,
          exercises: data.items.map((it: any) => ({
            name: it.exerciseId, 
            sets: it.sets,
            reps: it.reps,
            rest: '60s', 
            icon: '⚡'
          })),
          timers: [
            { id: 'tabata-finisher', name: 'Tabata Finisher (4 min)', type: 'TABATA', rounds: 8, work: 20, rest: 10 }
          ]
        };
        console.log('Setting routine signal with data:', routineData);
        this.routine.set(routineData);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching routine:', err);
        this.error.set('No pudimos conectar con el servidor para obtener tu rutina.');
        this.isLoading.set(false);
      }
    });
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
