package cl.maxi.gympro.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String email;
    private String name;
    private String nickname;
    private String role; // "admin", "coach" o "student"

    private Integer age;
    private Double height; // cm
    private Double initialWeight; // kg
    private Boolean isOnboarded;
    private Boolean isActive; // null/true = active, false = disabled
    private Boolean isDeleted; // soft delete flag
    private String theme; // "light", "dark", or "pink"
    private String coachEmail; // email del coach al que pertenece el alumno
    private String password;
}
