import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-onboarding',
  imports: [ReactiveFormsModule],
  templateUrl: './onboarding.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Onboarding {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  onboardingForm = this.fb.group({
    name: ['', Validators.required],
    age: [null as number | null, [Validators.required, Validators.min(10)]],
    initialWeight: [null as number | null, [Validators.required, Validators.min(30)]],
    height: [null as number | null, [Validators.required, Validators.min(50)]]
  });

  onSubmit() {
    if (this.onboardingForm.valid) {
      this.auth.completeOnboarding(this.onboardingForm.value as any);
    } else {
      this.onboardingForm.markAllAsTouched();
    }
  }
}
