package cl.maxi.gympro.repository;

import cl.maxi.gympro.model.Exercise;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExerciseRepository extends MongoRepository<Exercise, String> {
    boolean existsByNameIgnoreCase(String name);
}
