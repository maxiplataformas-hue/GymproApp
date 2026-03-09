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
  styleUrls: ['./progress-charts.css'],
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
        weight: this.newWeight,
        measuredBy: 'student'
      });
    }
  }

  public lineChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const list = this.history();
    const l1 = list.map(item => item.date);
    const d1 = list.map(item => item.weight);

    // We store the measuredBy array to use it in our custom plugin
    const roles = list.map(item => item.measuredBy === 'coach' ? 'C' : 'A');

    if (list.length === 0 && this.user()?.initialWeight) {
      l1.push('Inicio');
      d1.push(this.user()!.initialWeight!);
      roles.push('A'); // initial weight is usually added by student during onboarding
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
        pointRadius: 6, // Make point larger to fit the letter
        pointHoverRadius: 8,
        // Custom attribute for our plugin
        authorLabels: roles
      } as any] // Using any to bypass strict ChartJS dataset types for custom properties
    };
  });

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterLabel: function (context) {
            const roles = (context.dataset as any).authorLabels;
            if (roles && roles[context.dataIndex]) {
              return roles[context.dataIndex] === 'C' ? 'Medido por Coach' : 'Medido por Alumno';
            }
            return '';
          }
        }
      }
    },
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
    // Merge basic old PhysioEntry IG with new Student Profile IG just in case
    // We prefer the StudentProfile Timeline Data
    const profiles = this.data.getStudentHistory(this.user()!.email)(); // Old physio
    const clinica = this.data.currentProfiles(); // The Timeline

    // Sort ascending for charts
    const timeClinica = [...clinica].reverse();

    // Prioritize Clinical timeline
    if (timeClinica.length > 0) {
      return {
        labels: timeClinica.map(item => item.recordDate ? new Date(item.recordDate).toLocaleDateString() : 'N/A'),
        datasets: [{
          data: timeClinica.map(item => item.bodyFatPercentage || 0),
          label: 'Grasa Corporal (%)',
          backgroundColor: '#10b981',
          borderRadius: 8
        }]
      };
    }

    const validPhysio = profiles.filter(h => h.igc !== undefined);
    return {
      labels: validPhysio.map(item => item.date),
      datasets: [{
        data: validPhysio.map(item => item.igc!),
        label: 'Grasa Corporal (%)',
        backgroundColor: '#10b981',
        borderRadius: 8
      }]
    };
  });

  public radarChartOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: localStorage.getItem('theme') === 'dark' ? '#94a3b8' : '#475569' } }
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(100, 116, 139, 0.2)' },
        grid: { color: 'rgba(100, 116, 139, 0.2)' },
        pointLabels: { color: localStorage.getItem('theme') === 'dark' ? '#f8fafc' : '#0f172a', font: { size: 12 } },
        ticks: { display: false } // Hide inner numbers to make it cleaner
      }
    }
  };

  public hypertrophyRadarData = computed<ChartConfiguration<'radar'>['data'] | null>(() => {
    const clinica = this.data.currentProfiles();
    if (!clinica || clinica.length === 0) return null;

    const latest = clinica[0]; // First is newest
    const oldest = clinica[clinica.length - 1]; // Last is oldest

    // If there's only 1 record, we only show 1 polygon
    const datasets = [{
      label: 'Métricas Actuales',
      data: [
        latest.chestCircumference || 0,
        latest.rightArmCircumference || 0,
        latest.waistCircumference || 0,
        latest.rightLegCircumference || 0,
        latest.leftLegCircumference || 0,
        latest.leftArmCircumference || 0
      ],
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: '#3b82f6',
      pointBackgroundColor: '#2563eb',
    }];

    if (clinica.length > 1) {
      datasets.unshift({
        label: 'Métricas Iniciales',
        data: [
          oldest.chestCircumference || 0,
          oldest.rightArmCircumference || 0,
          oldest.waistCircumference || 0,
          oldest.rightLegCircumference || 0,
          oldest.leftLegCircumference || 0,
          oldest.leftArmCircumference || 0
        ],
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
        borderColor: '#ef4444',
        pointBackgroundColor: '#dc2626',
      });
    }

    return {
      labels: ['Pecho', 'Brazo Der.', 'Cintura', 'Pierna Der.', 'Pierna Izq.', 'Brazo Izq.'],
      datasets: datasets
    };
  });

  // Custom ChartJS Plugin to draw 'C' or 'A' on the points
  public customChartPlugins = [{
    id: 'authorIconPlugin',
    afterDatasetsDraw(chart: any, args: any, options: any) {
      const { ctx } = chart;

      chart.data.datasets.forEach((dataset: any, i: number) => {
        const meta = chart.getDatasetMeta(i);
        if (!meta.hidden && dataset.authorLabels) {
          meta.data.forEach((element: any, index: number) => {
            const letter = dataset.authorLabels[index];
            if (!letter) return;

            ctx.save();
            ctx.fillStyle = '#ffffff'; // White text
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Adjust position slightly based on chart type
            const isBar = chart.config.type === 'bar';
            const yOffset = isBar ? 15 : 0; // For bars, put the letter slightly below the top of the bar inside it

            ctx.fillText(letter, element.x, element.y + yOffset);
            ctx.restore();
          });
        }
      });
    }
  }];
}
