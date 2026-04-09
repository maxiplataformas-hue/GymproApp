import { Component, inject, input, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormGroup, FormControl } from '@angular/forms';
import { DataService, StudentProfile } from '../../services/data';
import { jsPDF } from 'jspdf';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
    selector: 'app-student-profile-tab',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, BaseChartDirective],
    templateUrl: './student-profile-tab.html'
})
export class StudentProfileTab {
    studentEmail = input.required<string>();
    data = inject(DataService);

    // UI State for Timeline
    selectedProfile = signal<StudentProfile | null>(null);
    isCreatingNew = signal<boolean>(false);
    userSelectedProfile = signal<boolean>(false); // true = user manually selected, don't auto-override
    activeTab = signal<'rapida' | 'base' | 'antropometria' | 'bioimpedancia' | 'calculados' | 'biomecanica'>('rapida');

    // --- Quick Measurement (IGC + Peso) ---
    quickWeight = signal<number | null>(null);
    quickIgc = signal<number | null>(null);
    quickDate = signal<string>(new Date().toISOString().split('T')[0]);
    quickSaved = signal<boolean>(false);

    // --- Caliper Calculator ---
    caliperProtocol = signal<'JP3' | 'JP7' | 'Faulkner4' | 'Yuhasz6'>('JP3');

    caliperGender = computed<'M' | 'F'>(() => {
        const student = this.data.allStudents().find(s => s.email === this.studentEmail());
        return student?.sex === 'female' ? 'F' : 'M';
    });

    // JP3 pliegues
    p_chest   = signal<number | null>(null); // Pecho (M)
    p_abd     = signal<number | null>(null); // Abdomen (M, Yuhasz)
    p_thigh   = signal<number | null>(null); // Muslo (M/F, Yuhasz)
    p_triceps = signal<number | null>(null); // Tríceps (F, Yuhasz, Faulkner)
    p_supra   = signal<number | null>(null); // Suprailíaco (JP F, JP7, Yuhasz, Faulkner)

    // JP7 pliegues adicionales
    p_axil    = signal<number | null>(null); // Axilar
    p_subscp  = signal<number | null>(null); // Subescapular (Yuhasz, Faulkner)
    p_biceps  = signal<number | null>(null); // Bíceps (no en JP standard pero útil)
    p_calf    = signal<number | null>(null); // Pantorrilla (Yuhasz 6)

    studentAge = computed(() => {
        const student = this.data.allStudents().find(s => s.email === this.studentEmail());
        return student?.age ?? 25;
    });

    // Jackson-Pollock formula (Siri): % BF = (495 / bodyDensity) - 450
    caliperIgcResult = computed<number | null>(() => {
        const protocol = this.caliperProtocol();
        const gender = this.caliperGender();
        const age = this.studentAge();

        let S = 0;
        let density = 0;

        if (protocol === 'JP3') {
            if (gender === 'M') {
                const chest = this.p_chest(), abd = this.p_abd(), thigh = this.p_thigh();
                if (!chest || !abd || !thigh) return null;
                S = chest + abd + thigh;
                density = 1.10938 - (0.0008267 * S) + (0.0000016 * S * S) - (0.0002574 * age);
            } else {
                const tricep = this.p_triceps(), supra = this.p_supra(), thigh = this.p_thigh();
                if (!tricep || !supra || !thigh) return null;
                S = tricep + supra + thigh;
                density = 1.0994921 - (0.0009929 * S) + (0.0000023 * S * S) - (0.0001392 * age);
            }
        } else if (protocol === 'JP7') { // JP7
            const chest  = this.p_chest();
            const axil   = this.p_axil();
            const tricep = this.p_triceps();
            const subscp = this.p_subscp();
            const abd    = this.p_abd();
            const supra  = this.p_supra();
            const thigh  = this.p_thigh();
            if (!chest || !axil || !tricep || !subscp || !abd || !supra || !thigh) return null;
            S = chest + axil + tricep + subscp + abd + supra + thigh;
            if (gender === 'M') {
                density = 1.112 - (0.00043499 * S) + (0.00000055 * S * S) - (0.00028826 * age);
            } else {
                density = 1.097 - (0.00046971 * S) + (0.00000056 * S * S) - (0.00012828 * age);
            }
        } else if (protocol === 'Faulkner4') {
            const tricep = this.p_triceps();
            const subscp = this.p_subscp();
            const supra = this.p_supra();
            const abd = this.p_abd();
            if (!tricep || !subscp || !supra || !abd) return null;
            S = tricep + subscp + supra + abd;
            return Math.max(0, +((S * 0.153) + 5.783).toFixed(1));
        } else if (protocol === 'Yuhasz6') {
            const tricep = this.p_triceps();
            const subscp = this.p_subscp();
            const supra = this.p_supra();
            const abd = this.p_abd();
            const thigh = this.p_thigh();
            const calf = this.p_calf();
            if (!tricep || !subscp || !supra || !abd || !thigh || !calf) return null;
            S = tricep + subscp + supra + abd + thigh + calf;
            if (gender === 'M') {
                return Math.max(0, +((S * 0.1051) + 2.585).toFixed(1));
            } else {
                return Math.max(0, +((S * 0.1548) + 3.580).toFixed(1));
            }
        }

        if (protocol === 'JP3' || protocol === 'JP7') {
            if (density <= 0) return null;
            const pct = (495 / density) - 450;
            return Math.max(0, +pct.toFixed(1));
        }

        return null;
    });


    profileForm = new FormGroup({
        objective: new FormControl(''),
        biotype: new FormControl(''),
        activityLevel: new FormControl(''),

        // Bioimpedance
        bodyFatPercentage: new FormControl<number | null>(null),
        muscleMassPercentage: new FormControl<number | null>(null),
        visceralFat: new FormControl<number | null>(null),
        bioimpedanceData: new FormControl(''),

        // Anthropometry
        chestCircumference: new FormControl<number | null>(null),
        waistCircumference: new FormControl<number | null>(null),
        hipCircumference: new FormControl<number | null>(null),
        leftArmCircumference: new FormControl<number | null>(null),
        rightArmCircumference: new FormControl<number | null>(null),
        leftLegCircumference: new FormControl<number | null>(null),
        rightLegCircumference: new FormControl<number | null>(null),
        anthropometry: new FormControl(''),

        mobilityAnalysis: new FormControl('')
    });

    showChartModal = signal<boolean>(false);

    // Helper to normalize any date string to 'yyyy-MM-dd'
    private toDateOnly(dateStr: string): string {
        return dateStr ? dateStr.substring(0, 10) : dateStr;
    }

    studentPhysioHistory = computed(() => {
        const physio = this.data.physioEntries().filter(p => p.studentEmail === this.studentEmail());
        const profiles = this.data.currentProfiles();
        
        const map = new Map<string, { id: string, date: string, weight?: number, igc?: number, profileId?: string, physioId?: string }>();
        
        physio.forEach(p => {
            const day = this.toDateOnly(p.date);
            map.set(day, { id: p.id || day, date: day, weight: p.weight, igc: p.igc, physioId: p.id });
        });
        
        profiles.forEach(p => {
            const date = p.recordDate;
            if (!date) return;
            const day = this.toDateOnly(date);
            
            if (map.has(day)) {
                map.get(day)!.profileId = p.id;
                if (!map.get(day)!.igc && p.bodyFatPercentage) {
                    map.get(day)!.igc = p.bodyFatPercentage;
                }
            } else {
                map.set(day, { id: p.id || day, date: day, igc: p.bodyFatPercentage ?? undefined, profileId: p.id });
            }
        });
        
        return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    getProfileForDate(date: string) {
        const day = this.toDateOnly(date);
        return this.data.currentProfiles().find(p => p.recordDate && this.toDateOnly(p.recordDate) === day);
    }

    latestWeight = computed(() => {
        const history = this.studentPhysioHistory();
        return history.length > 0 ? history[0].weight : null;
    });

    fatMassKg = computed(() => {
        const profile = this.selectedProfile();
        const weight = this.latestWeight();
        if (!profile?.bodyFatPercentage || !weight) return null;
        return +((profile.bodyFatPercentage / 100) * weight).toFixed(1);
    });

    leanMassKg = computed(() => {
        const fat = this.fatMassKg();
        const weight = this.latestWeight();
        if (fat === null || !weight) return null;
        return +(weight - fat).toFixed(1);
    });

    waistHipRatio = computed(() => {
        const profile = this.selectedProfile();
        if (!profile?.waistCircumference || !profile?.hipCircumference) return null;
        return +(profile.waistCircumference / profile.hipCircumference).toFixed(2);
    });

    constructor() {
        // Whenever the selected studentEmail changes, load their profile history.
        effect(() => {
            const email = this.studentEmail();
            if (email) {
                // Reset user selection tracking when student changes
                this.userSelectedProfile.set(false);
                this.data.loadProfile(email);
                this.data.loadPhysio(email);
                this.profileForm.reset();
                this.quickWeight.set(null);
                this.quickIgc.set(null);
                this.quickDate.set(new Date().toISOString().split('T')[0]);
                // Reset caliper calculator
                this.caliperProtocol.set('JP3');
                this.p_chest.set(null);   this.p_abd.set(null);
                this.p_thigh.set(null);   this.p_triceps.set(null);
                this.p_supra.set(null);   this.p_axil.set(null);
                this.p_subscp.set(null);  this.p_calf.set(null);
            }
        }, { allowSignalWrites: true });

        // Whenever the profiles finish loading from API, auto-select the latest one
        // BUT only if the user hasn't manually selected one via 'Ver Ficha'
        effect(() => {
            const profiles = this.data.currentProfiles();
            if (profiles && profiles.length > 0 && profiles[0].studentEmail === this.studentEmail()) {
                // Ignore if we are already in creation mode manually OR if user selected a profile
                if (!this.isCreatingNew() && !this.userSelectedProfile()) {
                    this.selectProfile(profiles[0]); // Zero is newest due to DESC sort
                }
            } else if (profiles && profiles.length === 0) {
                // No history found, open creation mode automatically
                this.startNewProfile(null);
            }
        }, { allowSignalWrites: true });

        // Auto-update quickIgc from caliper result
        effect(() => {
            const igc = this.caliperIgcResult();
            if (igc !== null) {
                this.quickIgc.set(igc);
            }
        }, { allowSignalWrites: true });

        // When the selected profile changes, patch the form
        effect(() => {
            const profile = this.selectedProfile();
            if (profile) {
                this.profileForm.patchValue({
                    objective: profile.objective || '',
                    biotype: profile.biotype || '',
                    activityLevel: profile.activityLevel || '',
                    bodyFatPercentage: profile.bodyFatPercentage ?? null,
                    muscleMassPercentage: profile.muscleMassPercentage ?? null,
                    visceralFat: profile.visceralFat ?? null,
                    bioimpedanceData: profile.bioimpedanceData || '',

                    chestCircumference: profile.chestCircumference ?? null,
                    waistCircumference: profile.waistCircumference ?? null,
                    hipCircumference: profile.hipCircumference ?? null,
                    leftArmCircumference: profile.leftArmCircumference ?? null,
                    rightArmCircumference: profile.rightArmCircumference ?? null,
                    leftLegCircumference: profile.leftLegCircumference ?? null,
                    rightLegCircumference: profile.rightLegCircumference ?? null,
                    anthropometry: profile.anthropometry || '',

                    mobilityAnalysis: profile.mobilityAnalysis || ''
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
        this.userSelectedProfile.set(true);
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

    // ---- Quick Measurement: Save IGC + Peso from the Ficha Técnica ----
    saveQuickMeasurement() {
        const weight = this.quickWeight();
        const igc = this.quickIgc();
        const date = this.quickDate();

        if (!weight || weight <= 0) return;

        this.data.addPhysioEntry({
            studentEmail: this.studentEmail(),
            date: date,
            weight: weight,
            igc: igc ?? undefined,
            measuredBy: 'coach'
        });

        this.quickWeight.set(null);
        this.quickIgc.set(null);
        this.quickSaved.set(true);
        setTimeout(() => this.quickSaved.set(false), 3000);
    }

    public lineChartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: localStorage.getItem('theme') === 'dark' ? '#94a3b8' : '#475569' } }
        },
        scales: {
            x: {
                ticks: { color: localStorage.getItem('theme') === 'dark' ? '#94a3b8' : '#475569' },
                grid: { color: localStorage.getItem('theme') === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                ticks: { color: '#3b82f6' }, // azul como el peso
                grid: { color: localStorage.getItem('theme') === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                ticks: { color: '#ef4444' }, // rojo como el igc
                grid: { drawOnChartArea: false }
            }
        }
    };

    public historyChartData = computed<ChartConfiguration<'line'>['data'] | null>(() => {
        const history = this.studentPhysioHistory();
        if (!history || history.length === 0) return null;

        // we need left-to-right chronological order
        const chronological = [...history].reverse();

        const labels = chronological.map(entry => {
            const dateStr = entry.date.substring(0, 10);
            const parts = dateStr.split('-');
            return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
        });

        const weights = chronological.map(e => e.weight || null);
        const igcs = chronological.map(e => e.igc || null);

        return {
            labels: labels,
            datasets: [
                {
                    label: 'Peso (kg)',
                    data: weights as any,
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    borderColor: '#3b82f6',
                    pointBackgroundColor: '#2563eb',
                    yAxisID: 'y',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'IGC (%)',
                    data: igcs as any,
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    borderColor: '#ef4444',
                    pointBackgroundColor: '#dc2626',
                    yAxisID: 'y1',
                    fill: true,
                    tension: 0.3
                }
            ]
        };
    });

    saveProfile() {
        const formVals = this.profileForm.getRawValue();
        const payload: StudentProfile = {
            studentEmail: this.studentEmail(),
            objective: formVals.objective || '',
            biotype: formVals.biotype || '',
            activityLevel: formVals.activityLevel || '',

            bodyFatPercentage: formVals.bodyFatPercentage ?? undefined,
            muscleMassPercentage: formVals.muscleMassPercentage ?? undefined,
            visceralFat: formVals.visceralFat ?? undefined,
            bioimpedanceData: formVals.bioimpedanceData || '',

            chestCircumference: formVals.chestCircumference ?? undefined,
            waistCircumference: formVals.waistCircumference ?? undefined,
            hipCircumference: formVals.hipCircumference ?? undefined,
            leftArmCircumference: formVals.leftArmCircumference ?? undefined,
            rightArmCircumference: formVals.rightArmCircumference ?? undefined,
            leftLegCircumference: formVals.leftLegCircumference ?? undefined,
            rightLegCircumference: formVals.rightLegCircumference ?? undefined,
            anthropometry: formVals.anthropometry || '',

            mobilityAnalysis: formVals.mobilityAnalysis || '',
            
            // Preserve existing nutrition data
            dietPlan: this.selectedProfile()?.dietPlan || '',
            supplements: this.selectedProfile()?.supplements || '',
            adjuncts: this.selectedProfile()?.adjuncts || ''
        };

        this.data.saveProfile(this.studentEmail(), payload);
        // Turn off creation mode so it falls back to the newly added profile as readonly
        this.isCreatingNew.set(false);
    }
    deleteCurrentProfile() {
        const profile = this.selectedProfile();
        if (profile?.id && confirm('¿Estás seguro de que deseas eliminar esta ficha técnica antigua? Esta acción no se puede deshacer.')) {
            this.data.deleteProfile(profile.id, this.studentEmail());
            // It will auto switch to creation or latest via effect
        }
    }

    deletePhysioEntry(id: string | undefined) {
        if (id && confirm('¿Deseas eliminar este registro rápido de Peso e IGC?')) {
            this.data.deletePhysioEntry(id, this.studentEmail());
        }
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
        addSection('Nivel de Actividad', formVals.activityLevel);

        let antropometriaStr = '';
        if (formVals.chestCircumference) antropometriaStr += `Pecho: ${formVals.chestCircumference}cm | `;
        if (formVals.waistCircumference) antropometriaStr += `Cintura: ${formVals.waistCircumference}cm | `;
        if (formVals.hipCircumference) antropometriaStr += `Cadera: ${formVals.hipCircumference}cm | `;
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

        addSection('Análisis Biomecánico', formVals.mobilityAnalysis || '');
        
        const profile = this.selectedProfile();
        addSection('Plan de Nutrición', profile?.dietPlan || '');
        addSection('Suplementación Regular', profile?.supplements || '');
        addSection('Coadyuvantes Suplementarios', profile?.adjuncts || '');

        doc.save(`Ficha_Clinica_${studentName.replace(/\s+/g, '_')}.pdf`);
    }
}
