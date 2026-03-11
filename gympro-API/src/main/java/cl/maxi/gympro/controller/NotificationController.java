package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.Notification;
import cl.maxi.gympro.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/{studentEmail}")
    public List<Notification> getNotifications(@PathVariable String studentEmail) {
        return notificationRepository.findByStudentEmailIgnoreCaseOrderByCreatedAtDesc(studentEmail);
    }

    @GetMapping("/{studentEmail}/unread-count")
    public long getUnreadCount(@PathVariable String studentEmail) {
        return notificationRepository.countByStudentEmailIgnoreCaseAndIsReadFalse(studentEmail);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable String id) {
        return notificationRepository.findById(id)
                .map(notif -> {
                    notif.setIsRead(true);
                    return ResponseEntity.ok(notificationRepository.save(notif));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/read-all/{studentEmail}")
    public ResponseEntity<Void> markAllAsRead(@PathVariable String studentEmail) {
        List<Notification> unread = notificationRepository.findByStudentEmailIgnoreCaseOrderByCreatedAtDesc(studentEmail);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok().build();
    }
}
