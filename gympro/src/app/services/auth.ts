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

  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'https://gymproapp.onrender.com/api/users';
  private themeService = inject(ThemeService);

  constructor() {
    // We still keep the current session in localStorage so F5 refresh doesn't log them out
    const saved = localStorage.getItem('gympro-user');
    if (saved) {
      this.currentUser.set(JSON.parse(saved));
    }
  }

  login(email: string) {
    this.loginError.set(null); // Reset error
    const isCoach = email.toLowerCase() === 'maxiplataformas@gmail.com';
    const role: Role = isCoach ? 'coach' : 'student';

    this.http.get<User>(`${this.apiUrl}/${email}`).pipe(
      catchError(err => {
        // User not found in MongoDB
        return of(null);
      })
    ).subscribe(user => {
      if (user) {
        // User exists in BD
        if (!user.isOnboarded && !isCoach) {
          this.loginError.set('Tu cuenta aún no ha sido configurada por tu Coach.');
          return;
        }
        if (user.role === 'student' && user.isActive === false) {
          this.loginError.set('Tu cuenta ha sido desactivada. Por favor, ponte en contacto con tu Coach.');
          return;
        }
        if (user.theme) {
          this.themeService.setTheme(user.theme as AppTheme);
        }
        this.currentUser.set(user);
        localStorage.setItem('gympro-user', JSON.stringify(user));
        this.router.navigate(['/app', user.role]);
      } else {
        // New user
        if (isCoach) {
          const newUser: User = { email, role, isOnboarded: true, isActive: true };
          this.http.post<User>(this.apiUrl, newUser).subscribe(created => {
            this.currentUser.set(created);
            localStorage.setItem('gympro-user', JSON.stringify(created));
            this.router.navigate(['/app/coach']);
          });
        } else {
          // Block student login
          this.loginError.set('Tu cuenta aún no ha sido configurada por tu Coach.');
        }
      }
    });
  }


  updateThemePreference(theme: string) {
    const user = this.currentUser();
    if (user && user.email) {
      this.http.put<User>(`${this.apiUrl}/${user.email}`, { theme }).subscribe(updated => {
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
