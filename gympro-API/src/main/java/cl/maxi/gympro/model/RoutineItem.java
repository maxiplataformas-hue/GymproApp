package cl.maxi.gympro.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoutineItem {
    private String id;
    private String exerciseId;
    private Integer sets;
    private Integer reps;
    private Double weight;
    private Boolean completed;
}
