package cl.maxi.gympro.controller;

import cl.maxi.gympro.service.GeminiService;
import cl.maxi.gympro.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoutineRepository routineRepository;

    @Autowired
    private PhysioRepository physioRepository;

    @Autowired
    private StudentProfileRepository profileRepository;

    @PostMapping
    public Map<String, String> chat(@RequestBody Map<String, String> request) {
        String userMessage = request.get("message");
        String userEmail = request.get("email");

        String context = "";
        if (userEmail != null && !userEmail.isEmpty()) {
            context = buildStudentContext(userEmail);
        }

        String aiResponse = geminiService.getResponse(userMessage, context);
        return Map.of("response", aiResponse);
    }

    private String buildStudentContext(String email) {
        StringBuilder context = new StringBuilder("DATOS DEL ALUMNO ACTUAL:\n");

        // 1. Datos personales
        userRepository.findByEmail(email).ifPresent(u -> {
            context.append("- Nombre: ").append(u.getName()).append("\n");
            if (u.getNickname() != null)
                context.append("- Apodo: ").append(u.getNickname()).append("\n");
            context.append("- Edad: ").append(u.getAge()).append("\n");
            context.append("- Altura: ").append(u.getHeight()).append(" cm\n");
            context.append("- Peso Inicial: ").append(u.getInitialWeight()).append(" kg\n");
        });

        // 2. Medidas más recientes
        physioRepository.findByStudentEmail(email).stream()
                .max((a, b) -> a.getDate().compareTo(b.getDate()))
                .ifPresent(p -> {
                    context.append("- Peso Actual (último registro): ").append(p.getWeight()).append(" kg (Fecha: ")
                            .append(p.getDate()).append(")\n");
                    if (p.getIgc() != null)
                        context.append("- IGC: ").append(p.getIgc()).append("%\n");
                });

        // 3. Evalución Clínica/Objetivos
        profileRepository
                .findByStudentEmail(email,
                        org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC,
                                "recordDate"))
                .stream()
                .findFirst()
                .ifPresent(pr -> {
                    context.append("- Objetivo: ").append(pr.getObjective()).append("\n");
                    context.append("- Biotipo: ").append(pr.getBiotype()).append("\n");
                    if (pr.getDietPlan() != null)
                        context.append("- Dieta: ").append(pr.getDietPlan()).append("\n");
                });

        // 4. Rutinas (Hoy)
        String today = java.time.LocalDate.now().toString();
        List<cl.maxi.gympro.model.Routine> dailyRoutines = routineRepository.findByStudentEmailAndDate(email, today);
        if (!dailyRoutines.isEmpty()) {
            context.append("- Rutinas para hoy (").append(today).append("):\n");
            for (cl.maxi.gympro.model.Routine r : dailyRoutines) {
                String timeStr = r.getCreatedAt() != null ? " [Generada: " + r.getCreatedAt() + "]" : "";
                context.append("  * Sesión").append(timeStr).append(":\n");
                r.getItems().forEach(item -> {
                    context.append("    - ").append(item.getExerciseId())
                            .append(", Series: ").append(item.getSets())
                            .append(", Reps: ").append(item.getReps())
                            .append(", Peso: ").append(item.getWeight()).append("kg\n");
                });
            }
        }

        return context.toString();
    }
}
