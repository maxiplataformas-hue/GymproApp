import { Routes } from '@angular/router';
import { SplashScreen } from './core/splash-screen/splash-screen';
import { Login } from './core/login/login';

import { Layout } from './core/layout/layout';
import { StudentDashboard } from './student/student-dashboard/student-dashboard';
import { PhysiologicData } from './student/physiologic-data/physiologic-data';
import { ProgressCharts } from './student/progress-charts/progress-charts';
import { RoutineCalendar } from './student/routine-calendar/routine-calendar';
import { AiChat } from './student/ai-chat/ai-chat';
import { StudentProgress } from './student/student-progress/student-progress';
import { AppConfig } from './student/app-config/app-config';
import { CoachDashboard } from './coach/coach-dashboard/coach-dashboard';
import { AdminDashboard } from './admin/admin-dashboard/admin-dashboard';

export const routes: Routes = [
    { path: '', component: SplashScreen },
    { path: 'login', component: Login },

    {
        path: 'app',
        component: Layout,
        children: [
            { path: 'admin', component: AdminDashboard },
            { path: 'student', component: StudentDashboard },
            { path: 'student/physio', component: PhysiologicData },
            { path: 'student/charts', component: ProgressCharts },
            { path: 'student/calendar', component: RoutineCalendar },
            { path: 'student/chat', component: AiChat },
            { path: 'student/progress', component: StudentProgress },
            { path: 'student/config', component: AppConfig },
            { path: 'coach', component: CoachDashboard },
            { path: '', redirectTo: 'student/calendar', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: '' }
];
