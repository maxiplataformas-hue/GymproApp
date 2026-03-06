import { Routes } from '@angular/router';
import { SplashScreen } from './core/splash-screen/splash-screen';
import { Login } from './core/login/login';
import { Onboarding } from './core/onboarding/onboarding';
import { Layout } from './core/layout/layout';
import { StudentDashboard } from './student/student-dashboard/student-dashboard';
import { PhysiologicData } from './student/physiologic-data/physiologic-data';
import { ProgressCharts } from './student/progress-charts/progress-charts';
import { RoutineCalendar } from './student/routine-calendar/routine-calendar';
import { AiChat } from './student/ai-chat/ai-chat';
import { CoachDashboard } from './coach/coach-dashboard/coach-dashboard';

export const routes: Routes = [
    { path: '', component: SplashScreen },
    { path: 'login', component: Login },
    { path: 'onboarding', component: Onboarding },
    {
        path: 'app',
        component: Layout,
        children: [
            { path: 'student', component: StudentDashboard },
            { path: 'student/physio', component: PhysiologicData },
            { path: 'student/charts', component: ProgressCharts },
            { path: 'student/calendar', component: RoutineCalendar },
            { path: 'student/chat', component: AiChat },
            { path: 'coach', component: CoachDashboard },
            { path: '', redirectTo: 'student', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: '' }
];
