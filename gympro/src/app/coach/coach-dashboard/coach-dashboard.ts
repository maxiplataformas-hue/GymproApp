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
    nickname: new FormControl(''),
    age: new FormControl<number | null>(null, [Validators.required, Validators.min(10)]),
    initialWeight: new FormControl<number | null>(null, [Validators.required, Validators.min(30)]),
    height: new FormControl<number | null>(null, [Validators.required, Validators.min(100)])
  });

  isEditingStudent = signal(false);

  constructor() {
    effect(() => {
      const email = this.coachEmail();
      if (email) this.data.loadAllStudents(email);
    });
  }

  selectStudent(student: User) {
    this.isCreatingStudent.set(false);
    this.isEditingStudent.set(false);
    this.selectedStudent.set(student);
  }

  deselectStudent() {
    this.selectedStudent.set(null);
    this.isCreatingStudent.set(false);
    this.isEditingStudent.set(false);
    this.activeTab.set('routine');
  }

  startCreatingStudent() {
    this.selectedStudent.set(null);
    this.isCreatingStudent.set(true);
    this.newStudentForm.reset();
  }

  cancelCreatingStudent() {
    this.isCreatingStudent.set(false);
    this.isEditingStudent.set(false);
  }

  editStudent(student: User) {
    this.isEditingStudent.set(true);
    this.isCreatingStudent.set(false);
    this.newStudentForm.patchValue({
      email: student.email,
      name: student.name,
      nickname: student.nickname,
      age: student.age,
      initialWeight: student.initialWeight,
      height: student.height
    });
  }

  saveNewStudent() {
    if (this.newStudentForm.valid) {
      const formValue = this.newStudentForm.value;
      const studentData: User = {
        email: formValue.email!.trim().toLowerCase(),
        name: formValue.name!,
        nickname: formValue.nickname || undefined,
        age: formValue.age!,
        initialWeight: formValue.initialWeight!,
        height: formValue.height!,
        role: 'student',
        isOnboarded: true
      };

      if (this.isEditingStudent()) {
        const updateData: Partial<User> = {
          name: formValue.name!,
          nickname: formValue.nickname || undefined,
          age: formValue.age!,
          initialWeight: formValue.initialWeight!,
          height: formValue.height!
        };
        this.data.updateUser(formValue.email!, updateData, this.coachEmail()).subscribe({
          next: () => {
            this.isEditingStudent.set(false);
            const current = this.selectedStudent();
            if (current) {
              this.selectedStudent.set({ ...current, ...updateData });
            }
            this.data.loadAllStudents(this.coachEmail());
          },
          error: (err) => {
            console.error('Error al actualizar alumno:', err);
            alert('No se pudo guardar la edición. Revisa tu conexión o intenta más tarde.');
          }
        });
      } else {
        this.data.createStudent(studentData, this.coachEmail()).subscribe(() => {
          this.isCreatingStudent.set(false);
          this.data.loadAllStudents(this.coachEmail());
        });
      }
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
