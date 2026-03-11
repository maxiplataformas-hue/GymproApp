import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ai-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-onboarding.html',
  styleUrl: './ai-onboarding.css'
})
export class AiOnboarding {
  private router = inject(Router);

  step = signal(1);
  goal = signal('');
  level = signal('');
  equipment = signal<string[]>([]);

  goals = [
    { id: 'weight-loss', label: 'Perder peso', icon: '⚖️' },
    { id: 'muscle-gain', label: 'Ganar músculo', icon: '💪' },
    { id: 'endurance', label: 'Resistencia', icon: '🏃' },
    { id: 'health', label: 'Salud general', icon: '🧘' }
  ];

  levels = [
    { id: 'beginner', label: 'Principiante', desc: 'Nunca he entrenado o llevo poco tiempo' },
    { id: 'intermediate', label: 'Intermedio', desc: 'Entreno regularmente hace meses' },
    { id: 'advanced', label: 'Avanzado', desc: 'Años de entrenamiento constante' }
  ];

  equipmentOptions = [
    { id: 'gym', label: 'Gimnasio completo', icon: '🏋️' },
    { id: 'dumbbells', label: 'Solo mancuernas', icon: '🧱' },
    { id: 'bodyweight', label: 'Solo peso corporal', icon: '🧘' },
    { id: 'home', label: 'Equipamiento de casa', icon: '🏠' }
  ];

  nextStep() {
    if (this.step() < 3) {
      this.step.update(s => s + 1);
    } else {
      this.completeOnboarding();
    }
  }

  prevStep() {
    if (this.step() > 1) {
      this.step.update(s => s - 1);
    }
  }

  toggleEquipment(id: string) {
    const current = this.equipment();
    if (current.includes(id)) {
      this.equipment.set(current.filter(e => e !== id));
    } else {
      this.equipment.set([...current, id]);
    }
  }

  completeOnboarding() {
    // Save onboarding data (simulated for now)
    console.log('Onboarding Complete:', {
      goal: this.goal(),
      level: this.level(),
      equipment: this.equipment()
    });
    
    // In a real app, we'd save this to a service or backend
    // For now, navigate to the AI routine view
    this.router.navigate(['/app/student/ai-routine']);
  }
}
