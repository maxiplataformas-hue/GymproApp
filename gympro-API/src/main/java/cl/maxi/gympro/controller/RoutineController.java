package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.Notification;
import cl.maxi.gympro.model.Routine;
import cl.maxi.gympro.model.RoutineItem;
import cl.maxi.gympro.repository.NotificationRepository;
import cl.maxi.gympro.repository.RoutineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routines")
@CrossOrigin(origins = "*")
public class RoutineController {

    @Autowired
    private RoutineRepository routineRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/{studentEmail}")
    public List<Routine> getRoutinesByStudent(@PathVariable String studentEmail) {
        return routineRepository.findByStudentEmailIgnoreCase(studentEmail);
    }

    @GetMapping("/{studentEmail}/{date}")
    public List<Routine> getRoutinesByDate(@PathVariable String studentEmail, @PathVariable String date) {
        return routineRepository.findByStudentEmailIgnoreCaseAndDate(studentEmail, date);
    }

    @PostMapping
    public Routine saveRoutine(@RequestBody Routine routine) {
        // Normalize student email
        if (routine.getStudentEmail() != null) {
            routine.setStudentEmail(routine.getStudentEmail().trim().toLowerCase());
        }
        
        // Human coaches usually update a single routine for the day
        List<Routine> existing = routineRepository.findByStudentEmailIgnoreCaseAndDate(routine.getStudentEmail(),
                routine.getDate());

        if (!existing.isEmpty()) {
            // Update the first one found (standard behavior for human coaches)
            Routine toUpdate = existing.get(0);
            toUpdate.setItems(routine.getItems());
            Routine saved = routineRepository.save(toUpdate);
            createRoutineNotification(saved);
            return saved;
        } else {
            Routine saved = routineRepository.save(routine);
            createRoutineNotification(saved);
            return saved;
        }
    }

    private void createRoutineNotification(Routine routine) {
        String msg = "Tu coach te ha asignado una rutina para el " + routine.getDate();
        Notification notif = new Notification(
                routine.getStudentEmail(),
                "", // Podemos dejarlo vacío o buscar el coachEmail en el futuro
                msg,
                "ROUTINE_ASSIGNED");
        notificationRepository.save(notif);
    }

    @DeleteMapping("/{studentEmail}/{date}/{itemId}")
    public ResponseEntity<Routine> deleteRoutineItem(
            @PathVariable String studentEmail,
            @PathVariable String date,
            @PathVariable String itemId) {

        List<Routine> existing = routineRepository.findByStudentEmailIgnoreCaseAndDate(studentEmail, date);

        for (Routine routine : existing) {
            List<RoutineItem> items = routine.getItems();
            boolean removed = items.removeIf(item -> item.getId().equals(itemId));

            if (removed) {
                if (items.isEmpty()) {
                    routineRepository.delete(routine);
                    return ResponseEntity.ok().build();
                } else {
                    routine.setItems(items);
                    return ResponseEntity.ok(routineRepository.save(routine));
                }
            }
        }
        return ResponseEntity.notFound().build();
    }
}
