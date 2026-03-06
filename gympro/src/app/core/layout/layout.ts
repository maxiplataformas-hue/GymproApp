import { Component, inject, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';
import { DataService } from '../../services/data';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {
  auth = inject(AuthService);
  data = inject(DataService);

  constructor() {
    effect(() => {
      const u = this.auth.currentUser();
      if (u && u.role === 'student') {
        this.data.loadRoutines(u.email);
        this.data.loadPhysio(u.email);
      }
    });
  }

  logout() {
    this.auth.logout();
  }
}
