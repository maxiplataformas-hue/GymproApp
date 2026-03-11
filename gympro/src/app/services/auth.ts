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

  login(email: string, onSuccess?: (user: User) => void) {
    this.loginError.set(null);
    this.isLoading.set(true);

    const normalizedEmail = email.trim().toLowerCase();
    this.http.get<User>(`${this.usersUrl}/${normalizedEmail}`).subscribe({
      next: (user) => {
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

        if (user.theme) {
          this.themeService.setTheme(user.theme as AppTheme);
        }
        this.currentUser.set(user);
        localStorage.setItem('gympro-user', JSON.stringify(user));
        this.isLoading.set(false);

        if (onSuccess) {
          onSuccess(user);
        } else {
          this.router.navigate(['/app', user.role]);
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        if (err.status === 404) {
          this.loginError.set('Este correo no está registrado. Contacta a tu Coach.');
        } else {
          this.loginError.set('Error de servidor. Reintenta en un momento.');
        }
        this.isLoading.set(false);
      }
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
    this.router.navigate(['/login']);
  }
}
