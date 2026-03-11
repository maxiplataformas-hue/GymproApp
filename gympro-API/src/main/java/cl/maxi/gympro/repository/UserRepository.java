package cl.maxi.gympro.repository;

import cl.maxi.gympro.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByEmail(String email);

    List<User> findByRole(String role);

    List<User> findByCoachEmail(String coachEmail);

    List<User> findByCoachEmailAndIsDeletedNot(String coachEmail, Boolean isDeleted);

    List<User> findByRoleAndIsDeletedNot(String role, Boolean isDeleted);
}
