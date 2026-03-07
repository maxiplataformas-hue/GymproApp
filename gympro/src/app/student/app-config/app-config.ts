import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, AppTheme } from '../../services/theme';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'app-app-config',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './app-config.html'
})
export class AppConfig {
    themeService = inject(ThemeService);
    authService = inject(AuthService);

    readonly themes: { id: AppTheme, name: string, icon: string, colorClass: string }[] = [
        { id: 'dark', name: 'Oscuro (Dark)', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z', colorClass: 'bg-gray-800 text-white' },
        { id: 'light', name: 'Claro (Light)', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z', colorClass: 'bg-white text-gray-800 border-gray-200' },
        { id: 'pink', name: 'Rosado (Pink)', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', colorClass: 'bg-pink-500 text-white' }
    ];

    selectTheme(themeId: AppTheme) {
        this.themeService.setTheme(themeId);
        this.authService.updateThemePreference(themeId);
    }
}
