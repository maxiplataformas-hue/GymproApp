import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { User } from './auth';
import { PushNotificationService } from './push-notification';

export interface CoachMetric extends User {
  studentCount: number;
  activityLevel: number;
}

export interface AccessLog {
  id?: string;
  email: string;
  role: string;
  timestamp: string;
}

export type MuscleGroup = 'Pecho' | 'Espalda' | 'Pierna' | 'Hombro' | 'Brazo' | 'Core' | 'Glúteo' | 'Todos';
export type Equipment = 'Barra' | 'Mancuerna' | 'Máquina' | 'Libre' | 'Kettlebell' | 'Polea' | 'Ninguno' | 'Barra fija' | 'Paralelas' | 'Banco' | 'Cajón' | 'Cuerda' | 'Cuerdas' | 'Trineo' | 'Ballón medicinal' | 'Cinta' | 'Silla' | 'Escalera' | 'Escalera' | 'Mesa / Barra baja' | 'Escalera' | 'Escalera' | 'Silla' | 'Escalera';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup | string;
  equipment: Equipment | string;
  category: string;
}

export interface RoutineItem {
  id: string;
  exerciseId: string;
  sets: number;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface RoutineAssignment {
  id?: string;
  studentEmail: string;
  date: string; // YYYY-MM-DD
  createdAt?: string;
  items: RoutineItem[];
}

export interface PhysiologicalEntry {
  id?: string;
  studentEmail: string;
  date: string; // YYYY-MM-DD
  weight: number;
  igc?: number;
  measuredBy?: string; // 'coach' | 'student'
}

export interface StudentPhoto {
  id?: string;
  studentEmail: string;
  uploaderEmail: string;
  date: string;
  photoBase64: string;
}

export interface StudentProfile {
  id?: string;
  studentEmail?: string;
  recordDate?: string;
  recordName?: string;
  objective?: string;
  biotype?: string;

  // Advanced Bioimpedance
  bodyFatPercentage?: number;
  muscleMassPercentage?: number;
  visceralFat?: number;
  bioimpedanceData?: string; // Original field, kept for completeness

  // Advanced Anthropometry
  chestCircumference?: number;
  waistCircumference?: number;
  hipCircumference?: number;
  leftArmCircumference?: number;
  rightArmCircumference?: number;
  leftLegCircumference?: number;
  rightLegCircumference?: number;
  anthropometry?: string; // Original field, kept for completeness

  mobilityAnalysis?: string;
  dietPlan?: string;
  supplements?: string;
  adjuncts?: string;
  activityLevel?: string; // Sedentario | Ligero | Moderado | Activo | Muy Activo
}

export interface Notification {
  id: string;
  studentEmail: string;
  coachEmail: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
}

export interface DictionaryConcept {
  id?: string;
  term: string;
  definition: string;
  category: string; // Entrenamiento | Nutrición | Fisiología | Suplementación | Recuperación | Métricas
  coachEmail: string;
  createdAt?: string;
}

// Exercises loaded from backend

@Injectable({
  providedIn: 'root'
})
export class DataService {
  exercises = signal<Exercise[]>([]);
  routines = signal<RoutineAssignment[]>([]);
  physioEntries = signal<PhysiologicalEntry[]>([]);
  allStudents = signal<User[]>([]);
  allCoaches = signal<User[]>([]);
  studentPhotos = signal<Map<string, StudentPhoto[]>>(new Map());
  currentProfiles = signal<StudentProfile[]>([]);
  notifications = signal<Notification[]>([]);
  dictionaryConcepts = signal<DictionaryConcept[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  uniqueCategories = computed(() => {
    const cats = this.exercises().map(e => e.category).filter(Boolean);
    return [...new Set(cats)];
  });

  todayExerciseCount = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayRoutines = this.routines()
      .filter(r => r.date === today)
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA; // Descending
      });
    
    if (todayRoutines.length === 0) return 0;
    
    // Only count exercises from the most recent routine
    return todayRoutines[0].items.length;
  });

  private http = inject(HttpClient);
  private push = inject(PushNotificationService);
  private apiBase = 'https://gymproapp.onrender.com/api';

  constructor() {
    this.startHeartbeat();
    this.loadExercises();
  }

  loadExercises() {
    this.http.get<Exercise[]>(`${this.apiBase}/exercises`).subscribe(data => {
      this.exercises.set(data);
    });
  }

  saveExercise(exercise: Partial<Exercise>) {
    return this.http.post<Exercise>(`${this.apiBase}/exercises`, exercise).pipe(
      tap(() => this.loadExercises())
    );
  }

  deleteExercise(id: string) {
    return this.http.delete(`${this.apiBase}/exercises/${id}`).pipe(
      tap(() => this.loadExercises())
    );
  }

  private startHeartbeat() {
    // Send a pulse every 30 seconds to keep the backend alive on free hosting (Render/Vercel)
    setInterval(() => {
      this.http.get(`${this.apiBase}/status`).subscribe({
        error: (err) => console.log('Heartbeat error:', err)
      });
    }, 30000);
  }

  loadAllStudents(coachEmail?: string) {
    const url = coachEmail
      ? `${this.apiBase}/users?coachEmail=${encodeURIComponent(coachEmail)}`
      : `${this.apiBase}/users`;
    // Forzamos fresh data con headers de no-cache
    this.http.get<User[]>(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }).subscribe(users => {
      const students = users.filter((u: User) => u.role === 'student' && u.isOnboarded);
      this.allStudents.set(students);
    });
  }

  loadCoaches() {
    this.http.get<User[]>(`${this.apiBase}/users/coaches`).subscribe(coaches => {
      this.allCoaches.set(coaches);
    });
  }

  createStudent(user: User, coachEmail?: string) {
    const newUser = { ...user, isActive: true, coachEmail: coachEmail ?? null };
    return this.http.post<User>(`${this.apiBase}/users`, newUser).pipe(
      tap(() => this.loadAllStudents(coachEmail))
    );
  }

  createCoach(user: User) {
    return this.http.post<User>(`${this.apiBase}/users`, { ...user, role: 'coach', isActive: true }).pipe(
      tap(() => this.loadCoaches())
    );
  }

  toggleStudentStatus(email: string, isActive: boolean, coachEmail?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    return this.http.put<User>(`${this.apiBase}/users/${normalizedEmail}`, { isActive }).pipe(
      tap(() => this.loadAllStudents(coachEmail))
    );
  }

  deleteStudent(email: string, coachEmail?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    return this.http.delete(`${this.apiBase}/users/${normalizedEmail}`).pipe(
      tap(() => this.loadAllStudents(coachEmail))
    );
  }

  toggleCoachStatus(email: string, isActive: boolean) {
    return this.http.put(`${this.apiBase}/admin/coaches/${email}/status`, { isActive });
  }

  // --- Metrics ---
  getAccessMetrics(fromIso: string, toIso: string) {
    return this.http.get<{coachCount: number, studentCount: number}>(
      `${this.apiBase}/admin/metrics/access?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
    );
  }

  getAccessDetails(fromIso: string, toIso: string) {
    return this.http.get<AccessLog[]>(
      `${this.apiBase}/admin/metrics/access-details?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
    );
  }

  getTopExercises(fromIso: string, toIso: string) {
    return this.http.get<Array<{id: string, name: string, count: number}>>(
      `${this.apiBase}/admin/metrics/top-exercises?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
    );
  }

  updateUser(email: string, userData: Partial<User>, coachEmail?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    return this.http.put<User>(`${this.apiBase}/users/${normalizedEmail}`, userData).pipe(
      tap(() => this.loadAllStudents(coachEmail))
    );
  }

  loadRoutines(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    this.http.get<RoutineAssignment[]>(`${this.apiBase}/routines/${normalizedEmail}`).subscribe(data => {
      this.routines.set(data);
    });
  }

  loadPhysio(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    this.http.get<PhysiologicalEntry[]>(`${this.apiBase}/physio/${normalizedEmail}`).subscribe(data => {
      this.physioEntries.set(data);
    });
  }

  // Routines - assignment
  assignRoutine(assignment: Omit<RoutineAssignment, 'id'>) {
    // Check if there is already a routine assigned for this user/date
    const existing = this.routines().find(r => r.studentEmail === assignment.studentEmail && r.date === assignment.date);

    let payload: RoutineAssignment = existing
      ? { ...existing, items: [...existing.items, ...assignment.items] }
      : { ...assignment };

    this.http.post<RoutineAssignment>(`${this.apiBase}/routines`, payload).subscribe(saved => {
      this.loadRoutines(assignment.studentEmail);
    });
  }

  getRoutinesForStudent(email: string, date: string) {
    return this.routines().find(r => r.studentEmail === email && r.date === date);
  }

  toggleRoutineItemComplete(routineId: string, itemId: string) {
    const routine = this.routines().find(r => r.id === routineId);
    if (!routine) return;

    const updatedItems = routine.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i);
    const updatedRoutine = { ...routine, items: updatedItems };

    this.http.post<RoutineAssignment>(`${this.apiBase}/routines`, updatedRoutine).subscribe(saved => {
      this.loadRoutines(routine.studentEmail);
    });
  }

  deleteRoutineItem(routineId: string, itemId: string) {
    const routine = this.routines().find(r => r.id === routineId);
    if (!routine) return;

    this.http.delete(`${this.apiBase}/routines/${routine.studentEmail}/${routine.date}/${itemId}`).subscribe(() => {
      this.loadRoutines(routine.studentEmail);
    });
  }

  // Physio
  addPhysioEntry(entry: Omit<PhysiologicalEntry, 'id'>) {
    this.http.post<PhysiologicalEntry>(`${this.apiBase}/physio`, entry).subscribe(saved => {
      this.loadPhysio(entry.studentEmail);
    });
  }

  deletePhysioEntry(id: string, studentEmail: string) {
    this.http.delete(`${this.apiBase}/physio/${id}`).subscribe(() => {
      this.loadPhysio(studentEmail);
    });
  }

  getStudentHistory(email: string) {
    return computed(() => {
      return this.physioEntries()
        .filter(p => p.studentEmail === email)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  }

  // Photos
  loadPhotos(studentEmail: string) {
    this.http.get<StudentPhoto[]>(`${this.apiBase}/photos/${studentEmail}`).subscribe(photos => {
      const currentMap = new Map(this.studentPhotos());
      currentMap.set(studentEmail, photos);
      this.studentPhotos.set(currentMap);
    });
  }

  uploadPhoto(photo: StudentPhoto) {
    this.http.post<StudentPhoto>(`${this.apiBase}/photos`, photo).subscribe(() => {
      this.loadPhotos(photo.studentEmail);
    });
  }

  deletePhoto(id: string, studentEmail: string) {
    this.http.delete(`${this.apiBase}/photos/${id}`).subscribe(() => {
      this.loadPhotos(studentEmail);
    });
  }

  // Profile (Technical/Clinical) History
  loadProfile(studentEmail: string) {
    this.currentProfiles.set([]); // Clear previous array
    this.http.get<StudentProfile[]>(`${this.apiBase}/profiles/${studentEmail}`).subscribe({
      next: (profiles) => {
        if (profiles && profiles.length > 0) {
          this.currentProfiles.set(profiles);
        }
      },
      error: () => {
        // Assume empty/no profile history
        this.currentProfiles.set([]);
      }
    });
  }

  saveProfile(studentEmail: string, profile: StudentProfile) {
    this.http.post<StudentProfile>(`${this.apiBase}/profiles/${studentEmail}`, profile).subscribe({
      next: (saved) => {
        // Reload the full history to show the new snapshot
        this.loadProfile(studentEmail);
        alert('Nueva Evaluación guardada exitosamente en el historial.');
      },
      error: () => alert('Error al guardar Evaluación Clínica.')
    });
  }

  deleteProfile(id: string, studentEmail: string) {
    this.http.delete(`${this.apiBase}/profiles/${id}`).subscribe({
      next: () => {
        this.loadProfile(studentEmail);
      },
      error: () => alert('Error al eliminar la Evaluación Clínica.')
    });
  }

  loadNotifications(email: string) {
    this.http.get<Notification[]>(`${this.apiBase}/notifications/${email}`).subscribe(data => {
      const currentUnread = this.notifications().filter(n => !n.isRead).length;
      const newUnread = data.filter(n => !n.isRead).length;

      if (newUnread > currentUnread) {
        // Enviar notificación nativa para el mensaje más reciente si es nuevo
        const latest = data.find(n => !n.isRead);
        if (latest) {
          this.push.sendLocalNotification('CoachPro - Nueva Rutina', latest.message);
        }
      }
      this.notifications.set(data);
    });
  }

  markAsRead(id: string, email: string) {
    this.http.put(`${this.apiBase}/notifications/${id}/read`, {}).subscribe(() => {
      this.loadNotifications(email);
    });
  }

  markAllAsRead(email: string) {
    this.http.put(`${this.apiBase}/notifications/read-all/${email}`, {}).subscribe(() => {
      this.loadNotifications(email);
    });
  }

  loadCoachMetrics() {
    this.http.get<any[]>(`${this.apiBase}/users/coaches/metrics`).subscribe(metrics => {
      this.allCoaches.set(metrics);
    });
  }

  askCoachIA(message: string, email?: string) {
    return this.http.post<{ response: string }>(`${this.apiBase}/chat`, { message, email });
  }

  // --- Dictionary ---
  loadDictionary() {
    this.http.get<DictionaryConcept[]>(`${this.apiBase}/dictionary`).subscribe(data => {
      this.dictionaryConcepts.set(data.sort((a, b) => a.term.localeCompare(b.term)));
    });
  }

  saveConcept(concept: Omit<DictionaryConcept, 'id'>) {
    return this.http.post<DictionaryConcept>(`${this.apiBase}/dictionary`, concept).pipe(
      tap(() => this.loadDictionary())
    );
  }

  updateConcept(id: string, concept: Partial<DictionaryConcept>, requesterEmail: string) {
    return this.http.put<DictionaryConcept>(
      `${this.apiBase}/dictionary/${id}?requesterEmail=${encodeURIComponent(requesterEmail)}`,
      concept
    ).pipe(tap(() => this.loadDictionary()));
  }

  deleteConcept(id: string, requesterEmail: string) {
    return this.http.delete(
      `${this.apiBase}/dictionary/${id}?requesterEmail=${encodeURIComponent(requesterEmail)}`
    ).pipe(tap(() => this.loadDictionary()));
  }
}
