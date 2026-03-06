import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { ProgressGallery } from '../../shared/progress-gallery/progress-gallery';

@Component({
    selector: 'app-student-progress',
    standalone: true,
    imports: [CommonModule, ProgressGallery],
    templateUrl: './student-progress.html'
})
export class StudentProgress {
    authService = inject(AuthService);
}
