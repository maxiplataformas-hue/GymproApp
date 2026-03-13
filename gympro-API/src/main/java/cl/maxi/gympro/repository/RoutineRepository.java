package cl.maxi.gympro.repository;

import cl.maxi.gympro.model.Routine;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoutineRepository extends MongoRepository<Routine, String> {
    List<Routine> findByStudentEmailIgnoreCase(String studentEmail);
    List<Routine> findByStudentEmail(String studentEmail);

    List<Routine> findByStudentEmailIgnoreCaseAndDate(String studentEmail, String date);
    List<Routine> findByStudentEmailAndDate(String studentEmail, String date);
    
    List<Routine> findTop5ByStudentEmailIgnoreCaseOrderByCreatedAtDesc(String studentEmail);
}
