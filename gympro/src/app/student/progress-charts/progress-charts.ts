import { Component, inject, computed, ChangeDetectionStrategy, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { AuthService } from '../../services/auth';
import { DataService } from '../../services/data';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-progress-charts',
  standalone: true,
  imports: [RouterLink, BaseChartDirective, FormsModule],
  templateUrl: './progress-charts.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressCharts {
  auth = inject(AuthService);
  data = inject(DataService);
  theme = inject(ThemeService);

  user = computed(() => this.auth.currentUser());
  history = computed(() => this.data.getStudentHistory(this.user()?.email || '')());

  newDate = new Date().toISOString().split('T')[0];
  newWeight: number | null = null;

  constructor() {
    effect(() => {
      const user = this.user();
      if (user && this.newWeight === null && user.initialWeight && this.history().length === 0) {
        this.newWeight = user.initialWeight;
      } else if (this.history().length > 0 && this.newWeight === null) {
        this.newWeight = this.history()[this.history().length - 1].weight;
      }
    });
  }

  saveEntry() {
    if (this.newWeight && this.newWeight > 0 && this.newDate) {
      this.data.addPhysioEntry({
        studentEmail: this.user()!.email,
        date: this.newDate,
        weight: this.newWeight
      });
    }
  }

  public lineChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const list = this.history();
    const l1 = list.map(item => item.date);
    const d1 = list.map(item => item.weight);

    if (list.length === 0 && this.user()?.initialWeight) {
      l1.push('Inicio');
      d1.push(this.user()!.initialWeight!);
    }

    return {
      labels: l1,
      datasets: [{
        data: d1,
        label: 'Peso (Kg)',
        fill: true,
        tension: 0.4,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        pointBackgroundColor: '#ec4899',
        pointBorderColor: '#fff',
      }]
    };
  });

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: false, grid: { color: 'rgba(100, 116, 139, 0.2)' } },
      x: { grid: { display: false } }
    }
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(100, 116, 139, 0.2)' } },
      x: { grid: { display: false } }
    }
  };

  public igcChartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const list = this.history().filter(h => h.igc !== undefined);
    return {
      labels: list.map(item => item.date),
      datasets: [{
        data: list.map(item => item.igc!),
        label: 'Grasa Corporal (%)',
        backgroundColor: '#10b981',
        borderRadius: 8,
      }]
    };
  });
}
