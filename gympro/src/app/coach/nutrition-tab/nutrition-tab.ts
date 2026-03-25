import { Component, input, effect, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService, StudentProfile } from '../../services/data';

@Component({
  selector: 'app-nutrition-tab',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './nutrition-tab.html'
})
export class NutritionTab {
  studentEmail = input.required<string>();
  private data = inject(DataService);
  private fb = inject(FormBuilder);

  nutritionForm: FormGroup = this.fb.group({
    dietPlan: [''],
    supplements: [''],
    adjuncts: ['']
  });

  isSaving = false;

  constructor() {
    effect(() => {
        const email = this.studentEmail();
        if (email) {
            this.data.loadProfile(email);
        }
    }, { allowSignalWrites: true });

    effect(() => {
        const profiles = this.data.currentProfiles();
        if (profiles.length > 0) {
            const latest = profiles[0]; // 0 is the newest
            this.nutritionForm.patchValue({
                dietPlan: latest.dietPlan || '',
                supplements: latest.supplements || '',
                adjuncts: latest.adjuncts || ''
            });
        } else {
            this.nutritionForm.reset();
        }
    });
  }

  saveNutrition() {
    if (this.nutritionForm.invalid || this.isSaving) return;

    this.isSaving = true;
    const profiles = this.data.currentProfiles();
    let payload: StudentProfile;

    if (profiles.length > 0) {
        // Clone latest and apply nutrition
        const latest = profiles[0];
        payload = {
            ...latest, // Copy all existing biomtrics, anthropometry, etc.
            id: undefined, // Must be new snapshot
            recordDate: new Date().toISOString(),
            recordName: 'Actualización de Plan Nutricional',
            ...this.nutritionForm.value
        };
    } else {
        // Base profile if none exists
        payload = {
            studentEmail: this.studentEmail(),
            recordDate: new Date().toISOString(),
            recordName: 'Plan Nutricional Inicial',
            dietPlan: this.nutritionForm.value.dietPlan || '',
            supplements: this.nutritionForm.value.supplements || '',
            adjuncts: this.nutritionForm.value.adjuncts || ''
        };
    }

    // saveProfile triggers loadProfile, which will update the list
    this.data.saveProfile(this.studentEmail(), payload);
    
    // Simulate slight delay for UI feedback
    setTimeout(() => {
        this.isSaving = false;
        alert('Plan nutricional actualizado.');
    }, 500);
  }
}
