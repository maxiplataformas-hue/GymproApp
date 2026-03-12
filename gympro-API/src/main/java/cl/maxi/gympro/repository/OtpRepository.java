package cl.maxi.gympro.repository;

import cl.maxi.gympro.model.OtpEntry;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface OtpRepository extends MongoRepository<OtpEntry, String> {
    Optional<OtpEntry> findByEmail(String email);
    void deleteByEmail(String email);
}
