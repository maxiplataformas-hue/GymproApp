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
import java.time.LocalDateTime;
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

    @Autowired
    private PhysioRepository physioRepository;

    @PostMapping("/generate-routine")
    public ResponseEntity<Routine> generateRoutine(@RequestBody AiRoutineRequest request) {
        // Include day and date for variety
        String todayDate = LocalDate.now().toString();
        String dayOfWeek = LocalDate.now().getDayOfWeek().name();
        
        String prompt = String.format(
            "Hoy es %s (%s). Genera una rutina de entrenamiento variada para un usuario con: " +
            "Objetivo: '%s', Nivel: '%s', Edad: %d años, Peso: %.1f kg, Estatura: %.1f cm. " +
            "Días de entrenamiento por semana: %d. " +
            "Equipo disponible: %s. " +
            "IMPORTANTE: " +
            "1. Responde los nombres de los ejercicios SIEMPRE en ESPAÑOL. " +
            "2. Varía los ejercicios según el día de la semana y la frecuencia de %d días para evitar repeticiones y sobreentrenamiento. " +
            "Responde ÚNICAMENTE con un objeto JSON válido que tenga esta estructura exacta: " +
            "{ \"exercises\": [ { \"name\": \"Nombre del Ejercicio\", \"sets\": 3, \"reps\": \"12\", \"weight\": 0.0 } ] }. " +
            "Adapta el volumen e intensidad a los datos físicos y la frecuencia de entrenamiento.",
            dayOfWeek, todayDate,
            request.getGoal(), request.getLevel(), 
            request.getAge() != null ? request.getAge() : 30,
            request.getWeight() != null ? request.getWeight() : 70.0,
            request.getHeight() != null ? request.getHeight() : 170.0,
            request.getTrainingDays() != null ? request.getTrainingDays() : 3,
            String.join(", ", request.getEquipment()),
            request.getTrainingDays() != null ? request.getTrainingDays() : 3
        );

        System.out.println("Generating Routine for: " + request.getEmail());
        System.out.println("Prompt Sent: " + prompt);
        
        String aiResponse = geminiService.getResponse(prompt, "CONTEXTO: Generación de rutina estructurada JSON para CoachPRO. NO USAR MARKDOWN, SOLO JSON.");
        System.out.println("AI Raw Response: " + aiResponse);

        // Clean JSON from potential markdown blocks
        String cleanJson = aiResponse.replaceAll("```json", "").replaceAll("```", "").trim();
        
        // Always create a new routine record to preserve history if used multiple times a day
        String today = LocalDate.now().toString();
        Routine routine = new Routine();
        routine.setStudentEmail(request.getEmail());
        routine.setDate(today);
        routine.setCreatedAt(LocalDateTime.now().toString());
        
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
                System.err.println("Error saving physio entry: " + e.getMessage());
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
            System.err.println("Error parsing AI JSON: " + e.getMessage());
            // Fallback content if AI fails to provide JSON
            items.add(new RoutineItem(UUID.randomUUID().toString(), "Caminata de Calentamiento (Fallback)", 1, 15, 0.0, false));
            items.add(new RoutineItem(UUID.randomUUID().toString(), "Sentadillas (Peso Corporal) (Fallback)", 3, 12, 0.0, false));
            items.add(new RoutineItem(UUID.randomUUID().toString(), "Flexiones o Push-ups (Fallback)", 3, 10, 0.0, false));
        }

        if (items.isEmpty()) {
            items.add(new RoutineItem(UUID.randomUUID().toString(), "Estiramiento Dinámico (Fallback)", 1, 10, 0.0, false));
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
        private Integer trainingDays;

        public Integer getTrainingDays() {
            return trainingDays;
        }

        public void setTrainingDays(Integer trainingDays) {
            this.trainingDays = trainingDays;
        }
    }
}
