package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.PhysioEntry;
import cl.maxi.gympro.repository.PhysioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/physio")
@CrossOrigin(origins = "*")
public class PhysioController {

    @Autowired
    private PhysioRepository physioRepository;

    @GetMapping("/{studentEmail:.+}")
    public List<PhysioEntry> getPhysioHistory(@PathVariable String studentEmail) {
        return physioRepository.findByStudentEmailIgnoreCase(studentEmail);
    }

    @PostMapping
    public PhysioEntry saveEntry(@RequestBody PhysioEntry entry) {
        if (entry.getStudentEmail() != null) {
            entry.setStudentEmail(entry.getStudentEmail().trim().toLowerCase());
        }
        return physioRepository.save(entry);
    }

    @DeleteMapping("/{id}")
    public void deleteEntry(@PathVariable String id) {
        physioRepository.deleteById(id);
    }
}
