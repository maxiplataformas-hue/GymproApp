import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth';
import { DataService } from '../../services/data';


@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './student-dashboard.html'
  // using default change detection to prevent missing data on SPA navigation
})
export class StudentDashboard {
  auth = inject(AuthService);
  data = inject(DataService);

  user = computed(() => this.auth.currentUser());
  userName = computed(() => this.user()?.name?.split(' ')[0] || 'Atleta');

  // Today's date YYYY-MM-DD
  today = new Date().toISOString().split('T')[0];

  // Today's date in Spanish for display
  todayFormatted = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).toUpperCase();

  // Get today's routine assignment
  todayRoutine = computed(() => this.data.getRoutinesForStudent(this.user()?.email || '', this.today));

  // Compute stats
  completedItemsCount = computed(() => {
    const routine = this.todayRoutine();
    if (!routine) return 0;
    return routine.items.filter(i => i.completed).length;
  });

  totalItemsCount = computed(() => {
    const routine = this.todayRoutine();
    if (!routine) return 0;
    return routine.items.length;
  });

  progressPercent = computed(() => {
    const total = this.totalItemsCount();
    if (total === 0) return 0;
    return Math.round((this.completedItemsCount() / total) * 100);
  });

  // Diet & Supplements State
  showDietModal = signal(false);
  
  latestProfile = computed(() => {
    const profiles = this.data.currentProfiles();
    return profiles.length > 0 ? profiles[0] : null;
  });

  constructor() {
    // Load student profile on init to fetch diet/supplements
    const email = this.user()?.email;
    if (email) {
      this.data.loadProfile(email);
    }
  }

  alert(msg: string) {
    window.alert(msg);
  }
}
