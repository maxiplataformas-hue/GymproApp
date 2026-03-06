import { Component, inject, computed, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data';
import { AuthService, User } from '../../services/auth';
import { RoutineAssignment } from '../routine-assignment/routine-assignment';

@Component({
  selector: 'app-coach-dashboard',
  standalone: true,
  // imports: [RouterLink, RoutineAssignment],
imports: [RoutineAssignment],
  templateUrl: './coach-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoachDashboard {
  data = inject(DataService);
  auth = inject(AuthService);

  students = computed(() => this.data.allStudents());

  selectedStudent = signal<User | null>(null);

  selectStudent(student: User) {
    this.selectedStudent.set(student);
  }

  deselectStudent() {
    this.selectedStudent.set(null);
  }
}
