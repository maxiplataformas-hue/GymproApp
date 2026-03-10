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
import java.util.Optional;

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
        Optional<Routine> existing = routineRepository.findByStudentEmailAndDate(routine.getStudentEmail(),
                routine.getDate());

        if (existing.isPresent()) {
            Routine toUpdate = existing.get();
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

        Optional<Routine> existing = routineRepository.findByStudentEmailAndDate(studentEmail, date);

        if (existing.isPresent()) {
            Routine routine = existing.get();
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
