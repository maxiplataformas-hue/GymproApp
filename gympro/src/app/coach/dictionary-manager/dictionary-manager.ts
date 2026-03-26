import { Component, inject, signal, computed, OnInit, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService, DictionaryConcept } from '../../services/data';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-dictionary-manager',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dictionary-manager.html'
})
export class DictionaryManager implements OnInit {
  private data = inject(DataService);
  private auth = inject(AuthService);

  userEmail = computed(() => this.auth.currentUser()?.email ?? '');
  isAdmin = computed(() =>
    this.auth.currentUser()?.role === 'admin' ||
    (this.auth.currentUser()?.email ?? '').toLowerCase().includes('admin')
  );

  concepts = this.data.dictionaryConcepts;
  searchQuery = signal('');
  selectedCategory = signal('Todos');
  showOnlyMine = signal(false);

  readonly categories = ['Todos', 'Entrenamiento', 'Nutrición', 'Fisiología', 'Suplementación', 'Recuperación', 'Métricas'];

  filteredConcepts = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const cat = this.selectedCategory();
    const onlyMine = this.showOnlyMine();
    const me = this.userEmail();
    return this.concepts().filter(c => {
      const matchQ = !q || c.term.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q);
      const matchCat = cat === 'Todos' || c.category === cat;
      const matchOwner = !onlyMine || c.coachEmail === me;
      return matchQ && matchCat && matchOwner;
    });
  });

  // Form state
  isFormOpen = signal(false);
  editingId = signal<string | null>(null);
  formTerm = signal('');
  formDefinition = signal('');
  formCategory = signal('Entrenamiento');
  formError = signal('');

  ngOnInit() {
    this.data.loadDictionary();
  }

  openCreate() {
    this.editingId.set(null);
    this.formTerm.set('');
    this.formDefinition.set('');
    this.formCategory.set('Entrenamiento');
    this.formError.set('');
    this.isFormOpen.set(true);
  }

  openEdit(concept: DictionaryConcept) {
    this.editingId.set(concept.id!);
    this.formTerm.set(concept.term);
    this.formDefinition.set(concept.definition);
    this.formCategory.set(concept.category);
    this.formError.set('');
    this.isFormOpen.set(true);
  }

  cancelForm() {
    this.isFormOpen.set(false);
  }

  saveForm() {
    if (!this.formTerm().trim() || !this.formDefinition().trim()) {
      this.formError.set('El término y la definición son obligatorios.');
      return;
    }

    const id = this.editingId();
    if (id) {
      this.data.updateConcept(id, {
        term: this.formTerm().trim(),
        definition: this.formDefinition().trim(),
        category: this.formCategory()
      }, this.userEmail()).subscribe({
        next: () => this.isFormOpen.set(false),
        error: (e) => this.formError.set(e.error || 'Error al guardar.')
      });
    } else {
      this.data.saveConcept({
        term: this.formTerm().trim(),
        definition: this.formDefinition().trim(),
        category: this.formCategory(),
        coachEmail: this.userEmail()
      }).subscribe({
        next: () => this.isFormOpen.set(false),
        error: (e) => this.formError.set(e.error || 'Error al guardar.')
      });
    }
  }

  deleteConcept(concept: DictionaryConcept) {
    const msg = `¿Eliminar el término "${concept.term}"?`;
    if (confirm(msg)) {
      this.data.deleteConcept(concept.id!, this.userEmail()).subscribe({
        error: (e) => alert(e.error || 'No tienes permiso para eliminar.')
      });
    }
  }

  canEdit(concept: DictionaryConcept): boolean {
    return this.isAdmin() || concept.coachEmail === this.userEmail();
  }

  canDelete(concept: DictionaryConcept): boolean {
    return this.isAdmin() || concept.coachEmail === this.userEmail();
  }

  getBadgeClass(category: string): string {
    const map: Record<string, string> = {
      'Entrenamiento': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      'Nutrición': 'bg-green-500/15 text-green-400 border-green-500/30',
      'Fisiología': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      'Suplementación': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      'Recuperación': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      'Métricas': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    };
    return map[category] ?? 'bg-border text-text-muted';
  }
}
