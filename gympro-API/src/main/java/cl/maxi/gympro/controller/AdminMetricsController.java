package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.AccessLog;
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

    @GetMapping("/access-details")
    public ResponseEntity<?> getAccessDetails(
            @RequestParam("from") String fromStr,
            @RequestParam("to") String toStr) {
        
        try {
            LocalDateTime from = LocalDateTime.parse(fromStr, formatter);
            LocalDateTime to = LocalDateTime.parse(toStr, formatter);

            List<AccessLog> logs = accessLogRepository.findByTimestampBetween(from, to);
            // Sort logs descending by timestamp
            logs.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));

            return ResponseEntity.ok(logs);
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

            // Count exercises by resolved name
            Map<String, String> idToNameCache = new HashMap<>();
            Map<String, Integer> exerciseCounts = new HashMap<>();
            
            for (Routine routine : filteredRoutines) {
                if (routine.getItems() != null) {
                    for (RoutineItem item : routine.getItems()) {
                        String exId = item.getExerciseId();
                        if (exId != null && !exId.trim().isEmpty()) {
                            // Resolve actual name: if findById works, use true name. Else, it must be an AI plain-text name.
                            String actualName = idToNameCache.computeIfAbsent(exId, key -> {
                                Optional<Exercise> exOpt = exerciseRepository.findById(key);
                                return exOpt.isPresent() ? exOpt.get().getName() : key;
                            });
                            
                            // Normalize somewhat (Capitalize first letter to group "sentadilla" and "Sentadilla")
                            actualName = actualName.substring(0, 1).toUpperCase() + actualName.substring(1);
                            
                            exerciseCounts.put(actualName, exerciseCounts.getOrDefault(actualName, 0) + 1);
                        }
                    }
                }
            }

            // Get Top 10
            List<Map.Entry<String, Integer>> topEntries = exerciseCounts.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(10)
                .collect(Collectors.toList());

            // Build result
            List<Map<String, Object>> result = new ArrayList<>();
            for (Map.Entry<String, Integer> entry : topEntries) {
                result.add(Map.of(
                    "id", entry.getKey(),
                    "name", entry.getKey(),
                    "count", entry.getValue()
                ));
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error processing top exercises: " + e.getMessage());
        }
    }
}
