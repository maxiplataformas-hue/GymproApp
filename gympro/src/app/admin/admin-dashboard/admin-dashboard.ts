import { Component, inject, computed, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { DataService } from '../../services/data';
import { AuthService, User } from '../../services/auth';

@Component({
    selector: 'app-admin-dashboard',
    imports: [ReactiveFormsModule, FormsModule, BaseChartDirective, CommonModule],
    templateUrl: './admin-dashboard.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboard {
    data = inject(DataService);
    auth = inject(AuthService);

    coaches = this.data.allCoaches as any;
    activeTab = signal<'coaches' | 'exercises' | 'metrics'>('coaches');
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
    
    viewingStudentsForCoach = signal<User | null>(null);
    coachStudents = computed(() => {
        const coach = this.viewingStudentsForCoach();
        if (!coach) return [];
        return this.data.allStudents().filter((s: User) => s.coachEmail === coach.email);
    });

    // --- Metrics Signals ---
    metricsFrom = signal(this.formatForInput(new Date(Date.now() - 24 * 60 * 60 * 1000)));
    metricsTo = signal(this.formatForInput(new Date()));
    accessStats = signal({ coachCount: 0, studentCount: 0 });
    topExercises = signal<Array<{id: string, name: string, count: number}>>([]);
    rawAccessLogs = signal<any[]>([]);
    viewingAccessLogsFor = signal<'student' | 'coach' | null>(null);

    studentAccessLogs = computed(() => {
        const logs = this.rawAccessLogs().filter(l => l.role === 'student');
        const students = this.data.allStudents();
        return logs.map(l => {
            const user = students.find(s => s.email === l.email);
            return {
                ...l,
                name: user?.name || 'Sin Nombre',
                avatarUrl: user?.avatarUrl
            };
        });
    });

    coachAccessLogs = computed(() => {
        const logs = this.rawAccessLogs().filter(l => l.role === 'coach');
        const coaches = this.data.allCoaches();
        return logs.map(l => {
            const user = coaches.find(c => c.email === l.email);
            return {
                ...l,
                name: user?.name || 'Sin Nombre',
                avatarUrl: user?.avatarUrl
            };
        });
    });

    public pieChartOptions: ChartOptions<'pie'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 12 } } }
        }
    };

    public pieChartData = computed<ChartConfiguration<'pie'>['data']>(() => {
        const top = this.topExercises();
        return {
            labels: top.map(t => t.name),
            datasets: [{
                data: top.map(t => t.count),
                backgroundColor: [
                    '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6',
                    '#06b6d4', '#ef4444', '#84cc16', '#f97316', '#6366f1'
                ],
                borderWidth: 1,
                borderColor: '#1e293b'
            }]
        };
    });

    constructor() {
        this.data.loadCoachMetrics();
        this.data.loadAllStudents();

        effect(() => {
            // Un-track just inside internal conditions but respond to tab or dates changing
            if (this.activeTab() === 'metrics' || this.metricsFrom() || this.metricsTo()) {
                if (this.activeTab() === 'metrics') {
                    this.loadMetrics();
                }
            }
        });
    }

    private formatForInput(d: Date): string {
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    loadMetrics() {
        try {
            const fromIso = new Date(this.metricsFrom() + ':00').toISOString();
            const toIso = new Date(this.metricsTo() + ':00').toISOString();
            
            this.data.getAccessMetrics(fromIso, toIso).subscribe(res => this.accessStats.set(res));
            this.data.getTopExercises(fromIso, toIso).subscribe(res => this.topExercises.set(res));
            this.data.getAccessDetails(fromIso, toIso).subscribe(res => this.rawAccessLogs.set(res));
        } catch(e) { /* Invalid date format yet */ }
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

    closeStudentsModal() {
        this.viewingStudentsForCoach.set(null);
    }

    closeAccessLogsModal() {
        this.viewingAccessLogsFor.set(null);
    }
}
