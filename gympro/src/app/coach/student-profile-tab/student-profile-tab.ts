import { Component, inject, input, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { DataService, StudentProfile } from '../../services/data';
import { jsPDF } from 'jspdf';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
    selector: 'app-student-profile-tab',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, BaseChartDirective],
    templateUrl: './student-profile-tab.html'
})
export class StudentProfileTab {
    studentEmail = input.required<string>();
    data = inject(DataService);

    // UI State for Timeline
    selectedProfile = signal<StudentProfile | null>(null);
    isCreatingNew = signal<boolean>(false);

    profileForm = new FormGroup({
        objective: new FormControl(''),
        biotype: new FormControl(''),

        // Bioimpedance
        bodyFatPercentage: new FormControl<number | null>(null),
        muscleMassPercentage: new FormControl<number | null>(null),
        visceralFat: new FormControl<number | null>(null),
        bioimpedanceData: new FormControl(''),

        // Anthropometry
        chestCircumference: new FormControl<number | null>(null),
        waistCircumference: new FormControl<number | null>(null),
        leftArmCircumference: new FormControl<number | null>(null),
        rightArmCircumference: new FormControl<number | null>(null),
        leftLegCircumference: new FormControl<number | null>(null),
        rightLegCircumference: new FormControl<number | null>(null),
        anthropometry: new FormControl(''),

        mobilityAnalysis: new FormControl(''),
        dietPlan: new FormControl(''),
        supplements: new FormControl(''),
        adjuncts: new FormControl('')
    });

    showChartModal = signal<boolean>(false);

    constructor() {
        // Whenever the selected studentEmail changes, load their profile history.
        effect(() => {
            const email = this.studentEmail();
            if (email) {
                this.data.loadProfile(email);
                this.profileForm.reset();
            }
        }, { allowSignalWrites: true });

        // Whenever the profiles finish loading from API, auto-select the latest one
        effect(() => {
            const profiles = this.data.currentProfiles();
            if (profiles && profiles.length > 0 && profiles[0].studentEmail === this.studentEmail()) {
                // Ignore if we are already in creation mode manually
                if (!this.isCreatingNew()) {
                    this.selectProfile(profiles[0]); // Zero is newest due to DESC sort
                }
            } else if (profiles && profiles.length === 0) {
                // No history found, open creation mode automatically
                this.startNewProfile(null);
            }
        }, { allowSignalWrites: true });

        // When the selected profile changes, patch the form
        effect(() => {
            const profile = this.selectedProfile();
            if (profile) {
                this.profileForm.patchValue({
                    objective: profile.objective || '',
                    biotype: profile.biotype || '',
                    bodyFatPercentage: profile.bodyFatPercentage ?? null,
                    muscleMassPercentage: profile.muscleMassPercentage ?? null,
                    visceralFat: profile.visceralFat ?? null,
                    bioimpedanceData: profile.bioimpedanceData || '',

                    chestCircumference: profile.chestCircumference ?? null,
                    waistCircumference: profile.waistCircumference ?? null,
                    leftArmCircumference: profile.leftArmCircumference ?? null,
                    rightArmCircumference: profile.rightArmCircumference ?? null,
                    leftLegCircumference: profile.leftLegCircumference ?? null,
                    rightLegCircumference: profile.rightLegCircumference ?? null,
                    anthropometry: profile.anthropometry || '',

                    mobilityAnalysis: profile.mobilityAnalysis || '',
                    dietPlan: profile.dietPlan || '',
                    supplements: profile.supplements || '',
                    adjuncts: profile.adjuncts || ''
                });

                if (!this.isCreatingNew()) {
                    this.profileForm.disable(); // Read-only for history
                } else {
                    this.profileForm.enable(); // Editable for clones
                }
            } else if (this.isCreatingNew()) {
                // Empty Form
                this.profileForm.enable();
            }
        }, { allowSignalWrites: true });
    }

    selectProfile(profile: StudentProfile) {
        this.isCreatingNew.set(false);
        this.selectedProfile.set(profile);
    }

    startNewProfile(cloneFrom: StudentProfile | null) {
        this.isCreatingNew.set(true);
        if (cloneFrom) {
            // Clone the old data into a new editable state
            this.selectedProfile.set({ ...cloneFrom, id: undefined, recordDate: undefined, recordName: undefined });
        } else {
            // Fresh blank form
            this.selectedProfile.set(null);
            this.profileForm.reset();
            this.profileForm.enable();
        }
    }

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

    saveProfile() {
        const formVals = this.profileForm.getRawValue();
        const payload: StudentProfile = {
            studentEmail: this.studentEmail(),
            objective: formVals.objective || '',
            biotype: formVals.biotype || '',

            bodyFatPercentage: formVals.bodyFatPercentage ?? undefined,
            muscleMassPercentage: formVals.muscleMassPercentage ?? undefined,
            visceralFat: formVals.visceralFat ?? undefined,
            bioimpedanceData: formVals.bioimpedanceData || '',

            chestCircumference: formVals.chestCircumference ?? undefined,
            waistCircumference: formVals.waistCircumference ?? undefined,
            leftArmCircumference: formVals.leftArmCircumference ?? undefined,
            rightArmCircumference: formVals.rightArmCircumference ?? undefined,
            leftLegCircumference: formVals.leftLegCircumference ?? undefined,
            rightLegCircumference: formVals.rightLegCircumference ?? undefined,
            anthropometry: formVals.anthropometry || '',

            mobilityAnalysis: formVals.mobilityAnalysis || '',
            dietPlan: formVals.dietPlan || '',
            supplements: formVals.supplements || '',
            adjuncts: formVals.adjuncts || ''
        };

        this.data.saveProfile(this.studentEmail(), payload);
        // Turn off creation mode so it falls back to the newly added profile as readonly
        this.isCreatingNew.set(false);
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

        let antropometriaStr = '';
        if (formVals.chestCircumference) antropometriaStr += `Pecho: ${formVals.chestCircumference}cm | `;
        if (formVals.waistCircumference) antropometriaStr += `Cintura: ${formVals.waistCircumference}cm | `;
        if (formVals.leftArmCircumference) antropometriaStr += `Brazo Izq: ${formVals.leftArmCircumference}cm | `;
        if (formVals.rightArmCircumference) antropometriaStr += `Brazo Der: ${formVals.rightArmCircumference}cm | `;
        if (formVals.leftLegCircumference) antropometriaStr += `Pierna Izq: ${formVals.leftLegCircumference}cm | `;
        if (formVals.rightLegCircumference) antropometriaStr += `Pierna Der: ${formVals.rightLegCircumference}cm`;

        addSection('Antropometría', antropometriaStr + '\n\n' + (formVals.anthropometry || ''));

        let bioStr = '';
        if (formVals.bodyFatPercentage) bioStr += `Grasa: ${formVals.bodyFatPercentage}% | `;
        if (formVals.muscleMassPercentage) bioStr += `Músculo: ${formVals.muscleMassPercentage}% | `;
        if (formVals.visceralFat) bioStr += `Grasa Visceral Nivel: ${formVals.visceralFat}`;

        addSection('Bioimpedancia', bioStr + '\n\n' + (formVals.bioimpedanceData || ''));

        addSection('Análisis Biomecánico', formVals.mobilityAnalysis);
        addSection('Plan de Nutrición', formVals.dietPlan);
        addSection('Suplementación Regular', formVals.supplements);
        addSection('Coadyuvantes Suplementarios', formVals.adjuncts);

        doc.save(`Ficha_Clinica_${studentName.replace(/\s+/g, '_')}.pdf`);
    }
}
