package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.StudentProfile;
import cl.maxi.gympro.repository.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/profiles")
@CrossOrigin(origins = "http://localhost:4200")
public class ProfileController {

    @Autowired
    private StudentProfileRepository repository;

    @GetMapping("/{email:.+}")
    public ResponseEntity<List<StudentProfile>> getProfileHistoryByEmail(@PathVariable String email) {
        // Orden descendente por ID o Fecha para traer el más nuevo primero
        List<StudentProfile> history = repository.findByStudentEmailIgnoreCase(email, Sort.by(Sort.Direction.DESC, "recordDate"));
        return ResponseEntity.ok(history);
    }

    @PostMapping("/{email:.+}")
    public ResponseEntity<StudentProfile> createNewProfileSnapshot(@PathVariable String email,
            @RequestBody StudentProfile dto) {
        String normalizedEmail = email.trim().toLowerCase();
        dto.setStudentEmail(normalizedEmail);

        // Si no viene con fecha o nombre, asignamos el de hoy
        if (dto.getRecordDate() == null || dto.getRecordDate().isEmpty()) {
            dto.setRecordDate(LocalDate.now().toString());
        }
        if (dto.getRecordName() == null || dto.getRecordName().isEmpty()) {
            dto.setRecordName("Evaluación " + LocalDate.now().toString());
        }

        return ResponseEntity.ok(repository.save(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProfile(@PathVariable String id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
