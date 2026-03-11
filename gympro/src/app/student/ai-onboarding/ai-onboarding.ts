import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../services/auth';
import { BiometricService } from '../../services/biometric';
import { ThemeService, AppTheme } from '../../services/theme';

@Component({
  selector: 'app-ai-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-onboarding.html',
  styleUrl: './ai-onboarding.css'
})
export class AiOnboarding implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  biometric = inject(BiometricService);
  theme = inject(ThemeService);
  private apiUrl = 'https://gymproapp.onrender.com/api';

  step = signal(0);
  emailField = signal('');
  isNewUser = signal(false);
  
  // Profile fields for new users
  nameField = signal('');
  nicknameField = signal('');
  ageField = signal<number | null>(null);
  weightField = signal<number | null>(null);
  heightField = signal<number | null>(null);

  goal = signal('');
  level = signal('');
  equipment = signal<string[]>([]);
  isBiometricLoading = signal(false);

  goals = [
    { id: 'weight-loss', label: 'Perder peso', icon: '⚖️' },
    { id: 'muscle-gain', label: 'Ganar músculo', icon: '💪' },
    { id: 'endurance', label: 'Resistencia', icon: '🏃' },
    { id: 'health', label: 'Salud general', icon: '🧘' }
  ];

  levels = [
    { id: 'beginner', label: 'Principiante', desc: 'Nunca he entrenado o llevo poco tiempo' },
    { id: 'intermediate', label: 'Intermedio', desc: 'Entreno regularmente hace meses' },
    { id: 'advanced', label: 'Avanzado', desc: 'Años de entrenamiento constante' }
  ];

  equipmentOptions = [
    { id: 'gym', label: 'Gimnasio completo', icon: '🏋️' },
    { id: 'dumbbells', label: 'Solo mancuernas', icon: '🧱' },
    { id: 'bodyweight', label: 'Solo peso corporal', icon: '🧘' },
    { id: 'home', label: 'Equipamiento de casa', icon: '🏠' }
  ];

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.step.set(1);
      this.emailField.set(user.email);
    }
  }

  async nextStep() {
    const s = this.step();
    if (s === 0) {
      if (!this.emailField() || !this.emailField().includes('@')) {
        alert('Por favor, ingresa un correo electrónico válido.');
        return;
      }
      
      this.isBiometricLoading.set(true);
      const email = this.emailField().trim().toLowerCase();
      
      this.http.get(`${this.apiUrl}/users/${email}`).pipe(
        catchError((err) => {
          if (err.status === 404) {
            this.isNewUser.set(true);
            this.step.set(1); // Go to Profile Form
          } else {
            alert('Error al verificar el usuario. Reintenta.');
          }
          return of(null);
        })
      ).subscribe((user) => {
        this.isBiometricLoading.set(false);
        if (user) {
          this.isNewUser.set(false);
          this.step.set(2); // Skip Profile, go to Biometrics
        }
      });
      return;
    }

    if (s === 1) { // Basic Profile Registration
      if (!this.nameField() || !this.ageField() || !this.weightField() || !this.heightField()) {
        alert('Por favor, completa todos los campos obligatorios.');
        return;
      }
      this.registerUser();
      return;
    }
    
    if (this.step() < 5) {
      this.step.update(s => s + 1);
    } else {
      this.completeOnboarding();
    }
  }

  private registerUser() {
    this.isBiometricLoading.set(true);
    const payload = {
      email: this.emailField().trim().toLowerCase(),
      name: this.nameField(),
      nickname: this.nicknameField() || this.nameField().split(' ')[0],
      age: this.ageField(),
      initialWeight: this.weightField(),
      height: this.heightField(),
      role: 'student',
      coachEmail: 'IA_ASSISTED',
      isOnboarded: false,
      isActive: true
    };

    this.http.post(`${this.apiUrl}/users`, payload).subscribe({
      next: () => {
        this.isBiometricLoading.set(false);
        this.step.set(2); // Proceed to Biometrics
      },
      error: (err) => {
        this.isBiometricLoading.set(false);
        alert('Error al registrar el perfil. ' + (err.error || ''));
      }
    });
  }

  async attemptBiometricLogin() {
    this.isBiometricLoading.set(true);
    const email = await this.biometric.authenticate();
    if (email) {
      this.emailField.set(email);
      // Directly try to complete or at least go to step 1
      this.auth.login(email, () => {
        this.router.navigate(['/app/student/ai-routine']);
      });
    }
    this.isBiometricLoading.set(false);
  }

  async enableBiometrics() {
    this.isBiometricLoading.set(true);
    const success = await this.biometric.register(this.emailField());
    this.isBiometricLoading.set(false);
    this.nextStep();
  }

  prevStep() {
    if (this.step() === 2 && !this.isNewUser()) {
      this.step.set(0);
    } else if (this.step() > 0) {
      this.step.update(s => s - 1);
    }
  }

  toggleEquipment(id: string) {
    const current = this.equipment();
    if (current.includes(id)) {
      this.equipment.set(current.filter(e => e !== id));
    } else {
      this.equipment.set([...current, id]);
    }
  }

  backToModeSelection() {
    this.router.navigate(['/select-mode']);
  }

  setTheme(t: AppTheme) {
    this.theme.setTheme(t);
  }

  completeOnboarding() {
    const email = this.emailField().trim().toLowerCase();
    const payload = {
      email: email,
      goal: this.goal(),
      level: this.level(),
      equipment: this.equipment(),
      age: this.ageField(),
      weight: this.weightField(),
      height: this.heightField()
    };

    // 1. Mark user as IA_ASSISTED and onboarded (or create if new)
    // The backend PUT /users/{email} handles update. 
    // If it's a new user, we should probably POST first. 
    // Let's check user existence first.
    // Use a more silent way to check if user exists (or just try PUT directly and catch error)
    this.http.get(`${this.apiUrl}/users/${email}`).pipe(
      catchError((error) => {
        // If user not found (e.g., 404), create new user
        if (error.status === 404) {
          return this.http.post(`${this.apiUrl}/users`, {
            email: email,
            role: 'student',
            coachEmail: 'IA_ASSISTED',
            isOnboarded: true,
            isActive: true
          });
        }
        // Re-throw other errors
        return of(error); // Or throw error; depending on desired error handling
      })
    ).subscribe(() => this.finishOnboarding(email, payload));
  }

  private finishOnboarding(email: string, payload: any) {
    this.http.put(`${this.apiUrl}/users/${email}`, {
      coachEmail: 'IA_ASSISTED',
      isOnboarded: true,
      age: this.ageField(),
      initialWeight: this.weightField(),
      height: this.heightField()
    }).subscribe(() => {
      this.auth.login(email, () => {
        this.http.post(`${this.apiUrl}/ai-coach/generate-routine`, payload).subscribe(() => {
          this.router.navigate(['/app/student/ai-routine']);
        });
      });
    });
  }
}
