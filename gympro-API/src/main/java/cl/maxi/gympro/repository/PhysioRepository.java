package cl.maxi.gympro.repository;

import cl.maxi.gympro.model.PhysioEntry;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PhysioRepository extends MongoRepository<PhysioEntry, String> {
    // Índice compuesto en @Document de PhysioEntry (studentEmail + date)
    List<PhysioEntry> findByStudentEmailIgnoreCaseOrderByDateAsc(String studentEmail);
    List<PhysioEntry> findByStudentEmailIgnoreCase(String studentEmail);
    List<PhysioEntry> findByStudentEmail(String studentEmail);
}
