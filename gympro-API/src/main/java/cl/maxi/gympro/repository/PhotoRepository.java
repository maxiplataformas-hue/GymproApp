package cl.maxi.gympro.repository;

import cl.maxi.gympro.model.StudentPhoto;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PhotoRepository extends MongoRepository<StudentPhoto, String> {
    List<StudentPhoto> findByStudentEmailOrderByDateDesc(String studentEmail);
}
