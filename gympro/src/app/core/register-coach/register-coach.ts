import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

type Step = 'form' | 'otp' | 'success';

@Component({
  selector: 'app-register-coach',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register-coach.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterCoach {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiBase = 'https://gymproapp.onrender.com/api';

  step = signal<Step>('form');
  isLoading = signal(false);
  errorMsg = signal<string | null>(null);
  successEmail = signal('');

  registrationForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    specialty: new FormControl('', [Validators.required]),
  });

  otpControl = new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]);

  // Step 1: Submit personal info, check for duplicates, send OTP
  onSubmitForm() {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    const { email, name, specialty } = this.registrationForm.getRawValue();
    const normalizedEmail = email!.trim().toLowerCase();

    this.isLoading.set(true);
    this.errorMsg.set(null);

    // Check if email is already registered
    this.http.get<any>(`${this.apiBase}/users/${normalizedEmail}`).subscribe({
      next: () => {
        // User exists
        this.isLoading.set(false);
        this.errorMsg.set('Este correo ya está registrado en la plataforma. Si tienes una cuenta, inicia sesión directamente.');
      },
      error: (err) => {
        if (err.status === 404) {
          // User doesn't exist — send OTP
          this.sendOtp(normalizedEmail);
        } else {
          this.isLoading.set(false);
          this.errorMsg.set('Error de conexión. Intenta de nuevo.');
        }
      }
    });
  }

  private sendOtp(email: string) {
    this.http.post<any>(`${this.apiBase}/auth/send-otp-registration`, { email }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successEmail.set(email);
        this.step.set('otp');
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMsg.set('No se pudo enviar el código de verificación. Intenta de nuevo.');
      }
    });
  }

  resendOtp() {
    const email = this.successEmail();
    if (!email) return;
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.sendOtp(email);
  }

  // Step 2: Verify OTP and create coach account
  onVerifyOtp() {
    if (this.otpControl.invalid) {
      this.otpControl.markAsTouched();
      return;
    }

    const code = this.otpControl.value!;
    const email = this.successEmail();
    const { name, specialty } = this.registrationForm.getRawValue();

    this.isLoading.set(true);
    this.errorMsg.set(null);

    // Verify OTP
    this.http.post<any>(`${this.apiBase}/auth/verify-otp-registration`, { email, code }).subscribe({
      next: () => {
        // OTP valid — create coach user
        const newCoach = {
          email,
          name: name?.trim(),
          specialty: specialty?.trim(),
          role: 'coach',
          isActive: true,
          isOnboarded: false,
        };

        this.http.post<any>(`${this.apiBase}/users`, newCoach).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.step.set('success');
          },
          error: (err) => {
            this.isLoading.set(false);
            const msg = err.error || 'Error al crear la cuenta. Intenta de nuevo.';
            this.errorMsg.set(msg);
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMsg.set('Código incorrecto o expirado. Verifica e intenta de nuevo.');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
