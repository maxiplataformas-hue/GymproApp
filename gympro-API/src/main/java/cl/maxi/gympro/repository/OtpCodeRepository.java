package cl.maxi.gympro.repository;

import cl.maxi.gympro.model.OtpCode;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface OtpCodeRepository extends MongoRepository<OtpCode, String> {
    Optional<OtpCode> findTopByEmailAndUsedFalseOrderByExpiresAtDesc(String email);

    void deleteByEmail(String email);
}
