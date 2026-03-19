package cl.maxi.gympro.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "physio")
@CompoundIndex(name = "student_date_idx", def = "{'studentEmail': 1, 'date': 1}")
public class PhysioEntry {

    @Id
    private String id;

    private String studentEmail;
    private String date; // YYYY-MM-DD

    private Double weight; // kg
    private Double igc; // % Body Fat
    private String measuredBy; // "coach" or "student"
}
