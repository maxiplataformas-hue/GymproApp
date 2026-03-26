package cl.maxi.gympro.repository;

import cl.maxi.gympro.model.DictionaryConcept;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DictionaryRepository extends MongoRepository<DictionaryConcept, String> {
    List<DictionaryConcept> findByCoachEmail(String coachEmail);
}
