import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { ThemeService, AppTheme } from '../../services/theme';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  auth = inject(AuthService);
  themeService = inject(ThemeService);

  loginError = this.auth.loginError;

  onSubmit() {
    if (this.emailControl.valid && this.emailControl.value) {
      this.auth.login(this.emailControl.value.trim());
    } else {
      this.emailControl.markAsTouched();
    }
  }

  setTheme(theme: AppTheme) {
    this.themeService.setTheme(theme);
  }
}
