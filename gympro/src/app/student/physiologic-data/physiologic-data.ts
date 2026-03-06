import { Component, inject, computed } from '@angular/core';
import { AuthService } from '../../services/auth';
import { DataService } from '../../services/data';

@Component({
  selector: 'app-physiologic-data',
  standalone: true,
  templateUrl: './physiologic-data.html'
})
export class PhysiologicData {
  auth = inject(AuthService);
  data = inject(DataService);

  user = computed(() => this.auth.currentUser());
  history = computed(() => this.data.getStudentHistory(this.user()?.email || '')());

  // Calculate BMI
  bmi = computed(() => {
    const u = this.user();
    if (!u || !u.height || !u.initialWeight) return 0;
    // Current weight or initial
    const hList = this.history();
    const currentWeight = hList.length > 0 ? hList[hList.length - 1].weight : u.initialWeight;
    const heightInM = u.height / 100;
    return +(currentWeight / (heightInM * heightInM)).toFixed(1);
  });

  bmiStatus = computed(() => {
    const b = this.bmi();
    if (b < 18.5) return 'Bajo Peso';
    if (b < 25) return 'Normal';
    if (b < 30) return 'Sobrepeso';
    return 'Obesidad';
  });

  // Latest IGC (Body Fat) if coach measured it
  latestIgc = computed(() => {
    const hList = this.history();
    const withIgc = hList.filter(h => h.igc !== undefined);
    if (withIgc.length > 0) return withIgc[withIgc.length - 1].igc;
    return null;
  });

  // Karvonen Zones (Assuming Resting HR = 60 for mock if unknown)
  age = computed(() => this.user()?.age || 25);
  maxHr = computed(() => 220 - this.age());
  restingHr = 60;
  hrReserve = computed(() => this.maxHr() - this.restingHr);

  zones = computed(() => [
    { name: 'Zona 1 (Recuperación)', min: 50, max: 60, desc: 'Entrenamiento muy ligero, calentar.' },
    { name: 'Zona 2 (Quema Grasa)', min: 60, max: 70, desc: 'Mejora resistencia base.' },
    { name: 'Zona 3 (Aeróbica)', min: 70, max: 80, desc: 'Mejora la capacidad cardiovascular.' },
    { name: 'Zona 4 (Anaeróbica)', min: 80, max: 90, desc: 'Aumenta el umbral láctico y fuerza máxima.' },
    { name: 'Zona 5 (Máxima)', min: 90, max: 100, desc: 'Esfuerzo máximo para velocidad y potencia.' }
  ].map(z => ({
    ...z,
    minHr: Math.round(this.restingHr + (this.hrReserve() * (z.min / 100))),
    maxHr: Math.round(this.restingHr + (this.hrReserve() * (z.max / 100)))
  })));
}
