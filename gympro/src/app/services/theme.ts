import { Injectable, signal, effect } from '@angular/core';

export type AppTheme = 'light' | 'dark' | 'pink';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme = signal<AppTheme>('dark'); // Default to dark

  constructor() {
    const savedTheme = localStorage.getItem('gympro-theme') as AppTheme;
    if (savedTheme) {
      this.currentTheme.set(savedTheme);
    } else {
      // Auto-detect system preference if no save
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme.set(prefersDark ? 'dark' : 'light');
    }
    
    // Effect to apply theme variable to the document root safely
    effect(() => {
      const theme = this.currentTheme();
      localStorage.setItem('gympro-theme', theme);
      
      // Update data attribute for custom CSS vars
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Also toggle Tailwind dark mode class if needed
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
      }
    });
  }

  setTheme(theme: AppTheme) {
    this.currentTheme.set(theme);
  }
}
