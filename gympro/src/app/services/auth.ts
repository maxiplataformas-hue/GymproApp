import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ThemeService, AppTheme } from './theme';

export type Role = 'coach' | 'student';

export interface User {
  id?: string;
  email: string;
  role: Role;
  name?: string;
  age?: number;
  initialWeight?: number;
  height?: number;
  isOnboarded?: boolean;
  isActive?: boolean;
  theme?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);
  isLoggedIn = computed(() => this.currentUser() !== null);
  isCoach = computed(() => this.currentUser()?.role === 'coach');
  loginError = signal<string | null>(null);
  otpSent = signal(false);
  pendingEmail = signal<string | null>(null);
  isLoading = signal(false);

  private http = inject(HttpClient);
  private router = inject(Router);
  private usersUrl = 'https://gymproapp.onrender.com/api/users';
  private otpUrl = 'https://gymproapp.onrender.com/api/otp';
  private themeService = inject(ThemeService);

  constructor() {
    const saved = localStorage.getItem('gympro-user');
    if (saved) {
      this.currentUser.set(JSON.parse(saved));
    }
  }

  /** Step 1: request OTP to be sent to the email */
  requestOtp(email: string) {
    this.loginError.set(null);
    this.isLoading.set(true);

    // First check if user exists in DB
    this.http.get<User>(`${this.usersUrl}/${email}`).pipe(
      catchError(() => of(null))
    ).subscribe(user => {
      if (!user) {
        this.loginError.set('Este correo no está registrado. Contacta a tu Coach.');
        this.isLoading.set(false);
        return;
      }
      if (user.role === 'student' && user.isActive === false) {
        this.loginError.set('Tu cuenta ha sido desactivada. Contacta a tu Coach.');
        this.isLoading.set(false);
        return;
      }
      if (!user.isOnboarded && user.role === 'student') {
        this.loginError.set('Tu cuenta aún no ha sido configurada por tu Coach.');
        this.isLoading.set(false);
        return;
      }

      // Send OTP
      this.http.post(`${this.otpUrl}/send`, { email }).subscribe({
        next: () => {
          this.pendingEmail.set(email);
          this.otpSent.set(true);
          this.isLoading.set(false);
        },
        error: () => {
          this.loginError.set('Error al enviar el código. Intenta nuevamente.');
          this.isLoading.set(false);
        }
      });
    });
  }

  /** Step 2: verify OTP code and log in */
  verifyOtp(code: string) {
    const email = this.pendingEmail();
    if (!email) return;

    this.loginError.set(null);
    this.isLoading.set(true);

    this.http.post<User>(`${this.otpUrl}/verify`, { email, code }).pipe(
      catchError(err => {
        const msg = err.error?.error || 'Código incorrecto o expirado.';
        this.loginError.set(msg);
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe(user => {
      if (!user) return;
      if (user.theme) {
        this.themeService.setTheme(user.theme as AppTheme);
      }
      this.currentUser.set(user);
      localStorage.setItem('gympro-user', JSON.stringify(user));
      this.isLoading.set(false);
      this.otpSent.set(false);
      this.pendingEmail.set(null);
      this.router.navigate(['/app', user.role]);
    });
  }

  updateThemePreference(theme: string) {
    const user = this.currentUser();
    if (user?.email) {
      this.http.put<User>(`${this.usersUrl}/${user.email}`, { theme }).subscribe(updated => {
        this.currentUser.set(updated);
        localStorage.setItem('gympro-user', JSON.stringify(updated));
      });
    }
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('gympro-user');
    this.otpSent.set(false);
    this.pendingEmail.set(null);
    this.router.navigate(['/login']);
  }
}
