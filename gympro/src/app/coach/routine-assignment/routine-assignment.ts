import { Component, inject, input, computed, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../services/auth';
import { DataService, Exercise, MuscleGroup, Equipment } from '../../services/data';

@Component({
  selector: 'app-routine-assignment',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './routine-assignment.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoutineAssignment {
  student = input.required<User>();
  data = inject(DataService);

  assignmentDate = signal(new Date().toISOString().split('T')[0]);

  // Available Exercises
  allExercises = computed(() => this.data.exercises());
  muscleGroups: MuscleGroup[] = ['Pecho', 'Espalda', 'Pierna', 'Hombro', 'Brazo', 'Core'];
  equipmentTypes: Equipment[] = ['Barra', 'Mancuerna', 'Máquina', 'Libre'];

  selectedMuscle = signal<MuscleGroup | ''>('');
  selectedEquipment = signal<Equipment | ''>('');

  filteredExercises = computed(() => {
    return this.allExercises().filter(e => {
      const matchM = this.selectedMuscle() === '' || e.muscleGroup === this.selectedMuscle();
      const matchE = this.selectedEquipment() === '' || e.equipment === this.selectedEquipment();
      return matchM && matchE;
    });
  });

  // New assignment Form State
  selectedExercise = signal<Exercise | null>(null);
  assignmentSets = signal<number | null>(null);
  assignmentReps = signal<number | null>(null);
  assignmentWeight = signal<number | null>(null);

  // New physio entry
  newIgc = signal<number | null>(null);

  // Existing routines for this student/date
  currentRoutine = computed(() => this.data.getRoutinesForStudent(this.student().email, this.assignmentDate()));

  currentRoutineJoined = computed(() => {
    const r = this.currentRoutine();
    if (!r) return [];
    return r.items.map(i => {
      const ex = this.allExercises().find(e => e.id === i.exerciseId);
      return { ...i, name: ex?.name || 'Desconocido' };
    });
  });

  constructor() {
    effect(() => {
      // Reset forms when student changes
      const s = this.student();
      this.selectedExercise.set(null);
      this.selectedMuscle.set('');
      this.selectedEquipment.set('');
      this.assignmentSets.set(null);
      this.assignmentReps.set(null);
      this.assignmentWeight.set(null);
      this.newIgc.set(null);

      if (s) {
        this.data.loadRoutines(s.email);
        this.data.loadPhysio(s.email);
      }
    });
  }

  selectDate(d: string) {
    this.assignmentDate.set(d);
  }

  saveIgc() {
    const igc = this.newIgc();
    if (igc !== null && igc > 0) {
      this.data.addPhysioEntry({
        studentEmail: this.student().email,
        date: this.assignmentDate(),
        weight: this.student().initialWeight || 0, // Fallback if no history exists
        igc: igc,
        measuredBy: 'coach'
      });
      this.newIgc.set(null);
    }
  }

  addExercise() {
    const ex = this.selectedExercise();
    const sets = this.assignmentSets();
    const reps = this.assignmentReps();
    const weight = this.assignmentWeight() || 0;

    if (ex && sets && reps) {
      this.data.assignRoutine({
        studentEmail: this.student().email,
        date: this.assignmentDate(),
        items: [{
          id: Date.now().toString(),
          exerciseId: ex.id,
          sets,
          reps,
          weight,
          completed: false
        }]
      });
      // Reset
      this.selectedExercise.set(null);
      this.assignmentSets.set(null);
      this.assignmentReps.set(null);
      this.assignmentWeight.set(null);
    }
  }

  deleteItem(itemId: string) {
    const r = this.currentRoutine();
    if (r && r.id) {
      this.data.deleteRoutineItem(r.id, itemId);
    }
  }
}
