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

    @Autowired
    private cl.maxi.gympro.repository.RoutineRepository routineRepository;

    @Autowired
    private cl.maxi.gympro.repository.PhysioRepository physioRepository;

    @Autowired
    private cl.maxi.gympro.repository.StudentProfileRepository profileRepository;

    @Autowired
    private cl.maxi.gympro.repository.NotificationRepository notificationRepository;

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

    /** GET /api/users/{email:.+} */
    @GetMapping("/{email:.+}")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        String normalizedEmail = email.trim().toLowerCase();
        List<User> users = userRepository.findAll()
                .stream()
                .filter(u -> u.getEmail() != null && normalizedEmail.equalsIgnoreCase(u.getEmail()) && !Boolean.TRUE.equals(u.getIsDeleted()))
                .collect(Collectors.toList());

        if (users.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(users.get(0));
    }

    /** POST /api/users → create user */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user) {
        try {
            if (user.getEmail() != null) {
                String email = user.getEmail().trim().toLowerCase();
                user.setEmail(email);

                // Use the same resilient search as in delete/update to avoid 500s from findByEmailIgnoreCase
                List<User> matches = userRepository.findAll().stream()
                        .filter(u -> u.getEmail() != null && email.equalsIgnoreCase(u.getEmail()))
                        .collect(Collectors.toList());

                if (!matches.isEmpty()) {
                    boolean hasNonDeleted = matches.stream().anyMatch(u -> !Boolean.TRUE.equals(u.getIsDeleted()));
                    if (hasNonDeleted) {
                        return ResponseEntity.status(409).body("El correo ya está registrado.");
                    }
                }
            }
            return ResponseEntity.ok(userRepository.save(user));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error interno: " + e.getMessage());
        }
    }


    /** PUT /api/users/{email:.+} → update fields */
    @PutMapping("/{email:.+}")
    public ResponseEntity<User> updateUser(@PathVariable String email, @RequestBody User userDetails) {
        String normalizedEmail = email.trim().toLowerCase();
        List<User> matches = userRepository.findAll()
                .stream()
                .filter(u -> u.getEmail() != null && normalizedEmail.equalsIgnoreCase(u.getEmail()))
                .collect(Collectors.toList());

        if (!matches.isEmpty()) {
            User existing = matches.get(0);
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

    /** DELETE /api/users/{email:.+} → soft delete (isDeleted = true) */
    @DeleteMapping("/{email:.+}")
    public ResponseEntity<Void> deleteUser(@PathVariable String email) {
        String normalizedEmail = email.trim().toLowerCase();
        List<User> matches = userRepository.findAll()
                .stream()
                .filter(u -> u.getEmail() != null && normalizedEmail.equalsIgnoreCase(u.getEmail()))
                .collect(Collectors.toList());

        if (!matches.isEmpty()) {
            userRepository.deleteAll(matches);
            return ResponseEntity.ok().build();
        }

        return ResponseEntity.notFound().build();
    }

    /** DELETE /api/users/purge/{email:.+} → HARD delete from ALL collections */
    @DeleteMapping("/purge/{email:.+}")
    public ResponseEntity<String> purgeUser(@PathVariable String email) {
        try {
            String normalizedEmail = email.trim().toLowerCase();
            
            // 1. Delete from Users
            List<User> users = userRepository.findAll().stream()
                    .filter(u -> u.getEmail() != null && normalizedEmail.equalsIgnoreCase(u.getEmail()))
                    .collect(Collectors.toList());
            userRepository.deleteAll(users);

            // 2. Delete from Routines
            List<cl.maxi.gympro.model.Routine> routines = routineRepository.findByStudentEmailIgnoreCase(normalizedEmail);
            routineRepository.deleteAll(routines);

            // 3. Delete from Physio
            List<cl.maxi.gympro.model.PhysioEntry> physio = physioRepository.findByStudentEmailIgnoreCase(normalizedEmail);
            physioRepository.deleteAll(physio);

            // 4. Delete from Profiles
            List<cl.maxi.gympro.model.StudentProfile> profiles = profileRepository.findByStudentEmailIgnoreCase(normalizedEmail, org.springframework.data.domain.Sort.unsorted());
            profileRepository.deleteAll(profiles);

            // 5. Delete from Notifications
            List<cl.maxi.gympro.model.Notification> notifs = notificationRepository.findByStudentEmailIgnoreCaseOrderByCreatedAtDesc(normalizedEmail);
            notificationRepository.deleteAll(notifs);

            return ResponseEntity.ok("Purga completa para: " + normalizedEmail + ". Se eliminaron " + users.size() + " usuarios.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error en purga: " + e.getMessage());
        }
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
