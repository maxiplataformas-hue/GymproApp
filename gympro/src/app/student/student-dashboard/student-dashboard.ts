import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth';
import { DataService } from '../../services/data';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './student-dashboard.html'
})
export class StudentDashboard {
  auth = inject(AuthService);
  data = inject(DataService);

  user = computed(() => this.auth.currentUser());
  userName = computed(() => this.user()?.name?.split(' ')[0] || 'Atleta');

  // Today's date YYYY-MM-DD
  today = new Date().toISOString().split('T')[0];

  // Get today's routine assignment
  todayRoutine = this.data.getRoutinesForStudent(this.user()?.email || '', this.today);

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
}
