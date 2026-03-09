import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
  otpDigits = signal<string[]>(['', '', '', '', '', '']);

  auth = inject(AuthService);
  themeService = inject(ThemeService);

  loginError = this.auth.loginError;
  otpSent = this.auth.otpSent;
  isLoading = this.auth.isLoading;

  onSubmitEmail() {
    if (this.emailControl.valid && this.emailControl.value) {
      this.auth.requestOtp(this.emailControl.value.trim().toLowerCase());
    } else {
      this.emailControl.markAsTouched();
    }
  }

  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(0, 1);
    input.value = val;
    const digits = [...this.otpDigits()];
    digits[index] = val;
    this.otpDigits.set(digits);

    if (val && index < 5) {
      const next = input.parentElement?.querySelectorAll('input')[index + 1] as HTMLInputElement;
      next?.focus();
    }

    if (digits.every(d => d !== '')) {
      this.auth.verifyOtp(digits.join(''));
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      const digits = [...this.otpDigits()];
      if (!digits[index] && index > 0) {
        const input = (event.target as HTMLInputElement)
          .parentElement?.querySelectorAll('input')[index - 1] as HTMLInputElement;
        input?.focus();
      }
    }
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';
    const digits = pasted.split('').concat(['', '', '', '', '', '']).slice(0, 6);
    this.otpDigits.set(digits);
    if (digits.every(d => d !== '')) {
      this.auth.verifyOtp(digits.join(''));
    }
  }

  resendCode() {
    const email = this.auth.pendingEmail();
    if (email) {
      this.otpDigits.set(['', '', '', '', '', '']);
      this.auth.otpSent.set(false);
      this.auth.requestOtp(email);
    }
  }

  setTheme(theme: AppTheme) {
    this.themeService.setTheme(theme);
  }
}
