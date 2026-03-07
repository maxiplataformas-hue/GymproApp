import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { AuthService } from '../../services/auth';
import { DataService } from '../../services/data';

@Component({
  selector: 'app-routine-calendar',
  standalone: true,
  imports: [RouterLink, DatePipe, NgClass],
  templateUrl: './routine-calendar.html'
})
export class RoutineCalendar implements OnInit {
  auth = inject(AuthService);
  data = inject(DataService);

  user = computed(() => this.auth.currentUser());

  // Selected Date state YYYY-MM-DD
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user && user.email) {
      this.data.loadRoutines(user.email);
    }
  }

  // Generate an array of dates around the selected date (e.g. 3 days before, 3 days after)
  weekDays = computed(() => {
    const dates = [];
    const base = new Date(this.selectedDate() + 'T12:00:00'); // avoiding timezone shifts
    for (let i = -3; i <= 3; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(d);
      const dayNum = d.getDate();
      dates.push({ iso, dayName, dayNum, isSelected: i === 0 });
    }
    return dates;
  });

  // Current Routine
  routine = computed(() => this.data.getRoutinesForStudent(this.user()?.email || '', this.selectedDate()));
  exercises = computed(() => this.data.exercises());

  // Compute joined items for view
  routineItems = computed(() => {
    const r = this.routine();
    if (!r) return [];
    return r.items.map(i => {
      const ex = this.exercises().find(e => e.id === i.exerciseId);
      return {
        ...i,
        exerciseName: ex?.name || 'Ejercicio Desconocido',
        muscleGroup: ex?.muscleGroup || 'General',
        equipment: ex?.equipment || 'Libre'
      };
    });
  });

  selectDate(iso: string) {
    this.selectedDate.set(iso);
  }

  toggleComplete(itemId: string) {
    const r = this.routine();
    if (r && r.id) {
      this.data.toggleRoutineItemComplete(r.id as string, itemId);
    }
  }

  // Get muscle group color utility
  getMuscleGroupColor(group: string): string {
    const colors: Record<string, string> = {
      'Pecho': 'text-blue-500 bg-blue-500/10',
      'Espalda': 'text-emerald-500 bg-emerald-500/10',
      'Pierna': 'text-orange-500 bg-orange-500/10',
      'Hombro': 'text-purple-500 bg-purple-500/10',
      'Brazo': 'text-pink-500 bg-pink-500/10',
      'Core': 'text-yellow-500 bg-yellow-500/10'
    };
    return colors[group] || 'text-gray-500 bg-gray-500/10';
  }
}
