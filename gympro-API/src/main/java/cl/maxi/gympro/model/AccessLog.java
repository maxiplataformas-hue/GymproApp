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
@Document(collection = "access_logs")
public class AccessLog {
    @Id
    private String id;
    
    // El correo del usuario que inició sesión
    private String email;
    
    // "coach" o "student"
    private String role;
    
    // La fecha y hora exacta del acceso
    private LocalDateTime timestamp;
}
