import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
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
  anthropometry?: string;
  bioimpedanceData?: string;
  mobilityAnalysis?: string;
  dietPlan?: string;
  supplements?: string;
  adjuncts?: string;
}

// Initial Mock Exercises
const MOCK_EXERCISES: Exercise[] = [
  // Pecho
  { id: '1', name: 'Press de Banca Plano', muscleGroup: 'Pecho', equipment: 'Barra' },
  { id: '2', name: 'Press de Banca Inclinado', muscleGroup: 'Pecho', equipment: 'Barra' },
  { id: '3', name: 'Press de Banca Declinado', muscleGroup: 'Pecho', equipment: 'Barra' },
  { id: '4', name: 'Press con Mancuernas Plano', muscleGroup: 'Pecho', equipment: 'Mancuerna' },
  { id: '5', name: 'Press con Mancuernas Inclinado', muscleGroup: 'Pecho', equipment: 'Mancuerna' },
  { id: '6', name: 'Aperturas Planas', muscleGroup: 'Pecho', equipment: 'Mancuerna' },
  { id: '7', name: 'Aperturas Inclinadas', muscleGroup: 'Pecho', equipment: 'Mancuerna' },
  { id: '8', name: 'Peck Deck (Mariposa)', muscleGroup: 'Pecho', equipment: 'Máquina' },
  { id: '9', name: 'Cruces en Polea', muscleGroup: 'Pecho', equipment: 'Máquina' },
  { id: '10', name: 'Press de Pecho en Máquina', muscleGroup: 'Pecho', equipment: 'Máquina' },
  { id: '11', name: 'Pullover', muscleGroup: 'Pecho', equipment: 'Mancuerna' },
  { id: '12', name: 'Flexiones (Push-ups)', muscleGroup: 'Pecho', equipment: 'Libre' },
  { id: '13', name: 'Fondos en Paralelas (Pecho)', muscleGroup: 'Pecho', equipment: 'Libre' },

  // Espalda
  { id: '14', name: 'Peso Muerto Convencional', muscleGroup: 'Espalda', equipment: 'Barra' },
  { id: '15', name: 'Remo con Barra (Pendlay)', muscleGroup: 'Espalda', equipment: 'Barra' },
  { id: '16', name: 'Remo con Barra (Yates)', muscleGroup: 'Espalda', equipment: 'Barra' },
  { id: '17', name: 'Remo con Mancuerna a 1 Mano', muscleGroup: 'Espalda', equipment: 'Mancuerna' },
  { id: '18', name: 'Remo en Polea Baja (Gironda)', muscleGroup: 'Espalda', equipment: 'Máquina' },
  { id: '19', name: 'Jalón al Pecho', muscleGroup: 'Espalda', equipment: 'Máquina' },
  { id: '20', name: 'Jalón Tras Nuca', muscleGroup: 'Espalda', equipment: 'Máquina' },
  { id: '21', name: 'Remo en T', muscleGroup: 'Espalda', equipment: 'Máquina' },
  { id: '22', name: 'Pullover en Polea Alta', muscleGroup: 'Espalda', equipment: 'Máquina' },
  { id: '23', name: 'Dominadas Prontas (Pull-ups)', muscleGroup: 'Espalda', equipment: 'Libre' },
  { id: '24', name: 'Dominadas Supinas (Chin-ups)', muscleGroup: 'Espalda', equipment: 'Libre' },
  { id: '25', name: 'Extensiones Lumbares', muscleGroup: 'Espalda', equipment: 'Máquina' },

  // Pierna
  { id: '26', name: 'Sentadilla Libre (Back Squat)', muscleGroup: 'Pierna', equipment: 'Barra' },
  { id: '27', name: 'Sentadilla Frontal', muscleGroup: 'Pierna', equipment: 'Barra' },
  { id: '28', name: 'Peso Muerto Rumano', muscleGroup: 'Pierna', equipment: 'Barra' },
  { id: '29', name: 'Peso Muerto Sumo', muscleGroup: 'Pierna', equipment: 'Barra' },
  { id: '30', name: 'Zancadas (Lunges) con Barra', muscleGroup: 'Pierna', equipment: 'Barra' },
  { id: '31', name: 'Hip Thrust con Barra', muscleGroup: 'Pierna', equipment: 'Barra' },
  { id: '32', name: 'Sentadilla Búlgara con Mancuernas', muscleGroup: 'Pierna', equipment: 'Mancuerna' },
  { id: '33', name: 'Zancadas con Mancuernas', muscleGroup: 'Pierna', equipment: 'Mancuerna' },
  { id: '34', name: 'Peso Muerto Rumano con Mancuernas', muscleGroup: 'Pierna', equipment: 'Mancuerna' },
  { id: '35', name: 'Prensa Inclinada (Leg Press)', muscleGroup: 'Pierna', equipment: 'Máquina' },
  { id: '36', name: 'Extensión de Cuádriceps', muscleGroup: 'Pierna', equipment: 'Máquina' },
  { id: '37', name: 'Curl de Isquios Tumbado', muscleGroup: 'Pierna', equipment: 'Máquina' },
  { id: '38', name: 'Curl de Isquios Sentado', muscleGroup: 'Pierna', equipment: 'Máquina' },
  { id: '39', name: 'Máquina de Abductores', muscleGroup: 'Pierna', equipment: 'Máquina' },
  { id: '40', name: 'Máquina de Adductores', muscleGroup: 'Pierna', equipment: 'Máquina' },
  { id: '41', name: 'Sentadilla Hack (Hack Squat)', muscleGroup: 'Pierna', equipment: 'Máquina' },
  { id: '42', name: 'Sentadilla en Máquina Smith', muscleGroup: 'Pierna', equipment: 'Máquina' },
  { id: '43', name: 'Elevación de Talones de Pie', muscleGroup: 'Pierna', equipment: 'Máquina' },
  { id: '44', name: 'Elevación de Talones Sentado', muscleGroup: 'Pierna', equipment: 'Máquina' },

  // Hombro
  { id: '46', name: 'Press Militar de Pie', muscleGroup: 'Hombro', equipment: 'Barra' },
  { id: '47', name: 'Press Militar Sentado', muscleGroup: 'Hombro', equipment: 'Barra' },
  { id: '48', name: 'Remo al Mentón', muscleGroup: 'Hombro', equipment: 'Barra' },
  { id: '49', name: 'Press Arnold', muscleGroup: 'Hombro', equipment: 'Mancuerna' },
  { id: '50', name: 'Press de Hombros Sentado', muscleGroup: 'Hombro', equipment: 'Mancuerna' },
  { id: '51', name: 'Elevaciones Laterales', muscleGroup: 'Hombro', equipment: 'Mancuerna' },
  { id: '52', name: 'Elevaciones Frontales', muscleGroup: 'Hombro', equipment: 'Mancuerna' },
  { id: '53', name: 'Pájaros (Deltoides Posterior)', muscleGroup: 'Hombro', equipment: 'Mancuerna' },
  { id: '54', name: 'Encogimientos (Trapecios)', muscleGroup: 'Hombro', equipment: 'Mancuerna' },
  { id: '55', name: 'Elevaciones Laterales en Polea', muscleGroup: 'Hombro', equipment: 'Máquina' },
  { id: '56', name: 'Press de Hombros en Máquina', muscleGroup: 'Hombro', equipment: 'Máquina' },
  { id: '57', name: 'Pájaros en Pec Deck', muscleGroup: 'Hombro', equipment: 'Máquina' },

  // Brazo
  { id: '58', name: 'Curl con Barra Recta', muscleGroup: 'Brazo', equipment: 'Barra' },
  { id: '59', name: 'Curl con Barra EZ', muscleGroup: 'Brazo', equipment: 'Barra' },
  { id: '60', name: 'Press Francés', muscleGroup: 'Brazo', equipment: 'Barra' },
  { id: '61', name: 'Curl Alterno con Mancuernas', muscleGroup: 'Brazo', equipment: 'Mancuerna' },
  { id: '62', name: 'Curl Martillo', muscleGroup: 'Brazo', equipment: 'Mancuerna' },
  { id: '63', name: 'Curl Concentrado', muscleGroup: 'Brazo', equipment: 'Mancuerna' },
  { id: '64', name: 'Patada de Tríceps', muscleGroup: 'Brazo', equipment: 'Mancuerna' },
  { id: '65', name: 'Extensión Tríceps Tras Nuca', muscleGroup: 'Brazo', equipment: 'Mancuerna' },
  { id: '66', name: 'Curl en Polea Baja', muscleGroup: 'Brazo', equipment: 'Máquina' },
  { id: '67', name: 'Extensión de Tríceps en Polea', muscleGroup: 'Brazo', equipment: 'Máquina' },
  { id: '68', name: 'Extensión Tríceps con Cuerda', muscleGroup: 'Brazo', equipment: 'Máquina' },
  { id: '69', name: 'Curl en Banco Scott (Máquina)', muscleGroup: 'Brazo', equipment: 'Máquina' },
  { id: '70', name: 'Fondos en Paralelas (Tríceps)', muscleGroup: 'Brazo', equipment: 'Libre' },

  // Core
  { id: '71', name: 'Rueda Abdominal (Ab Roller)', muscleGroup: 'Core', equipment: 'Libre' },
  { id: '72', name: 'Crunch Abdominal', muscleGroup: 'Core', equipment: 'Libre' },
  { id: '73', name: 'Elevación de Piernas Colgado', muscleGroup: 'Core', equipment: 'Libre' },
  { id: '74', name: 'Plancha (Plank)', muscleGroup: 'Core', equipment: 'Libre' },
  { id: '75', name: 'Russian Twists', muscleGroup: 'Core', equipment: 'Libre' },
  { id: '76', name: 'Crunch en Polea Alta', muscleGroup: 'Core', equipment: 'Máquina' },
  { id: '77', name: 'Máquina de Abdomen', muscleGroup: 'Core', equipment: 'Máquina' }
];

@Injectable({
  providedIn: 'root'
})
export class DataService {
  exercises = signal<Exercise[]>(MOCK_EXERCISES);
  routines = signal<RoutineAssignment[]>([]);
  physioEntries = signal<PhysiologicalEntry[]>([]);
  allStudents = signal<User[]>([]);
  studentPhotos = signal<Map<string, StudentPhoto[]>>(new Map());
  currentProfiles = signal<StudentProfile[]>([]);

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

  createStudent(user: User) {
    const newUser = { ...user, isActive: true };
    return this.http.post<User>(`${this.apiBase}/users`, newUser).pipe(
      tap(() => this.loadAllStudents())
    );
  }

  toggleStudentStatus(email: string, isActive: boolean) {
    return this.http.put<User>(`${this.apiBase}/users/${email}`, { isActive }).pipe(
      tap(() => this.loadAllStudents())
    );
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
}
