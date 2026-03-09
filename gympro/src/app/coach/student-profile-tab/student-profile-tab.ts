import { Component, inject, input, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { DataService, StudentProfile } from '../../services/data';
import { jsPDF } from 'jspdf';

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

    generatePDF() {
        const email = this.studentEmail();
        const student = this.data.allStudents().find(s => s.email === email);
        const studentName = student?.name || email || 'Atleta_Generico';
        const formVals = this.profileForm.getRawValue();

        const doc = new jsPDF();
        let y = 20;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(33, 37, 41);
        doc.text('Ficha Clínica y Deportiva', 105, y, { align: 'center' });
        y += 15;

        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text(`Atleta: ${studentName}`, 20, y);
        y += 10;
        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 20, y);
        y += 15;

        // Helper for sections
        const addSection = (title: string, content: string | null) => {
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

            const text = content ? content.trim() : 'No registrado.';
            const lines = doc.splitTextToSize(text, 170);
            doc.text(lines, 20, y);

            y += (lines.length * 6) + 10;
        };

        addSection('Objetivo Declarado', formVals.objective);
        addSection('Biotipo', formVals.biotype);
        addSection('Antropometría', formVals.anthropometry);
        addSection('Bioimpedancia', formVals.bioimpedanceData);
        addSection('Análisis Biomecánico', formVals.mobilityAnalysis);
        addSection('Plan de Nutrición', formVals.dietPlan);
        addSection('Suplementación Regular', formVals.supplements);
        addSection('Coadyuvantes Suplementarios', formVals.adjuncts);

        doc.save(`Ficha_Clinica_${studentName.replace(/\s+/g, '_')}.pdf`);
    }
}
