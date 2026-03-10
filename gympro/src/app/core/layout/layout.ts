import { Component, inject, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';
import { DataService } from '../../services/data';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Layout {
  auth = inject(AuthService);
  data = inject(DataService);

  drawerOpen = signal(false);

  constructor() {
    effect(() => {
      const u = this.auth.currentUser();
      if (!u) return;
      if (u.role === 'student') {
        this.data.loadRoutines(u.email);
        this.data.loadPhysio(u.email);
      }
    });
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
