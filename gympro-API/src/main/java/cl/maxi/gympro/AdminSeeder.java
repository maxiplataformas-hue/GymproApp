package cl.maxi.gympro;

import cl.maxi.gympro.model.User;
import cl.maxi.gympro.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Optional;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoutineRepository routineRepository;
    private final PhysioRepository physioRepository;
    private final PhotoRepository photoRepository;
    private final StudentProfileRepository studentProfileRepository;

    public AdminSeeder(
            UserRepository userRepository,
            RoutineRepository routineRepository,
            PhysioRepository physioRepository,
            PhotoRepository photoRepository,
            StudentProfileRepository studentProfileRepository) {
        this.userRepository = userRepository;
        this.routineRepository = routineRepository;
        this.physioRepository = physioRepository;
        this.photoRepository = photoRepository;
        this.studentProfileRepository = studentProfileRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. LIMPIEZA DE DATOS DE ALUMNOS (Solicitado por el usuario)
        System.out.println("Starting student data cleanup...");

        // Buscamos todos los alumnos antes de borrarlos para tener sus emails si fuera
        // necesario,
        // pero en este caso simplemente limpiaremos las colecciones completas
        // relacionadas con alumnos.

        routineRepository.deleteAll();
        System.out.println("All routines deleted.");

        physioRepository.deleteAll();
        System.out.println("All physiological entries deleted.");

        photoRepository.deleteAll();
        System.out.println("All student photos deleted.");

        studentProfileRepository.deleteAll();
        System.out.println("All student profiles (evaluations) deleted.");

        // Borramos a los usuarios con rol "student"
        List<User> students = userRepository.findAll().stream()
                .filter(u -> "student".equals(u.getRole()))
                .collect(Collectors.toList());

        userRepository.deleteAll(students);
        System.out.println(students.size() + " student accounts deleted.");

        // 2. CONFIGURACIÓN DE ADMIN
        String adminEmail = "maxiplataformas@gmail.com";
        Optional<User> existingUser = userRepository.findByEmail(adminEmail);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            user.setRole("admin");
            user.setIsActive(true);
            user.setIsDeleted(false);
            userRepository.save(user);
            System.out.println("User " + adminEmail + " updated to admin.");
        } else {
            User admin = new User();
            admin.setEmail(adminEmail);
            admin.setName("Administrador");
            admin.setRole("admin");
            admin.setIsActive(true);
            admin.setIsDeleted(false);
            admin.setIsOnboarded(true);
            userRepository.save(admin);
            System.out.println("User " + adminEmail + " created as admin.");
        }

        System.out.println("Cleanup and seeding finished successfully.");
    }
}
