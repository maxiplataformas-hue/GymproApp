package cl.maxi.gympro;

import cl.maxi.gympro.model.Exercise;
import cl.maxi.gympro.model.User;
import cl.maxi.gympro.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class AdminSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final ExerciseRepository exerciseRepository;
    
    @Value("${app.admin.email}")
    private String adminEmail;

    public AdminSeeder(UserRepository userRepository, ExerciseRepository exerciseRepository) {
        this.userRepository = userRepository;
        this.exerciseRepository = exerciseRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. CONFIGURACIÓN DE ADMIN DINÁMICO
        if (adminEmail == null || adminEmail.isBlank()) {
            System.err.println("No admin email configured. Skipping seeder.");
            return;
        }

        String normalizedAdminEmail = adminEmail.trim().toLowerCase();
        Optional<User> existingUser = userRepository.findByEmailIgnoreCase(normalizedAdminEmail);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // Solo lo forzamos a admin si no lo es, para evitar sobreescribir otros cambios si el seeder corre siempre
            if (!"admin".equals(user.getRole())) {
                user.setRole("admin");
                user.setIsActive(true);
                user.setIsDeleted(false);
                userRepository.save(user);
                System.out.println("User " + normalizedAdminEmail + " updated to admin.");
            }
        } else {
            User admin = new User();
            admin.setEmail(normalizedAdminEmail);
            admin.setName("Administrador Raíz");
            admin.setRole("admin");
            admin.setIsActive(true);
            admin.setIsDeleted(false);
            admin.setIsOnboarded(true);
            userRepository.save(admin);
            System.out.println("User " + normalizedAdminEmail + " created as root admin.");
        }

        // 2. SEEDING DE EJERCICIOS (Si está vacío)
        if (exerciseRepository.count() == 0) {
            seedInitialExercises();
            System.out.println("Initial exercises seeded.");
        }

        System.out.println("Cleanup and seeding finished successfully.");
    }

    private void seedInitialExercises() {
        // Migración de los ejercicios hardcodeados en el frontend original
        String[][] data = {
            {"Press de Banca Plano", "Pecho", "Barra", "Gimnasio"},
            {"Press de Banca Inclinado", "Pecho", "Barra", "Gimnasio"},
            {"Flexiones (Push-ups)", "Pecho", "Libre", "Calistenia"},
            {"Peso Muerto Convencional", "Espalda", "Barra", "Gimnasio"},
            {"Dominadas Prontas (Pull-ups)", "Espalda", "Libre", "Calistenia"},
            {"Sentadilla Libre (Back Squat)", "Pierna", "Barra", "Gimnasio"},
            {"Zancadas con Mancuernas", "Pierna", "Mancuerna", "Gimnasio"},
            {"Press Militar de Pie", "Hombro", "Barra", "Gimnasio"},
            {"Elevaciones Laterales", "Hombro", "Mancuerna", "Gimnasio"},
            {"Curl con Barra Recta", "Brazo", "Barra", "Gimnasio"},
            {"Plancha (Plank)", "Core", "Libre", "Fitness"}
        };

        for (String[] row : data) {
            Exercise ex = new Exercise();
            ex.setName(row[0]);
            ex.setMuscleGroup(row[1]);
            ex.setEquipment(row[2]);
            ex.setCategory(row[3]);
            exerciseRepository.save(ex);
        }
    }
}
