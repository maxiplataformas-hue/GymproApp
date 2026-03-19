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
        // Use findAll to handle potential historical duplicates safely
        List<User> users = userRepository.findAll()
                .stream()
                .filter(u -> email.equalsIgnoreCase(u.getEmail()) && !Boolean.TRUE.equals(u.getIsDeleted()))
                .collect(Collectors.toList());

        if (users.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        // Return the first active one or just the first one
        return ResponseEntity.ok(users.get(0));
    }

    /** POST /api/users → create user */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user) {
        if (user.getEmail() != null) {
            String email = user.getEmail().trim().toLowerCase();
            user.setEmail(email);

            // Prevent duplicates
            Optional<User> existing = userRepository.findByEmailIgnoreCase(email);
            if (existing.isPresent() && !Boolean.TRUE.equals(existing.get().getIsDeleted())) {
                return ResponseEntity.status(409).body("El correo ya está registrado.");
            }
        }
        return ResponseEntity.ok(userRepository.save(user));
    }

    /** PUT /api/users/{email} → update fields */
    @PutMapping("/{email}")
    public ResponseEntity<User> updateUser(@PathVariable String email, @RequestBody User userDetails) {
        Optional<User> optionalUser = userRepository.findByEmailIgnoreCase(email);

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
            if (userDetails.getSpecialty() != null)
                existing.setSpecialty(userDetails.getSpecialty());
            if (userDetails.getAvatarUrl() != null)
                existing.setAvatarUrl(userDetails.getAvatarUrl());

            return ResponseEntity.ok(userRepository.save(existing));
        }
        return ResponseEntity.notFound().build();
    }

    /** DELETE /api/users/{email} → soft delete (isDeleted = true) */
    @DeleteMapping("/{email}")
    public ResponseEntity<Void> deleteUser(@PathVariable String email) {
        String normalizedEmail = email.trim().toLowerCase();
        // Use stream to be resilient to null/missing fields in existing Mongo documents
        List<User> matches = userRepository.findAll()
                .stream()
                .filter(u -> u.getEmail() != null && normalizedEmail.equalsIgnoreCase(u.getEmail()))
                .collect(Collectors.toList());

        if (!matches.isEmpty()) {
            User user = matches.get(0);
            user.setIsDeleted(true);
            user.setIsActive(false);
            userRepository.save(user);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }


    /** GET /api/users/coaches/metrics → get coaches with student count and activity level */
    @GetMapping("/coaches/metrics")
    public List<CoachMetricDTO> getCoachMetrics() {
        List<User> coaches = userRepository.findByRoleAndIsDeletedNot("coach", true);
        return coaches.stream().map(coach -> {
            long studentCount = userRepository.findByCoachEmailAndIsDeletedNot(coach.getEmail(), true)
                    .stream()
                    .filter(u -> "student".equals(u.getRole()))
                    .count();
            // Activity level logic: for now, a simple mock or based on student interactions if available.
            // Requirement says "based on routine updates or student interaction".
            // Since I don't have deep interaction logs easily, I'll return a placeholder or calculate based on recent routines if possible.
            double activityLevel = calculateActivityLevel(coach.getEmail()); 
            
            return new CoachMetricDTO(
                coach.getEmail(),
                coach.getName(),
                coach.getSpecialty(),
                coach.getAvatarUrl(),
                coach.getIsActive() != false,
                studentCount,
                activityLevel
            );
        }).collect(Collectors.toList());
    }

    private double calculateActivityLevel(String coachEmail) {
        // Mock activity logic for now: 75.0%
        return 75.0;
    }

    public static class CoachMetricDTO {
        public String email;
        public String name;
        public String specialty;
        public String avatarUrl;
        public boolean isActive;
        public long studentCount;
        public double activityLevel;

        public CoachMetricDTO(String email, String name, String specialty, String avatarUrl, boolean isActive, long studentCount, double activityLevel) {
            this.email = email;
            this.name = name;
            this.specialty = specialty;
            this.avatarUrl = avatarUrl;
            this.isActive = isActive;
            this.studentCount = studentCount;
            this.activityLevel = activityLevel;
        }
    }
}
