package cl.maxi.gympro.repository;

import cl.maxi.gympro.model.Routine;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoutineRepository extends MongoRepository<Routine, String> {
    List<Routine> findByStudentEmailIgnoreCase(String studentEmail);
    List<Routine> findByStudentEmail(String studentEmail);

    Optional<Routine> findByStudentEmailIgnoreCaseAndDate(String studentEmail, String date);
    Optional<Routine> findByStudentEmailAndDate(String studentEmail, String date);
}
