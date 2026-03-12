import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ThemeService, AppTheme } from './theme';

export type Role = 'admin' | 'coach' | 'student';

export interface User {
  id?: string;
  email: string;
  role: Role;
  name?: string;
  nickname?: string;
  age?: number;
  initialWeight?: number;
  height?: number;
  isOnboarded?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  coachEmail?: string;
  theme?: string;
  specialty?: string;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);
  isLoggedIn = computed(() => this.currentUser() !== null);
  isCoach = computed(() => this.currentUser()?.role === 'coach');
  isAdmin = computed(() => this.currentUser()?.role === 'admin');
  loginError = signal<string | null>(null);
  isLoading = signal(false);

  private http = inject(HttpClient);
  private router = inject(Router);
  private usersUrl = 'https://gymproapp.onrender.com/api/users';
  private themeService = inject(ThemeService);

  constructor() {
    const saved = localStorage.getItem('gympro-user');
    if (saved) {
      this.currentUser.set(JSON.parse(saved));
    }
  }

  sendLoginOtp(email: string, onSuccess: () => void, onError: (msg: string) => void) {
    this.loginError.set(null);
    this.isLoading.set(true);

    const normalizedEmail = email.trim().toLowerCase();
    this.http.get<User>(`${this.usersUrl}/${normalizedEmail}`).pipe(
      catchError(err => {
        if (err.status === 404) return of(null);
        throw err;
      })
    ).subscribe({
      next: (user) => {
        if (!user) {
          this.loginError.set('Este correo no está registrado.');
          this.isLoading.set(false);
          onError('no_user');
          return;
        }
        if (user.role === 'student' && user.isActive === false) {
          this.loginError.set('Tu cuenta ha sido desactivada.');
          this.isLoading.set(false);
          onError('disabled');
          return;
        }

        // Send OTP via backend
        this.http.post(`${this.usersUrl.replace('/users', '/auth')}/send-otp`, { email: normalizedEmail }).subscribe({
          next: () => {
            this.isLoading.set(false);
            onSuccess();
          },
          error: () => {
            this.loginError.set('Error al enviar el código.');
            this.isLoading.set(false);
            onError('send_failed');
          }
        });
      },
      error: () => {
        this.loginError.set('Error de conexión.');
        this.isLoading.set(false);
        onError('error');
      }
    });
  }

  verifyLoginOtp(email: string, code: string, onSuccess: (user: User) => void) {
    this.loginError.set(null);
    this.isLoading.set(true);

    const normalizedEmail = email.trim().toLowerCase();
    this.http.post(`${this.usersUrl.replace('/users', '/auth')}/verify-otp`, { email: normalizedEmail, code }).subscribe({
      next: () => {
        // OTP verified, now fetch user details to complete login
        this.http.get<User>(`${this.usersUrl}/${normalizedEmail}`).subscribe(user => {
          if (user.theme) {
            this.themeService.setTheme(user.theme as AppTheme);
          }
          this.currentUser.set(user);
          localStorage.setItem('gympro-user', JSON.stringify(user));
          this.isLoading.set(false);
          onSuccess(user);
        });
      },
      error: (err) => {
        this.loginError.set('Código incorrecto o expirado.');
        this.isLoading.set(false);
      }
    });
  }

  login(email: string, onSuccess?: (user: User) => void) {
    // Keep direct login for internal uses if needed, or redirect to OTP flow
    this.sendLoginOtp(email, () => {
      // Direct login is now deprecated in favor of OTP
      console.warn('Direct login called. Redirecting to OTP UI flow is recommended.');
    }, () => {});
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
    this.router.navigate(['/login']);
  }
}
