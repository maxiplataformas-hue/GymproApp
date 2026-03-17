package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.Exercise;
import cl.maxi.gympro.repository.ExerciseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exercises")
@CrossOrigin(origins = "*")
public class ExerciseController {

    @Autowired
    private ExerciseRepository exerciseRepository;

    @GetMapping
    public List<Exercise> getAllExercises() {
        return exerciseRepository.findAll();
    }

    @PostMapping
    public Exercise createOrUpdateExercise(@RequestBody Exercise exercise) {
        return exerciseRepository.save(exercise);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExercise(@PathVariable String id) {
        exerciseRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
