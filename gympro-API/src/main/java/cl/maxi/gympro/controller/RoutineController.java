package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.Routine;
import cl.maxi.gympro.repository.RoutineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/routines")
@CrossOrigin(origins = "*")
public class RoutineController {

    @Autowired
    private RoutineRepository routineRepository;

    @GetMapping("/{studentEmail}")
    public List<Routine> getRoutinesByStudent(@PathVariable String studentEmail) {
        return routineRepository.findByStudentEmail(studentEmail);
    }

    @GetMapping("/{studentEmail}/{date}")
    public ResponseEntity<Routine> getRoutineByDate(@PathVariable String studentEmail, @PathVariable String date) {
        Optional<Routine> routine = routineRepository.findByStudentEmailAndDate(studentEmail, date);
        return routine.map(ResponseEntity::ok)
                      .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Routine saveRoutine(@RequestBody Routine routine) {
        // Find existing routine for this user and date
        Optional<Routine> existing = routineRepository.findByStudentEmailAndDate(routine.getStudentEmail(), routine.getDate());
        
        if (existing.isPresent()) {
            Routine toUpdate = existing.get();
            // Just append new items or replace completely. Let's replace for simplicity
            toUpdate.setItems(routine.getItems());
            return routineRepository.save(toUpdate);
        } else {
            return routineRepository.save(routine);
        }
    }
}
