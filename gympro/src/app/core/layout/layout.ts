import { Component, inject, signal, ChangeDetectionStrategy, effect, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth';
import { DataService } from '../../services/data';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Layout {
  auth = inject(AuthService);
  data = inject(DataService);

  drawerOpen = signal(false);
  notificationsOpen = signal(false);
  
  hasRoutines = computed(() => this.data.routines().length > 0);
  hasPhysio = computed(() => this.data.physioEntries().length > 0);
  hasPhotos = computed(() => {
    const email = this.auth.currentUser()?.email;
    if (!email) return false;
    const photos = this.data.studentPhotos().get(email);
    return photos ? photos.length > 0 : false;
  });

  constructor() {
    effect((onCleanup) => {
      const u = this.auth.currentUser();
      if (!u) return;
      if (u.role === 'student') {
        this.data.loadRoutines(u.email);
        this.data.loadPhysio(u.email);
        this.data.loadNotifications(u.email);
        this.data.loadPhotos(u.email);

        // Poll for notifications every 30 seconds
        const interval = setInterval(() => {
          this.data.loadNotifications(u.email);
        }, 30000);

        onCleanup(() => clearInterval(interval));
      }
    });
  }

  canAccess(menuId: string): boolean {
    if (this.auth.isAdmin() || this.auth.isCoach()) return true;
    
    // Core menus always accessible
    if (['ai-chat', 'config', 'home', 'timers', 'ai-routine'].includes(menuId)) return true;
    
    // Others require at least one routine
    return this.hasRoutines();
  }

  shouldShow(menuId: string): boolean {
    if (this.auth.isAdmin() || this.auth.isCoach()) return true;

    const u = this.auth.currentUser();
    if (!u) return false;

    switch (menuId) {
      case 'calendar': 
        return u.coachEmail !== 'IA_ASSISTED' && this.hasRoutines();
      case 'ai-routine': 
        return u.coachEmail === 'IA_ASSISTED' && this.hasRoutines();
      case 'physio':
      case 'charts':
        return this.hasPhysio();
      case 'progress':
        return this.hasPhotos();
      default:
        return true;
    }
  }

  toggleNotifications() {
    this.notificationsOpen.update(v => !v);
  }

  markAllAsRead() {
    const u = this.auth.currentUser();
    if (u) {
      this.data.markAllAsRead(u.email);
      this.notificationsOpen.set(false);
    }
  }

  toggleDrawer() {
    this.drawerOpen.update(v => !v);
  }

  closeDrawer() {
    this.drawerOpen.set(false);
  }

  logout() {
    this.closeDrawer();
    this.auth.logout();
  }
}
