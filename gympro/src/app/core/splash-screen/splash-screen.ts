import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-splash-screen',
  imports: [NgOptimizedImage],
  templateUrl: './splash-screen.html',
  styleUrl: './splash-screen.css',
})
export class SplashScreen implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);

  ngOnInit() {
    // Navigate after 3 seconds
    setTimeout(() => {
      this.navigateNext();
    }, 3000);
  }

  skip() {
    this.navigateNext();
  }

  private navigateNext() {
    // Check if logged in
    const user = this.auth.currentUser();
    if (user) {
      this.router.navigate(['/app', user.role]);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
