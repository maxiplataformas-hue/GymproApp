package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.User;
import cl.maxi.gympro.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    /**
     * GET /api/users?coachEmail=xxx → students of that coach (not deleted)
     * GET /api/users → all non-deleted users (admin use)
     */
    @GetMapping
    public List<User> getUsers(@RequestParam(required = false) String coachEmail) {
        if (coachEmail != null && !coachEmail.isBlank()) {
            return userRepository.findByCoachEmailAndIsDeletedNot(coachEmail, true)
                    .stream()
                    .filter(u -> "student".equals(u.getRole()) && Boolean.TRUE.equals(u.getIsOnboarded()))
                    .collect(Collectors.toList());
        }
        // Admin: return all non-deleted users
        return userRepository.findAll()
                .stream()
                .filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()))
                .collect(Collectors.toList());
    }

    /** GET /api/users/coaches → all active coach accounts */
    @GetMapping("/coaches")
    public List<User> getCoaches() {
        return userRepository.findByRoleAndIsDeletedNot("coach", true);
    }

    /** GET /api/users/{email} */
    @GetMapping("/{email}")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        Optional<User> user = userRepository.findByEmail(email);
        return user.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** POST /api/users → create user */
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }

    /** PUT /api/users/{email} → update fields */
    @PutMapping("/{email}")
    public ResponseEntity<User> updateUser(@PathVariable String email, @RequestBody User userDetails) {
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isPresent()) {
            User existing = optionalUser.get();
            if (userDetails.getName() != null)
                existing.setName(userDetails.getName());
            if (userDetails.getNickname() != null)
                existing.setNickname(userDetails.getNickname());
            if (userDetails.getAge() != null)
                existing.setAge(userDetails.getAge());
            if (userDetails.getHeight() != null)
                existing.setHeight(userDetails.getHeight());
            if (userDetails.getInitialWeight() != null)
                existing.setInitialWeight(userDetails.getInitialWeight());
            if (userDetails.getIsOnboarded() != null)
                existing.setIsOnboarded(userDetails.getIsOnboarded());
            if (userDetails.getIsActive() != null)
                existing.setIsActive(userDetails.getIsActive());
            if (userDetails.getTheme() != null)
                existing.setTheme(userDetails.getTheme());
            if (userDetails.getCoachEmail() != null)
                existing.setCoachEmail(userDetails.getCoachEmail());
            if (userDetails.getRole() != null)
                existing.setRole(userDetails.getRole());

            return ResponseEntity.ok(userRepository.save(existing));
        }
        return ResponseEntity.notFound().build();
    }

    /** DELETE /api/users/{email} → soft delete (isDeleted = true) */
    @DeleteMapping("/{email}")
    public ResponseEntity<Void> deleteUser(@PathVariable String email) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            user.setIsDeleted(true);
            user.setIsActive(false);
            userRepository.save(user);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
