package cl.maxi.gympro.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;
    private String studentEmail;
    private String coachEmail;
    private String message;
    private String type; // e.g., "ROUTINE_ASSIGNED"
    private LocalDateTime createdAt;
    private Boolean isRead;

    public Notification(String studentEmail, String coachEmail, String message, String type) {
        this.studentEmail = studentEmail;
        this.coachEmail = coachEmail;
        this.message = message;
        this.type = type;
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
    }
}
