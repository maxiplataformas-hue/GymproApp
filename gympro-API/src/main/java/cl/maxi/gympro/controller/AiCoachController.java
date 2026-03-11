package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.Routine;
import cl.maxi.gympro.model.RoutineItem;
import cl.maxi.gympro.repository.RoutineRepository;
import cl.maxi.gympro.service.GeminiService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai-coach")
@CrossOrigin(origins = "*")
public class AiCoachController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private RoutineRepository routineRepository;

    @PostMapping("/generate-routine")
    public ResponseEntity<Routine> generateRoutine(@RequestBody AiRoutineRequest request) {
        String prompt = String.format(
            "Genera una rutina de entrenamiento para un usuario con el objetivo de '%s', nivel '%s' y con el siguiente equipo: %s. " +
            "Responde ÚNICAMENTE con un objeto JSON válido que tenga esta estructura exacta: " +
            "{ \"exercises\": [ { \"name\": \"Nombre del Ejercicio\", \"sets\": 3, \"reps\": \"12\", \"weight\": 0.0 } ] }. " +
            "Diferencia bien los ejercicios según el equipo. Si es 'weight-loss', prioriza repeticiones altas (15+). Si es 'muscle-gain', prioriza series de fuerza (8-12).",
            request.getGoal(), request.getLevel(), String.join(", ", request.getEquipment())
        );

        String aiResponse = geminiService.getResponse(prompt, "CONTEXTO: Generación de rutina estructurada JSON para CoachPRO. NO USAR MARKDOWN, SOLO JSON.");
        
        // Clean JSON from potential markdown blocks
        String cleanJson = aiResponse.replaceAll("```json", "").replaceAll("```", "").trim();
        
        Routine routine = new Routine();
        routine.setStudentEmail(request.getEmail());
        routine.setDate(LocalDate.now().toString());
        List<RoutineItem> items = new ArrayList<>();

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(cleanJson);
            com.fasterxml.jackson.databind.JsonNode exercises = root.path("exercises");

            if (exercises.isArray() && exercises.size() > 0) {
                for (com.fasterxml.jackson.databind.JsonNode node : exercises) {
                    RoutineItem item = new RoutineItem();
                    item.setId(UUID.randomUUID().toString());
                    item.setExerciseId(node.path("name").asText()); // We store name in exerciseId for dynamic AI routine
                    item.setSets(node.path("sets").asInt(3));
                    // Handle reps as string in case AI gives range
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
            // Log error locally if possible and use backup
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
    }
}
