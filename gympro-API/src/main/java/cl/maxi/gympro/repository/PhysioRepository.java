package cl.maxi.gympro.repository;

import cl.maxi.gympro.model.PhysioEntry;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PhysioRepository extends MongoRepository<PhysioEntry, String> {
    List<PhysioEntry> findByStudentEmail(String studentEmail);
}
