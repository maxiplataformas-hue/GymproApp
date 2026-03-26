package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.DictionaryConcept;
import cl.maxi.gympro.repository.DictionaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/dictionary")
@CrossOrigin(origins = "*")
public class DictionaryController {

    @Autowired
    private DictionaryRepository dictionaryRepository;

    // GET all concepts (public - for students and coaches)
    @GetMapping
    public List<DictionaryConcept> getAll() {
        return dictionaryRepository.findAll();
    }

    // POST - create a new concept (coach or sistema)
    @PostMapping
    public DictionaryConcept create(@RequestBody DictionaryConcept concept) {
        if (concept.getCreatedAt() == null) {
            concept.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        return dictionaryRepository.save(concept);
    }

    // PUT - edit a concept (only owner coach or admin)
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id,
                                             @RequestBody DictionaryConcept updated,
                                             @RequestParam String requesterEmail) {
        Optional<DictionaryConcept> existing = dictionaryRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DictionaryConcept concept = existing.get();

        boolean isAdmin = "admin@coachpro.cl".equalsIgnoreCase(requesterEmail)
                || "admin".equalsIgnoreCase(requesterEmail);
        boolean isOwner = concept.getCoachEmail() != null
                && concept.getCoachEmail().equalsIgnoreCase(requesterEmail);

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(403).body("No tienes permiso para editar este concepto.");
        }

        concept.setTerm(updated.getTerm());
        concept.setDefinition(updated.getDefinition());
        concept.setCategory(updated.getCategory());
        return ResponseEntity.ok(dictionaryRepository.save(concept));
    }

    // DELETE - only admin
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id,
                                             @RequestParam String requesterEmail) {
        boolean isAdmin = "admin@coachpro.cl".equalsIgnoreCase(requesterEmail)
                || "admin".equalsIgnoreCase(requesterEmail);

        if (!isAdmin) {
            // coaches can delete their own concepts
            Optional<DictionaryConcept> existing = dictionaryRepository.findById(id);
            if (existing.isEmpty()) return ResponseEntity.notFound().build();
            boolean isOwner = existing.get().getCoachEmail() != null
                    && existing.get().getCoachEmail().equalsIgnoreCase(requesterEmail);
            if (!isOwner) {
                return ResponseEntity.status(403).body("Solo el admin puede eliminar conceptos del sistema.");
            }
        }

        dictionaryRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
