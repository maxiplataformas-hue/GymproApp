package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.Exercise;
import cl.maxi.gympro.model.Routine;
import cl.maxi.gympro.model.RoutineItem;
import cl.maxi.gympro.repository.AccessLogRepository;
import cl.maxi.gympro.repository.ExerciseRepository;
import cl.maxi.gympro.repository.RoutineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/metrics")
@CrossOrigin(origins = "*")
public class AdminMetricsController {

    @Autowired
    private AccessLogRepository accessLogRepository;

    @Autowired
    private RoutineRepository routineRepository;

    @Autowired
    private ExerciseRepository exerciseRepository;

    // Default formatter for frontend ISO strings
    private final DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;

    @GetMapping("/access")
    public ResponseEntity<?> getAccessMetrics(
            @RequestParam("from") String fromStr,
            @RequestParam("to") String toStr) {
        
        try {
            LocalDateTime from = LocalDateTime.parse(fromStr, formatter);
            LocalDateTime to = LocalDateTime.parse(toStr, formatter);

            long coachCount = accessLogRepository.countByRoleAndTimestampBetween("coach", from, to);
            long studentCount = accessLogRepository.countByRoleAndTimestampBetween("student", from, to);

            return ResponseEntity.ok(Map.of(
                    "coachCount", coachCount,
                    "studentCount", studentCount
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error parsing dates: " + e.getMessage());
        }
    }

    @GetMapping("/top-exercises")
    public ResponseEntity<?> getTopExercises(
            @RequestParam("from") String fromStr,
            @RequestParam("to") String toStr) {

        try {
            // ISO strings sort naturally, so we can filter them as strings if they are formatted correctly.
            // For safety and compatibility, we'll fetch all and filter in memory since we are in a rapid prototype
            List<Routine> allRoutines = routineRepository.findAll();
            
            // Filter by date
            List<Routine> filteredRoutines = allRoutines.stream()
                .filter(r -> {
                    if (r.getCreatedAt() == null) return false;
                    try {
                        String createdAtStr = r.getCreatedAt();
                        // Sometimes it has Z, sometimes it doesn't. 
                        // String comparison works if they are ISO-8601
                        return createdAtStr.compareTo(fromStr) >= 0 && createdAtStr.compareTo(toStr) <= 0;
                    } catch (Exception ex) {
                        return false;
                    }
                })
                .collect(Collectors.toList());

            // Count exercises
            Map<String, Integer> exerciseCounts = new HashMap<>();
            for (Routine routine : filteredRoutines) {
                if (routine.getItems() != null) {
                    for (RoutineItem item : routine.getItems()) {
                        if (item.getExerciseId() != null) {
                            exerciseCounts.put(item.getExerciseId(), exerciseCounts.getOrDefault(item.getExerciseId(), 0) + 1);
                        }
                    }
                }
            }

            // Get Top 10
            List<Map.Entry<String, Integer>> topEntries = exerciseCounts.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(10)
                .collect(Collectors.toList());

            // Fetch names
            List<Map<String, Object>> result = new ArrayList<>();
            for (Map.Entry<String, Integer> entry : topEntries) {
                String exId = entry.getKey();
                int count = entry.getValue();
                
                String exerciseName = "Desconocido";
                Optional<Exercise> exOpt = exerciseRepository.findById(exId);
                if (exOpt.isPresent()) {
                    exerciseName = exOpt.get().getName();
                }

                result.add(Map.of(
                    "id", exId,
                    "name", exerciseName,
                    "count", count
                ));
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error processing top exercises: " + e.getMessage());
        }
    }
}
