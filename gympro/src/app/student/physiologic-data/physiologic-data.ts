import { Component, inject, computed, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../services/auth';
import { DataService } from '../../services/data';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import {
  Chart,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement, BarController,
  LineController,
  Title, Tooltip, Legend, Filler
} from 'chart.js';

Chart.register(
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement, BarController,
  LineController,
  Title, Tooltip, Legend, Filler
);

@Component({
  selector: 'app-physiologic-data',
  standalone: true,
  imports: [RouterLink, BaseChartDirective, FormsModule, DecimalPipe],
  templateUrl: './physiologic-data.html'
})
export class PhysiologicData {
  auth = inject(AuthService);
  data = inject(DataService);

  constructor() {
    this.auth.refreshCurrentUser();
    effect(() => {
      const profileSex = this.user()?.sex;
      if (profileSex === 'male' || profileSex === 'female') {
        this.sex.set(profileSex);
      }
    }, { allowSignalWrites: true });
  }

  user = computed(() => this.auth.currentUser());
  history = computed(() => this.data.getStudentHistory(this.user()?.email || '')());

  // ─── Current/Previous snapshots ──────────────────────────────────────────
  currentWeight = computed(() => {
    const h = this.history();
    const u = this.user();
    return h.length > 0 ? h[h.length - 1].weight : (u?.initialWeight ?? null);
  });

  previousWeight = computed(() => {
    const h = this.history();
    return h.length > 1 ? h[h.length - 2].weight : null;
  });

  weightDelta = computed(() => {
    const c = this.currentWeight(), p = this.previousWeight();
    if (c === null || p === null) return null;
    return +(c - p).toFixed(1);
  });

  // ─── BMI ─────────────────────────────────────────────────────────────────
  bmi = computed(() => {
    const u = this.user(), w = this.currentWeight();
    if (!u || !u.height || !w) return 0;
    const h = u.height / 100;
    return +(w / (h * h)).toFixed(1);
  });

  bmiStatus = computed(() => {
    const b = this.bmi();
    if (b < 18.5) return 'Bajo Peso';
    if (b < 25) return 'Normal';
    if (b < 30) return 'Sobrepeso';
    return 'Obesidad';
  });

  // ─── IGC ─────────────────────────────────────────────────────────────────
  latestIgc = computed(() => {
    const wi = this.history().filter(h => h.igc !== undefined && h.igc !== null);
    return wi.length > 0 ? wi[wi.length - 1].igc! : null;
  });

  previousIgc = computed(() => {
    const wi = this.history().filter(h => h.igc !== undefined && h.igc !== null);
    return wi.length > 1 ? wi[wi.length - 2].igc! : null;
  });

  igcDelta = computed(() => {
    const c = this.latestIgc(), p = this.previousIgc();
    if (c === null || p === null) return null;
    return +(c - p).toFixed(1);
  });

  // ─── Body Composition ────────────────────────────────────────────────────
  fatMassKg = computed(() => {
    const igc = this.latestIgc(), w = this.currentWeight();
    if (igc === null || w === null) return null;
    return +((igc / 100) * w).toFixed(1);
  });

  leanMassKg = computed(() => {
    const fat = this.fatMassKg(), w = this.currentWeight();
    if (fat === null || w === null) return null;
    return +(w - fat).toFixed(1);
  });

  // ─── IGC Color Bar (Gauge) ────────────────────────────────────────────────
  // Position 0% = verde (atlético), 100% = rojo (obeso)
  igcBarPosition = computed(() => {
    const igc = this.latestIgc();
    if (igc === null) return null;
    const isMale = this.sex() === 'male';
    const min = isMale ? 3 : 10;
    const max = isMale ? 35 : 42;
    return Math.min(100, Math.max(0, Math.round(((igc - min) / (max - min)) * 100)));
  });

  igcCategory = computed(() => {
    const igc = this.latestIgc();
    if (igc === null) return '';
    if (this.sex() === 'male') {
      if (igc < 6)  return 'Atlético';
      if (igc < 14) return 'Fitness';
      if (igc < 18) return 'Aceptable';
      if (igc < 25) return 'Sobrepeso';
      return 'Obesidad';
    } else {
      if (igc < 14) return 'Atlético';
      if (igc < 21) return 'Fitness';
      if (igc < 26) return 'Aceptable';
      if (igc < 32) return 'Sobrepeso';
      return 'Obesidad';
    }
  });

  // ─── BMR / TDEE / Caloric Deficit ────────────────────────────────────────
  sex = signal<'male' | 'female'>('male');

  activityLevel = signal<1 | 2 | 3 | 4 | 5>(2);
  deficitType = signal<'light' | 'moderate' | 'aggressive' | 'custom'>('moderate');
  customDeficit = signal<number>(300);

  readonly activityOptions: { level: 1|2|3|4|5, label: string, desc: string }[] = [
    { level: 1, label: 'Sedentario',  desc: 'Sin ejercicio' },
    { level: 2, label: 'Ligero',      desc: '1–3 días/sem' },
    { level: 3, label: 'Moderado',    desc: '3–5 días/sem' },
    { level: 4, label: 'Activo',      desc: '6–7 días/sem' },
    { level: 5, label: 'Muy Activo',  desc: 'Doble turno' },
  ];

  readonly activityFactors: Record<number, number> = {
    1: 1.2, 2: 1.375, 3: 1.55, 4: 1.725, 5: 1.9
  };

  bmr = computed(() => {
    const u = this.user();
    const w = this.currentWeight();
    const h = u?.height ?? null;
    const age = u?.age ?? null;
    if (!w || !h || !age) return null;
    // Mifflin-St Jeor formula
    const base = 10 * w + 6.25 * h - 5 * age;
    return Math.round(this.sex() === 'male' ? base + 5 : base - 161);
  });

  tdee = computed(() => {
    const b = this.bmr();
    if (b === null) return null;
    return Math.round(b * this.activityFactors[this.activityLevel()]);
  });

  deficitKcal = computed(() => {
    const t = this.deficitType();
    if (t === 'light')      return 200;
    if (t === 'moderate')   return 350;
    if (t === 'aggressive') return 500;
    return this.customDeficit();
  });

  targetCalories = computed(() => {
    const t = this.tdee();
    if (t === null) return null;
    return Math.max(1000, t - this.deficitKcal());
  });

  setActivityLevel(level: 1|2|3|4|5) { this.activityLevel.set(level); }
  setDeficitType(t: 'light'|'moderate'|'aggressive'|'custom') { this.deficitType.set(t); }
  setSex(s: 'male'|'female') { this.sex.set(s); }

  // ─── Karvonen Zones ──────────────────────────────────────────────────────
  age    = computed(() => this.user()?.age || 25);
  maxHr  = computed(() => 220 - this.age());
  restingHr = 60;
  hrReserve = computed(() => this.maxHr() - this.restingHr);

  zones = computed(() => [
    { name: 'Zona 1 (Recuperación)', min: 50, max: 60, desc: 'Entrenamiento muy ligero, calentar.' },
    { name: 'Zona 2 (Quema Grasa)',   min: 60, max: 70, desc: 'Mejora resistencia base.' },
    { name: 'Zona 3 (Aeróbica)',      min: 70, max: 80, desc: 'Mejora la capacidad cardiovascular.' },
    { name: 'Zona 4 (Anaeróbica)',    min: 80, max: 90, desc: 'Aumenta el umbral láctico y fuerza máxima.' },
    { name: 'Zona 5 (Máxima)',        min: 90, max: 100, desc: 'Esfuerzo máximo para velocidad y potencia.' }
  ].map(z => ({
    ...z,
    minHr: Math.round(this.restingHr + this.hrReserve() * (z.min / 100)),
    maxHr: Math.round(this.restingHr + this.hrReserve() * (z.max / 100))
  })));

  // ─── Chart helpers ───────────────────────────────────────────────────────
  private isDark = () => document.documentElement.classList.contains('dark');
  private gridColor = () => this.isDark() ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  private labelColor = () => this.isDark() ? '#94a3b8' : '#64748b';

  sharedLineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: {} }
    },
    scales: {
      x: {
        grid: { color: this.gridColor() },
        ticks: { color: this.labelColor(), maxTicksLimit: 8, maxRotation: 30 }
      },
      y: {
        grid: { color: this.gridColor() },
        ticks: { color: this.labelColor() }
      }
    },
    elements: { line: { tension: 0.4 }, point: { radius: 4, hoverRadius: 7 } }
  };

  // ── Chart 1: Peso (kg) ────────────────────────────────────────────────────
  weightChartData = computed<ChartConfiguration<'line'>['data'] | null>(() => {
    const h = this.history().filter(e => e.weight);
    if (h.length < 2) return null;
    return {
      labels: h.map(e => e.date),
      datasets: [{
        label: 'Peso (kg)',
        data: h.map(e => e.weight),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.15)',
        fill: true
      }]
    };
  });

  // ── Chart 2: IMC ──────────────────────────────────────────────────────────
  bmiChartData = computed<ChartConfiguration<'line'>['data'] | null>(() => {
    const u = this.user();
    if (!u?.height) return null;
    const h = this.history().filter(e => e.weight);
    if (h.length < 2) return null;
    const hm = u.height / 100;
    return {
      labels: h.map(e => e.date),
      datasets: [{
        label: 'IMC',
        data: h.map(e => +(e.weight / (hm * hm)).toFixed(1)),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168,85,247,0.15)',
        fill: true
      }]
    };
  });

  // ── Chart 3: IGC % ────────────────────────────────────────────────────────
  igcChartData = computed<ChartConfiguration<'line'>['data'] | null>(() => {
    const h = this.history().filter(e => e.igc !== null && e.igc !== undefined);
    if (h.length < 2) return null;
    return {
      labels: h.map(e => e.date),
      datasets: [{
        label: 'IGC %',
        data: h.map(e => e.igc!),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.15)',
        fill: true
      }]
    };
  });

  // ── Chart 4: Masa Grasa (kg) ──────────────────────────────────────────────
  fatMassChartData = computed<ChartConfiguration<'line'>['data'] | null>(() => {
    const h = this.history().filter(e => e.igc !== null && e.igc !== undefined && e.weight);
    if (h.length < 2) return null;
    return {
      labels: h.map(e => e.date),
      datasets: [{
        label: 'Masa Grasa (kg)',
        data: h.map(e => +((e.igc! / 100) * e.weight).toFixed(1)),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.15)',
        fill: true
      }]
    };
  });

  // ── Chart 5: Masa Magra (kg) ──────────────────────────────────────────────
  leanMassChartData = computed<ChartConfiguration<'line'>['data'] | null>(() => {
    const h = this.history().filter(e => e.igc !== null && e.igc !== undefined && e.weight);
    if (h.length < 2) return null;
    return {
      labels: h.map(e => e.date),
      datasets: [{
        label: 'Masa Magra (kg)',
        data: h.map(e => +(e.weight - (e.igc! / 100) * e.weight).toFixed(1)),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.15)',
        fill: true
      }]
    };
  });

  // ── Chart 6: Composición combinada (Grasa vs Magra) – Stacked bar ─────────
  compositionChartData = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const h = this.history().filter(e => e.igc !== null && e.igc !== undefined && e.weight);
    if (h.length < 2) return null;
    return {
      labels: h.map(e => e.date),
      datasets: [
        {
          label: 'Masa Grasa (kg)',
          data: h.map(e => +((e.igc! / 100) * e.weight).toFixed(1)),
          backgroundColor: 'rgba(239,68,68,0.75)',
          borderRadius: 4
        },
        {
          label: 'Masa Magra (kg)',
          data: h.map(e => +(e.weight - (e.igc! / 100) * e.weight).toFixed(1)),
          backgroundColor: 'rgba(34,197,94,0.75)',
          borderRadius: 4
        }
      ]
    };
  });

  compositionChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { color: this.labelColor(), boxWidth: 12, font: { size: 11 } }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: this.gridColor() },
        ticks: { color: this.labelColor(), maxTicksLimit: 8, maxRotation: 30 }
      },
      y: {
        stacked: true,
        grid: { color: this.gridColor() },
        ticks: { color: this.labelColor() }
      }
    }
  };
}
