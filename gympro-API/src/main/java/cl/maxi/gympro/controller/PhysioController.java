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

    @GetMapping("/{studentEmail}")
    public List<PhysioEntry> getPhysioHistory(@PathVariable String studentEmail) {
        return physioRepository.findByStudentEmail(studentEmail);
    }

    @PostMapping
    public PhysioEntry saveEntry(@RequestBody PhysioEntry entry) {
        return physioRepository.save(entry);
    }
}
