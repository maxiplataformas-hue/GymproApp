package cl.maxi.gympro.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "dictionary")
public class DictionaryConcept {
    @Id
    private String id;
    private String term;
    private String definition;
    private String category; // Entrenamiento | Nutrición | Fisiología | Suplementación | Recuperación | Métricas
    private String coachEmail; // "sistema" for seeded data
    private String createdAt;
}
