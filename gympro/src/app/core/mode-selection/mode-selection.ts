import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mode-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mode-selection.html',
  styleUrl: './mode-selection.css'
})
export class ModeSelection {
  private router = inject(Router);

  selectCoachTraining() {
    this.router.navigate(['/login']);
  }

  selectAiCoach() {
    // For now, this doesn't do anything as requested, but we could add a toast or similar
    console.log('Coach IA selected - functionality coming soon');
  }
}
