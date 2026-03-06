package cl.maxi.gympro.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "routines")
public class Routine {
    
    @Id
    private String id;
    
    private String studentEmail;
    private String date; // YYYY-MM-DD
    
    private List<RoutineItem> items;
}
