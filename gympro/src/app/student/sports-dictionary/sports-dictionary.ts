import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService, DictionaryConcept } from '../../services/data';

@Component({
  selector: 'app-sports-dictionary',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './sports-dictionary.html'
})
export class SportsDictionary implements OnInit {
  private data = inject(DataService);

  searchQuery = signal('');
  selectedCategory = signal('Todos');

  readonly categories = ['Todos', 'Entrenamiento', 'Nutrición', 'Fisiología', 'Suplementación', 'Recuperación', 'Métricas'];

  concepts = this.data.dictionaryConcepts;

  filteredConcepts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    return this.concepts()
      .filter(c => {
        const matchesQuery = !q || c.term.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q);
        const matchesCat = cat === 'Todos' || c.category === cat;
        return matchesQuery && matchesCat;
      });
  });

  categoryColors: Record<string, string> = {
    'Entrenamiento': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Nutrición': 'bg-green-500/15 text-green-400 border-green-500/30',
    'Fisiología': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'Suplementación': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    'Recuperación': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    'Métricas': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  };

  ngOnInit() {
    this.data.loadDictionary();
  }

  getBadgeClass(category: string): string {
    return this.categoryColors[category] ?? 'bg-border text-text-muted';
  }
}
