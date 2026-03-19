import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { DataService } from '../../services/data';

@Component({
  selector: 'app-physiologic-data',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './physiologic-data.html'
})
export class PhysiologicData {
  auth = inject(AuthService);
  data = inject(DataService);

  user = computed(() => this.auth.currentUser());
  history = computed(() => this.data.getStudentHistory(this.user()?.email || '')());

  // Current and previous weights
  currentWeight = computed(() => {
    const hList = this.history();
    const u = this.user();
    return hList.length > 0 ? hList[hList.length - 1].weight : (u?.initialWeight ?? null);
  });

  previousWeight = computed(() => {
    const hList = this.history();
    return hList.length > 1 ? hList[hList.length - 2].weight : null;
  });

  weightDelta = computed(() => {
    const curr = this.currentWeight();
    const prev = this.previousWeight();
    if (curr === null || prev === null) return null;
    return +(curr - prev).toFixed(1);
  });

  // Calculate BMI
  bmi = computed(() => {
    const u = this.user();
    const weight = this.currentWeight();
    if (!u || !u.height || !weight) return 0;
    const heightInM = u.height / 100;
    return +(weight / (heightInM * heightInM)).toFixed(1);
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
    const withIgc = hList.filter(h => h.igc !== undefined && h.igc !== null);
    return withIgc.length > 0 ? withIgc[withIgc.length - 1].igc! : null;
  });

  previousIgc = computed(() => {
    const hList = this.history();
    const withIgc = hList.filter(h => h.igc !== undefined && h.igc !== null);
    return withIgc.length > 1 ? withIgc[withIgc.length - 2].igc! : null;
  });

  igcDelta = computed(() => {
    const curr = this.latestIgc();
    const prev = this.previousIgc();
    if (curr === null || prev === null) return null;
    return +(curr - prev).toFixed(1);
  });

  // Derived body composition
  fatMassKg = computed(() => {
    const igc = this.latestIgc();
    const weight = this.currentWeight();
    if (igc === null || weight === null) return null;
    return +((igc / 100) * weight).toFixed(1);
  });

  leanMassKg = computed(() => {
    const fat = this.fatMassKg();
    const weight = this.currentWeight();
    if (fat === null || weight === null) return null;
    return +(weight - fat).toFixed(1);
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
