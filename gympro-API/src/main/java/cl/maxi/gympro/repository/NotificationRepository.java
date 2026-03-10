package cl.maxi.gympro.repository;

import cl.maxi.gympro.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByStudentEmailOrderByCreatedAtDesc(String studentEmail);

    long countByStudentEmailAndIsReadFalse(String studentEmail);
}
