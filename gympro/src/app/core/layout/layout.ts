import { Component, inject, signal, ChangeDetectionStrategy, effect } from '@angular/core';
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

  constructor() {
    effect((onCleanup) => {
      const u = this.auth.currentUser();
      if (!u) return;
      if (u.role === 'student') {
        this.data.loadRoutines(u.email);
        this.data.loadPhysio(u.email);
        this.data.loadNotifications(u.email);

        // Poll for notifications every 30 seconds
        const interval = setInterval(() => {
          this.data.loadNotifications(u.email);
        }, 30000);

        onCleanup(() => clearInterval(interval));
      }
    });
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
