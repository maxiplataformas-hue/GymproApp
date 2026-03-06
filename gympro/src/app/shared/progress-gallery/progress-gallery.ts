import { Component, input, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, StudentPhoto } from '../../services/data';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-progress-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './progress-gallery.html'
})
export class ProgressGallery {
  studentEmail = input.required<string>();
  isCoach = input.required<boolean>();

  dataService = inject(DataService);
  authService = inject(AuthService);

  readonly uniqueId = Math.random().toString(36).substring(2, 9);

  uploadDate = new Date().toISOString().split('T')[0];
  previewBase64: string | null = null;

  photos = computed(() => {
    const email = this.studentEmail();
    if (!email) return [];
    const map = this.dataService.studentPhotos();
    return map.get(email) || [];
  });

  constructor() {
    effect(() => {
      const email = this.studentEmail();
      if (email) {
        this.dataService.loadPhotos(email);
        this.previewBase64 = null; // reset on student change
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // File size validation (approx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy pesada. Por favor selecciona una menor a 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.previewBase64 = reader.result as string;
    };
    reader.onerror = () => {
      console.error('Error reading the file');
    };
    reader.readAsDataURL(file); // Converts it directly to Base64
  }

  uploadPhoto() {
    if (!this.previewBase64) return;

    const uploader = this.authService.currentUser()?.email || 'Desconocido';

    this.dataService.uploadPhoto({
      studentEmail: this.studentEmail(),
      uploaderEmail: uploader,
      date: this.uploadDate,
      photoBase64: this.previewBase64
    });

    // reset UI
    this.previewBase64 = null;
  }

  deletePhoto(photoId: string) {
    if (confirm('¿Estás seguro que deseas eliminar esta foto de registro?')) {
      this.dataService.deletePhoto(photoId, this.studentEmail());
    }
  }
}
