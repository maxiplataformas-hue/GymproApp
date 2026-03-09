package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.StudentProfile;
import cl.maxi.gympro.repository.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profiles")
@CrossOrigin(origins = "http://localhost:4200")
public class ProfileController {

    @Autowired
    private StudentProfileRepository repository;

    @GetMapping("/{email}")
    public ResponseEntity<StudentProfile> getProfileByEmail(@PathVariable String email) {
        return repository.findByStudentEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PutMapping("/{email}")
    public ResponseEntity<StudentProfile> saveOrUpdateProfile(@PathVariable String email,
            @RequestBody StudentProfile dto) {
        StudentProfile existing = repository.findByStudentEmail(email).orElse(null);

        if (existing != null) {
            existing.setObjective(dto.getObjective());
            existing.setBiotype(dto.getBiotype());
            existing.setAnthropometry(dto.getAnthropometry());
            existing.setBioimpedanceData(dto.getBioimpedanceData());
            existing.setMobilityAnalysis(dto.getMobilityAnalysis());
            existing.setDietPlan(dto.getDietPlan());
            existing.setSupplements(dto.getSupplements());
            existing.setAdjuncts(dto.getAdjuncts());
            return ResponseEntity.ok(repository.save(existing));
        } else {
            dto.setStudentEmail(email);
            return ResponseEntity.ok(repository.save(dto));
        }
    }
}
