package cl.maxi.gympro.repository;

import cl.maxi.gympro.model.StudentProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface StudentProfileRepository extends MongoRepository<StudentProfile, String> {
    Optional<StudentProfile> findByStudentEmail(String studentEmail);
}
