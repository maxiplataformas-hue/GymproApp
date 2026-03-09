import { Component, inject, computed, ChangeDetectionStrategy, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
      this.data.createStudent(newUser).subscribe(() => {
        this.isCreatingStudent.set(false);
      });
    } else {
      this.newStudentForm.markAllAsTouched();
    }
  }

  toggleStudentStatus(student: User) {
    const isCurrentlyActive = student.isActive !== false;
    const confirmMessage = isCurrentlyActive ?
      `¿Estás seguro que deseas desactivar a ${student.name || student.email}? No podrá acceder a la plataforma.` :
      `¿Deseas volver a activar a ${student.name || student.email}? Podrá reiniciar su progreso.`;

    if (confirm(confirmMessage)) {
      this.data.toggleStudentStatus(student.email, !isCurrentlyActive).subscribe(() => {
        // Update selected student local ref so UI reflects the change immediately
        // The updated user will come down from the signal reload soon but this helps optimism
        this.selectedStudent.set({ ...student, isActive: !isCurrentlyActive });
      });
    }
  }
}
