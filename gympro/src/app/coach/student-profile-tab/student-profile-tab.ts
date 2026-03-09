import { Component, inject, input, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { DataService, StudentProfile } from '../../services/data';

@Component({
    selector: 'app-student-profile-tab',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './student-profile-tab.html'
})
export class StudentProfileTab {
    studentEmail = input.required<string>();
    data = inject(DataService);

    profileForm = new FormGroup({
        objective: new FormControl(''),
        biotype: new FormControl(''),
        bioimpedanceData: new FormControl(''),
        anthropometry: new FormControl(''),
        mobilityAnalysis: new FormControl(''),
        dietPlan: new FormControl(''),
        supplements: new FormControl(''),
        adjuncts: new FormControl('')
    });

    constructor() {
        // Whenever the selected studentEmail changes, load their profile.
        effect(() => {
            const email = this.studentEmail();
            if (email) {
                this.data.loadProfile(email);
                this.profileForm.reset();
            }
        }, { allowSignalWrites: true });

        // Whenever currentProfile finishes loading from API, patch the form
        effect(() => {
            const profile = this.data.currentProfile();
            if (profile && profile.studentEmail === this.studentEmail()) {
                this.profileForm.patchValue({
                    objective: profile.objective || '',
                    biotype: profile.biotype || '',
                    bioimpedanceData: profile.bioimpedanceData || '',
                    anthropometry: profile.anthropometry || '',
                    mobilityAnalysis: profile.mobilityAnalysis || '',
                    dietPlan: profile.dietPlan || '',
                    supplements: profile.supplements || '',
                    adjuncts: profile.adjuncts || ''
                });
            }
        });
    }

    saveProfile() {
        const formVals = this.profileForm.getRawValue();
        const payload: StudentProfile = {
            studentEmail: this.studentEmail(),
            objective: formVals.objective || '',
            biotype: formVals.biotype || '',
            bioimpedanceData: formVals.bioimpedanceData || '',
            anthropometry: formVals.anthropometry || '',
            mobilityAnalysis: formVals.mobilityAnalysis || '',
            dietPlan: formVals.dietPlan || '',
            supplements: formVals.supplements || '',
            adjuncts: formVals.adjuncts || ''
        };

        this.data.saveProfile(this.studentEmail(), payload);
    }
}
