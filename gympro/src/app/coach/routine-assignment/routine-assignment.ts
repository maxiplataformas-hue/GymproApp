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
  muscleGroups: MuscleGroup[] = ['Pecho', 'Espalda', 'Pierna', 'Hombro', 'Brazo', 'Core', 'Glúteo', 'Todos'];
  equipmentTypes: Equipment[] = ['Barra', 'Mancuerna', 'Máquina', 'Libre', 'Kettlebell', 'Polea', 'Ninguno'];
  categories = ['Gimnasio', 'Calistenia', 'HIIT', 'CrossFit', 'Running', 'Casa'];

  selectedMuscle = signal<MuscleGroup | ''>('');
  selectedEquipment = signal<Equipment | ''>('');
  selectedCategory = signal<string>('');

  filteredExercises = computed(() => {
    return this.allExercises().filter(e => {
      const matchM = this.selectedMuscle() === '' || e.muscleGroup === this.selectedMuscle();
      const matchE = this.selectedEquipment() === '' || e.equipment === this.selectedEquipment();
      const matchC = this.selectedCategory() === '' || e.category === this.selectedCategory();
      return matchM && matchE && matchC;
    });
  });

  // New assignment Form State
  selectedExercise = signal<Exercise | null>(null);
  assignmentSets = signal<number | null>(null);
  assignmentReps = signal<number | null>(null);
  assignmentWeight = signal<number | null>(null);

  // Multi-day replication state
  targetDates = signal<string[]>([]);
  
  // Calendar state
  showCalendar = signal(false);
  calendarMonth = signal(new Date());

  monthName = computed(() => {
    const date = this.calendarMonth();
    return date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  });

  calendarDays = computed(() => {
    const year = this.calendarMonth().getFullYear();
    const month = this.calendarMonth().getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: { date: Date, currentMonth: boolean, dateStr: string }[] = [];
    
    // Fill previous month days to start on Monday
    let firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = firstDayOfWeek; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({ date: d, currentMonth: false, dateStr: this.formatDate(d) });
    }
    
    // Loop through current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const d = new Date(year, month, i);
        days.push({ date: d, currentMonth: true, dateStr: this.formatDate(d) });
    }
    
    // Fill next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({ date: d, currentMonth: false, dateStr: this.formatDate(d) });
    }
    
    return days;
  });

  highlightedDates = computed(() => {
    const current = this.currentRoutine();
    if (!current || current.items.length === 0) return new Set<string>();

    const currentExIds = [...current.items.map(i => i.exerciseId)].sort().join(',');
    const matchDates = new Set<string>();
    
    this.data.routines().forEach(r => {
      // Check if this routine belongs to the student and has items
      if (r.studentEmail === this.student().email && r.items.length > 0) {
        const rExIds = [...r.items.map(i => i.exerciseId)].sort().join(',');
        if (rExIds === currentExIds) {
          matchDates.add(r.date);
        }
      }
    });

    return matchDates;
  });



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
      this.selectedCategory.set('');
      this.assignmentSets.set(null);
      this.assignmentReps.set(null);
      this.assignmentWeight.set(null);

      if (s) {
        this.data.loadRoutines(s.email);
      }
    });
  }

  selectDate(d: string) {
    this.assignmentDate.set(d);
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

  addTargetDate(event: Event) {
    const input = event.target as HTMLInputElement;
    const date = input.value;
    if (!date) return;
    
    // Prevent adding the same date multiple times or the primary date
    if (!this.targetDates().includes(date) && date !== this.assignmentDate()) {
      this.targetDates.set([...this.targetDates(), date].sort());
    }
    input.value = ''; // Reset input
  }

  removeTargetDate(date: string) {
    this.targetDates.set(this.targetDates().filter(d => d !== date));
  }

  assignToMultipleDays() {
    const itemsToCopy = this.currentRoutine()?.items;
    const dates = this.targetDates();
    
    if (!itemsToCopy || itemsToCopy.length === 0 || dates.length === 0) return;

    // Simulate sending payloads for each date selected
    dates.forEach(date => {
      // Re-generate unique IDs for each item to avoid duplication bugs in JSON
      const copiedItems = itemsToCopy.map((item, index) => ({
        ...item,
        id: Date.now().toString() + index + Math.random().toString().substring(2, 6)
      }));

      this.data.assignRoutine({
        studentEmail: this.student().email,
        date: date,
        items: copiedItems
      });
    });

    // Clear after assign
    this.targetDates.set([]);
    alert(`Rutina replicada exitosamente en ${dates.length} días adicionales.`);
  }

  changeMonth(delta: number) {
    const d = new Date(this.calendarMonth());
    d.setMonth(d.getMonth() + delta);
    this.calendarMonth.set(d);
  }

  private formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}


