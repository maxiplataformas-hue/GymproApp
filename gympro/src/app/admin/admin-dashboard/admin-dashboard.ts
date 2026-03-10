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

    coaches = this.data.allCoaches;
    isCreating = signal(false);
    saveError = signal<string | null>(null);

    newCoachForm = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
        name: new FormControl('', Validators.required)
    });

    constructor() {
        this.data.loadCoaches();
    }

    startCreating() {
        this.newCoachForm.reset();
        this.saveError.set(null);
        this.isCreating.set(true);
    }

    cancelCreating() {
        this.isCreating.set(false);
    }

    saveCoach() {
        if (this.newCoachForm.valid) {
            const { email, name } = this.newCoachForm.value;
            const coach: User = { email: email!.trim().toLowerCase(), name: name!, role: 'coach', isOnboarded: true };
            this.data.createCoach(coach).subscribe({
                next: () => {
                    this.isCreating.set(false);
                    this.newCoachForm.reset();
                },
                error: () => this.saveError.set('Error al guardar. El correo podría ya existir.')
            });
        } else {
            this.newCoachForm.markAllAsTouched();
        }
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
}
