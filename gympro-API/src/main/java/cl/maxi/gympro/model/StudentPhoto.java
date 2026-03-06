package cl.maxi.gympro.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "photos")
public class StudentPhoto {
    @Id
    private String id;
    private String studentEmail;
    private String uploaderEmail; // Who uploaded it (Coach or Student)
    private String date; // YYYY-MM-DD
    private String photoBase64; // The image data
}
