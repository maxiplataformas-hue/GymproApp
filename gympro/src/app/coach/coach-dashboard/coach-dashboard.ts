import { Component, inject, computed, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators, FormsModule } from '@angular/forms';
import { DataService } from '../../services/data';
import { AuthService, User } from '../../services/auth';
import { RoutineAssignment } from '../routine-assignment/routine-assignment';
import { ProgressGallery } from '../../shared/progress-gallery/progress-gallery';
import { StudentProfileTab } from '../student-profile-tab/student-profile-tab';

@Component({
  selector: 'app-coach-dashboard',
  standalone: true,
  imports: [RoutineAssignment, ProgressGallery, StudentProfileTab, ReactiveFormsModule, FormsModule],
  templateUrl: './coach-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoachDashboard {
  data = inject(DataService);
  auth = inject(AuthService);

  searchQuery = signal('');
  hideInactive = signal(false);

  coachEmail = computed(() => this.auth.currentUser()?.email);

  students = computed(() => {
    let list = this.data.allStudents();

    if (this.hideInactive()) {
      list = list.filter(s => s.isActive !== false);
    }

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        s.email.toLowerCase().includes(q)
      );
    }

    return list;
  });

  selectedStudent = signal<User | null>(null);
  isCreatingStudent = signal(false);
  activeTab = signal<'routine' | 'profile' | 'gallery'>('routine');

  newStudentForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    name: new FormControl('', Validators.required),
    age: new FormControl<number | null>(null, [Validators.required, Validators.min(10)]),
    initialWeight: new FormControl<number | null>(null, [Validators.required, Validators.min(30)]),
    height: new FormControl<number | null>(null, [Validators.required, Validators.min(100)])
  });

  constructor() {
    effect(() => {
      const email = this.coachEmail();
      if (email) this.data.loadAllStudents(email);
    });
  }

  selectStudent(student: User) {
    this.isCreatingStudent.set(false);
    this.selectedStudent.set(student);
  }

  deselectStudent() {
    this.selectedStudent.set(null);
    this.isCreatingStudent.set(false);
    this.activeTab.set('routine');
  }

  startCreatingStudent() {
    this.selectedStudent.set(null);
    this.isCreatingStudent.set(true);
    this.newStudentForm.reset();
  }

  cancelCreatingStudent() {
    this.isCreatingStudent.set(false);
  }

  saveNewStudent() {
    if (this.newStudentForm.valid) {
      const formValue = this.newStudentForm.value;
      const newUser: User = {
        email: formValue.email!,
        name: formValue.name!,
        age: formValue.age!,
        initialWeight: formValue.initialWeight!,
        height: formValue.height!,
        role: 'student',
        isOnboarded: true
      };
      this.data.createStudent(newUser, this.coachEmail()).subscribe(() => {
        this.isCreatingStudent.set(false);
      });
    } else {
      this.newStudentForm.markAllAsTouched();
    }
  }

  toggleStudentStatus(student: User) {
    const isCurrentlyActive = student.isActive !== false;
    const msg = isCurrentlyActive
      ? `¿Desactivar a ${student.name || student.email}? No podrá acceder a la plataforma.`
      : `¿Reactivar a ${student.name || student.email}?`;

    if (confirm(msg)) {
      this.data.toggleStudentStatus(student.email, !isCurrentlyActive, this.coachEmail()).subscribe(() => {
        this.selectedStudent.set({ ...student, isActive: !isCurrentlyActive });
      });
    }
  }

  deleteStudent(student: User) {
    const msg = `¿Eliminar definitivamente a ${student.name || student.email}?\n\nEsta acción no se puede deshacer. El alumno y sus datos de rutina quedarán archivados pero no podrá iniciar sesión.`;
    if (confirm(msg)) {
      this.data.deleteStudent(student.email, this.coachEmail()).subscribe(() => {
        this.deselectStudent();
      });
    }
  }
}
