import { Component, inject, computed, OnInit, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [RouterLink, BaseChartDirective],
  templateUrl: './physiologic-data.html'
})
export class PhysiologicData {
  auth = inject(AuthService);
  data = inject(DataService);

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
