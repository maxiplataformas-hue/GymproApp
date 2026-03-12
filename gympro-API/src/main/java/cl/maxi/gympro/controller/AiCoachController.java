package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.PhysioEntry;
import cl.maxi.gympro.model.Routine;
import cl.maxi.gympro.model.RoutineItem;
import cl.maxi.gympro.repository.PhysioRepository;
import cl.maxi.gympro.repository.RoutineRepository;
import cl.maxi.gympro.service.GeminiService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai-coach")
@CrossOrigin(origins = "*")
public class AiCoachController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private RoutineRepository routineRepository;

    @Autowired
    private PhysioRepository physioRepository;

    @PostMapping("/generate-routine")
    public ResponseEntity<Routine> generateRoutine(@RequestBody AiRoutineRequest request) {
        String prompt = String.format(
            "Genera una rutina de entrenamiento para un usuario con: " +
            "Objetivo: '%s', Nivel: '%s', Edad: %d años, Peso: %.1f kg, Estatura: %.1f cm. " +
            "Equipo disponible: %s. " +
            "Responde ÚNICAMENTE con un objeto JSON válido que tenga esta estructura exacta: " +
            "{ \"exercises\": [ { \"name\": \"Nombre del Ejercicio\", \"sets\": 3, \"reps\": \"12\", \"weight\": 0.0 } ] }. " +
            "Adapta el volumen e intensidad a los datos físicos. " +
            "Diferencia bien los ejercicios según el equipo. Si es 'weight-loss', prioriza repeticiones altas (15+). Si es 'muscle-gain', prioriza series de fuerza (8-12).",
            request.getGoal(), request.getLevel(), 
            request.getAge() != null ? request.getAge() : 30,
            request.getWeight() != null ? request.getWeight() : 70.0,
            request.getHeight() != null ? request.getHeight() : 170.0,
            String.join(", ", request.getEquipment())
        );

        String aiResponse = geminiService.getResponse(prompt, "CONTEXTO: Generación de rutina estructurada JSON para CoachPRO. NO USAR MARKDOWN, SOLO JSON.");
        
        // Clean JSON from potential markdown blocks
        String cleanJson = aiResponse.replaceAll("```json", "").replaceAll("```", "").trim();
        
        // Check for existing routine to avoid NonUniqueResultException on retrieval
        String today = LocalDate.now().toString();
        Optional<Routine> existing = routineRepository.findByStudentEmailIgnoreCaseAndDate(request.getEmail(), today);
        
        Routine routine = existing.orElse(new Routine());
        routine.setStudentEmail(request.getEmail());
        routine.setDate(today);
        routine.setCreatedAt(java.time.LocalDateTime.now().toString());
        
        // Auto-save initial weight entry if not exists for today
        if (request.getWeight() != null) {
            try {
                List<PhysioEntry> history = physioRepository.findByStudentEmailIgnoreCase(request.getEmail());
                if (history.stream().noneMatch(e -> today.equals(e.getDate()))) {
                    PhysioEntry newEntry = new PhysioEntry();
                    newEntry.setStudentEmail(request.getEmail());
                    newEntry.setDate(today);
                    newEntry.setWeight(request.getWeight());
                    newEntry.setMeasuredBy("student");
                    physioRepository.save(newEntry);
                }
            } catch (Exception e) {
                // Ignore errors here, main goal is routine
            }
        }
        List<RoutineItem> items = new ArrayList<>();

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(cleanJson);
            com.fasterxml.jackson.databind.JsonNode exercises = root.path("exercises");

            if (exercises.isArray() && exercises.size() > 0) {
                for (com.fasterxml.jackson.databind.JsonNode node : exercises) {
                    RoutineItem item = new RoutineItem();
                    item.setId(UUID.randomUUID().toString());
                    item.setExerciseId(node.path("name").asText());
                    item.setSets(node.path("sets").asInt(3));
                    String repsStr = node.path("reps").asText("12");
                    try {
                        item.setReps(Integer.parseInt(repsStr.replaceAll("[^0-9]", "")));
                    } catch (Exception e) {
                        item.setReps(12);
                    }
                    item.setWeight(node.path("weight").asDouble(0.0));
                    item.setCompleted(false);
                    items.add(item);
                }
            }
        } catch (Exception e) {
            // Fallback content if AI fails to provide JSON
            items.add(new RoutineItem(UUID.randomUUID().toString(), "Caminata de Calentamiento", 1, 15, 0.0, false));
            items.add(new RoutineItem(UUID.randomUUID().toString(), "Sentadillas (Peso Corporal)", 3, 12, 0.0, false));
            items.add(new RoutineItem(UUID.randomUUID().toString(), "Flexiones o Push-ups", 3, 10, 0.0, false));
        }

        if (items.isEmpty()) {
            items.add(new RoutineItem(UUID.randomUUID().toString(), "Estiramiento Dinámico", 1, 10, 0.0, false));
        }
        
        routine.setItems(items);
        return ResponseEntity.ok(routineRepository.save(routine));
    }

    @Data
    public static class AiRoutineRequest {
        private String email;
        private String goal;
        private String level;
        private List<String> equipment;
        private Integer age;
        private Double weight;
        private Double height;
    }
}
