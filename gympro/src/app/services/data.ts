import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from './auth';

export type MuscleGroup = 'Pecho' | 'Espalda' | 'Pierna' | 'Hombro' | 'Brazo' | 'Core';
export type Equipment = 'Barra' | 'Mancuerna' | 'Máquina' | 'Libre';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
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
  items: RoutineItem[];
}

export interface PhysiologicalEntry {
  id?: string;
  studentEmail: string;
  date: string; // YYYY-MM-DD
  weight: number;
  igc?: number;
}

// Initial Mock Exercises
const MOCK_EXERCISES: Exercise[] = [
  { id: '1', name: 'Press de Banca', muscleGroup: 'Pecho', equipment: 'Barra' },
  { id: '2', name: 'Aperturas', muscleGroup: 'Pecho', equipment: 'Mancuerna' },
  { id: '3', name: 'Dominadas', muscleGroup: 'Espalda', equipment: 'Libre' },
  { id: '4', name: 'Remo en Polea', muscleGroup: 'Espalda', equipment: 'Máquina' },
  { id: '5', name: 'Sentadilla', muscleGroup: 'Pierna', equipment: 'Barra' },
  { id: '6', name: 'Prensa', muscleGroup: 'Pierna', equipment: 'Máquina' },
  { id: '7', name: 'Press Militar', muscleGroup: 'Hombro', equipment: 'Mancuerna' },
  { id: '8', name: 'Curl Biceps', muscleGroup: 'Brazo', equipment: 'Barra' },
  { id: '9', name: 'Extensión Triceps', muscleGroup: 'Brazo', equipment: 'Máquina' },
  { id: '10', name: 'Crunch Abdominal', muscleGroup: 'Core', equipment: 'Libre' }
];

@Injectable({
  providedIn: 'root'
})
export class DataService {
  exercises = signal<Exercise[]>(MOCK_EXERCISES);
  routines = signal<RoutineAssignment[]>([]);
  physioEntries = signal<PhysiologicalEntry[]>([]);
  allStudents = signal<User[]>([]);

  private http = inject(HttpClient);
  private apiBase = 'http://localhost:8080/api';

  constructor() {
    this.loadAllStudents();
  }

  loadAllStudents() {
    this.http.get<User[]>(`${this.apiBase}/users`).subscribe(users => {
      const students = users.filter((u: User) => u.role === 'student' && u.isOnboarded);
      this.allStudents.set(students);
    });
  }

  loadRoutines(email: string) {
    this.http.get<RoutineAssignment[]>(`${this.apiBase}/routines/${email}`).subscribe(data => {
      this.routines.set(data);
    });
  }

  loadPhysio(email: string) {
    this.http.get<PhysiologicalEntry[]>(`${this.apiBase}/physio/${email}`).subscribe(data => {
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
    return computed(() =>
      this.routines().find(r => r.studentEmail === email && r.date === date)
    );
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

  // Physio
  addPhysioEntry(entry: Omit<PhysiologicalEntry, 'id'>) {
    this.http.post<PhysiologicalEntry>(`${this.apiBase}/physio`, entry).subscribe(saved => {
      this.loadPhysio(entry.studentEmail);
    });
  }

  getStudentHistory(email: string) {
    return computed(() => {
      return this.physioEntries()
        .filter(p => p.studentEmail === email)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  }
}
