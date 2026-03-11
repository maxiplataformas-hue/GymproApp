package cl.maxi.gympro.repository;

import cl.maxi.gympro.model.StudentProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.Sort;
import java.util.List;

public interface StudentProfileRepository extends MongoRepository<StudentProfile, String> {
    List<StudentProfile> findByStudentEmailIgnoreCase(String studentEmail, Sort sort);
    List<StudentProfile> findByStudentEmail(String studentEmail, Sort sort);
}
