import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth';
import { ThemeService, AppTheme } from '../../services/theme';
import { BiometricService } from '../../services/biometric';
import { PushNotificationService } from '../../services/push-notification';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  otpControl = new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]);

  auth = inject(AuthService);
  themeService = inject(ThemeService);
  biometric = inject(BiometricService);
  push = inject(PushNotificationService);
  router = inject(Router);

  loginError = this.auth.loginError;
  isLoading = this.auth.isLoading;

  // Login flow state
  isWaitingForOtp = signal(false);

  // Post-login biometric setup
  showBiometricSetup = signal(false);
  pendingUser = signal<User | null>(null);

  // Biometric login state
  isBiometricLoading = signal(false);
  biometricError = signal<string | null>(null);

  // PWA Install logic
  deferredPrompt: any;
  showInstallButton = signal(false);

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton.set(true);
    });
  }

  async installApp() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.showInstallButton.set(false);
    }
    this.deferredPrompt = null;
  }

  onSubmitEmail() {
    if (this.emailControl.valid && this.emailControl.value) {
      this.auth.sendLoginOtp(
        this.emailControl.value.trim().toLowerCase(),
        () => this.isWaitingForOtp.set(true),
        () => {}
      );
    } else {
      this.emailControl.markAsTouched();
    }
  }

  onVerifyOtp() {
    const email = this.emailControl.value;
    const code = this.otpControl.value;
    if (email && code && this.otpControl.valid) {
      this.auth.verifyLoginOtp(
        email,
        code,
        (user) => this.handleLoginSuccess(user)
      );
    } else {
      this.otpControl.markAsTouched();
    }
  }

  private handleLoginSuccess(user: User) {
    // Offer biometric setup only if available and not already registered
    if (this.biometric.isAvailable() && !this.biometric.hasSavedCredential()) {
      this.pendingUser.set(user);
      this.showBiometricSetup.set(true);
    } else {
      if (user.role === 'student') this.push.requestPermission();
      this.router.navigate(['/app', user.role]);
    }
  }

  async attemptBiometricLogin() {
    this.biometricError.set(null);
    this.isBiometricLoading.set(true);
    const email = await this.biometric.authenticate();
    if (email) {
      // Use sendLoginOtp - it will skip OTP if device is trusted and navigate directly
      this.auth.sendLoginOtp(
        email,
        () => this.isWaitingForOtp.set(true), // Only shown if device is NOT trusted
        () => this.biometricError.set('Error al verificar. Usa tu correo.')
      );
    } else {
      this.biometricError.set('Verificación biométrica fallida. Usa tu correo.');
    }
    this.isBiometricLoading.set(false);
  }

  async enableBiometrics() {
    const user = this.pendingUser();
    if (!user) return;
    this.isBiometricLoading.set(true);
    await this.biometric.register(user.email);
    this.isBiometricLoading.set(false);
    if (user.role === 'student') this.push.requestPermission();
    this.router.navigate(['/app', user.role]);
  }

  skipBiometrics() {
    const user = this.pendingUser();
    if (user) {
      if (user.role === 'student') this.push.requestPermission();
      this.router.navigate(['/app', user.role]);
    }
  }

  setTheme(theme: AppTheme) {
    this.themeService.setTheme(theme);
  }
}
