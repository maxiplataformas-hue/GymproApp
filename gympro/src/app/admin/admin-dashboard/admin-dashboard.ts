import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../services/data';
import { AuthService, User } from '../../services/auth';

@Component({
    selector: 'app-admin-dashboard',
    imports: [ReactiveFormsModule],
    templateUrl: './admin-dashboard.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboard {
    data = inject(DataService);
    auth = inject(AuthService);

    coaches = this.data.allCoaches as any;
    activeTab = signal<'coaches' | 'exercises'>('coaches');
    isCreating = signal(false);
    saveError = signal<string | null>(null);

    muscleGroups = ['Pecho', 'Espalda', 'Pierna', 'Hombro', 'Brazo', 'Core', 'Todos'];
    equipmentTypes = ['Barra', 'Mancuerna', 'Máquina', 'Libre'];

    newCoachForm = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
        name: new FormControl('', Validators.required),
        specialty: new FormControl('')
    });

    exerciseForm = new FormGroup({
        name: new FormControl('', Validators.required),
        muscleGroup: new FormControl('', Validators.required),
        equipment: new FormControl('', Validators.required),
        category: new FormControl('', Validators.required)
    });

    isEditing = signal(false);
    editingEmail = signal<string | null>(null);
    editingExerciseId = signal<string | null>(null);

    constructor() {
        this.data.loadCoachMetrics();
    }

    startCreating() {
        if (this.activeTab() === 'coaches') {
            this.newCoachForm.reset();
            this.newCoachForm.get('email')?.enable();
        } else {
            this.exerciseForm.reset();
        }
        this.saveError.set(null);
        this.isCreating.set(true);
        this.isEditing.set(false);
    }

    saveCoach() {
        if (this.newCoachForm.valid) {
            const { email, name, specialty } = this.newCoachForm.value;
            const coach: User = { 
                email: email!.trim().toLowerCase(), 
                name: name!, 
                specialty: specialty || '',
                role: 'coach', 
                isOnboarded: true 
            };

            if (this.isEditing()) {
                this.data.updateUser(this.editingEmail()!, { name: name!, specialty: specialty || '' }).subscribe({
                    next: () => {
                        this.isCreating.set(false);
                        this.isEditing.set(false);
                        this.data.loadCoachMetrics();
                    }
                });
            } else {
                this.data.createCoach(coach).subscribe({
                    next: () => {
                        this.isCreating.set(false);
                        this.newCoachForm.reset();
                        this.data.loadCoachMetrics();
                    },
                    error: () => this.saveError.set('Error al guardar. El correo podría ya existir.')
                });
            }
        } else {
            this.newCoachForm.markAllAsTouched();
        }
    }

    editCoach(coach: User) {
        this.isEditing.set(true);
        this.editingEmail.set(coach.email);
        this.isCreating.set(true);
        this.newCoachForm.patchValue({
            email: coach.email,
            name: coach.name,
            specialty: coach.specialty
        });
        this.newCoachForm.get('email')?.disable();
    }

    cancelCreating() {
        this.isCreating.set(false);
        this.isEditing.set(false);
        this.newCoachForm.get('email')?.enable();
    }

    toggleCoach(coach: User) {
        const isCurrentlyActive = coach.isActive !== false;
        const msg = isCurrentlyActive
            ? `¿Desactivar a ${coach.name || coach.email}? No podrá iniciar sesión.`
            : `¿Reactivar a ${coach.name || coach.email}?`;
        if (confirm(msg)) {
            this.data.toggleCoachStatus(coach.email, !isCurrentlyActive).subscribe();
        }
    }

    saveExercise() {
        if (this.exerciseForm.valid) {
            const exercise = this.exerciseForm.value;
            const payload = this.isEditing() 
                ? { ...exercise, id: this.editingExerciseId()! }
                : exercise;

            this.data.saveExercise(payload as any).subscribe({
                next: () => {
                    this.isCreating.set(false);
                    this.isEditing.set(false);
                    this.exerciseForm.reset();
                }
            });
        }
    }

    editExercise(ex: any) {
        this.isEditing.set(true);
        this.editingExerciseId.set(ex.id);
        this.isCreating.set(true);
        this.exerciseForm.patchValue({
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            equipment: ex.equipment,
            category: ex.category
        });
    }

    deleteExercise(id: string) {
        if (confirm('¿Eliminar este ejercicio?')) {
            this.data.deleteExercise(id).subscribe();
        }
    }
}
