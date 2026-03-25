import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth';
import { DataService } from '../../services/data';
import { jsPDF } from 'jspdf';


@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './student-dashboard.html'
  // using default change detection to prevent missing data on SPA navigation
})
export class StudentDashboard {
  auth = inject(AuthService);
  data = inject(DataService);

  user = computed(() => this.auth.currentUser());
  userName = computed(() => this.user()?.name?.split(' ')[0] || 'Atleta');

  // Today's date YYYY-MM-DD
  today = new Date().toISOString().split('T')[0];

  // Today's date in Spanish for display
  todayFormatted = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).toUpperCase();

  // Get today's routine assignment
  todayRoutine = computed(() => this.data.getRoutinesForStudent(this.user()?.email || '', this.today));

  // Compute stats
  completedItemsCount = computed(() => {
    const routine = this.todayRoutine();
    if (!routine) return 0;
    return routine.items.filter(i => i.completed).length;
  });

  totalItemsCount = computed(() => {
    const routine = this.todayRoutine();
    if (!routine) return 0;
    return routine.items.length;
  });

  progressPercent = computed(() => {
    const total = this.totalItemsCount();
    if (total === 0) return 0;
    return Math.round((this.completedItemsCount() / total) * 100);
  });

  // Diet & Supplements State
  showDietModal = signal(false);
  
  latestProfile = computed(() => {
    const profiles = this.data.currentProfiles();
    return profiles.length > 0 ? profiles[0] : null;
  });

  constructor() {
    // Load student profile on init to fetch diet/supplements
    const email = this.user()?.email;
    if (email) {
      this.data.loadProfile(email);
    }
  }

  generateDietPDF() {
    const profile = this.latestProfile();
    if (!profile) return;

    const doc = new jsPDF();
    const studentName = this.userName() || 'Atleta';
    const coachEmail = this.user()?.coachEmail || 'Coach';
    const dateAssigned = profile.recordDate ? new DatePipe('en-US').transform(profile.recordDate, 'dd/MM/yyyy') : new Date().toLocaleDateString();

    const drawPDF = (logoImg?: HTMLImageElement) => {
      let y = 20;

      // Add Logo if available
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 20, y - 5, 20, 20);
        doc.setFontSize(24);
        doc.setTextColor(33, 37, 41);
        doc.setFont('helvetica', 'bold');
        doc.text('COACH', 45, y + 8);
        doc.setTextColor(6, 182, 212); // Primary cyan
        doc.text('PRO', 78, y + 8);
        y += 25;
      } else {
        doc.setFontSize(24);
        doc.setTextColor(33, 37, 41);
        doc.setFont('helvetica', 'bold');
        doc.text('COACHPRO', 20, y);
        y += 15;
      }

      // Title
      doc.setFontSize(18);
      doc.setTextColor(33, 37, 41);
      doc.text('Indicación Nutricional y Suplementación', 20, y);
      y += 10;

      // Info
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`Atleta: ${studentName}`, 20, y);
      y += 7;
      doc.text(`Asignado por Coach: ${coachEmail}`, 20, y);
      y += 7;
      doc.text(`Fecha de indicación: ${dateAssigned}`, 20, y);
      y += 15;

      const addSection = (title: string, content: string | null) => {
        if (!content) return;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(41, 128, 185);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 20, y);
        y += 8;

        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');

        const lines = doc.splitTextToSize(content.trim(), 170);
        doc.text(lines, 20, y);

        y += (lines.length * 6) + 10;
      };

      addSection('Plan Nutricional', profile.dietPlan || null);
      addSection('Suplementación Regular', profile.supplements || null);
      addSection('Coadyuvantes Extras', profile.adjuncts || null);

      doc.save(`Dieta_${studentName}.pdf`);
    };

    // Try to load logo asynchronously
    const img = new Image();
    img.src = 'logo.png';
    img.onload = () => drawPDF(img);
    img.onerror = () => drawPDF(); // fallback without logo
  }

  alert(msg: string) {
    window.alert(msg);
  }
}
