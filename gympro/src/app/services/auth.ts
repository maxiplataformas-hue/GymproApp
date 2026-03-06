import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

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
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);
  isLoggedIn = computed(() => this.currentUser() !== null);
  isCoach = computed(() => this.currentUser()?.role === 'coach');

  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:8080/api/users';

  constructor() {
    // We still keep the current session in localStorage so F5 refresh doesn't log them out
    const saved = localStorage.getItem('gympro-user');
    if (saved) {
      this.currentUser.set(JSON.parse(saved));
    }
  }

  login(email: string) {
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
        this.currentUser.set(user);
        localStorage.setItem('gympro-user', JSON.stringify(user));
        this.router.navigate(['/app', user.role]);
      } else {
        // New user
        const newUser: User = { email, role, isOnboarded: false };
        if (isCoach) {
          newUser.isOnboarded = true;
          this.http.post<User>(this.apiUrl, newUser).subscribe(created => {
            this.currentUser.set(created);
            localStorage.setItem('gympro-user', JSON.stringify(created));
            this.router.navigate(['/app/coach']);
          });
        } else {
          // Temporary local state before the student completes onboarding POST
          this.currentUser.set(newUser);
          this.router.navigate(['/onboarding']);
        }
      }
    });
  }

  completeOnboarding(data: Partial<User>) {
    const current = this.currentUser();
    if (current) {
      const newUser: User = { ...current, ...data, isOnboarded: true };
      // Save to MongoDB
      this.http.post<User>(this.apiUrl, newUser).subscribe(created => {
        this.currentUser.set(created);
        localStorage.setItem('gympro-user', JSON.stringify(created));
        this.router.navigate(['/app', created.role]);
      });
    }
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('gympro-user');
    this.router.navigate(['/login']);
  }
}
