package cl.maxi.gympro;

import cl.maxi.gympro.model.User;
import cl.maxi.gympro.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    
    @Value("${app.admin.email}")
    private String adminEmail;

    public AdminSeeder(UserRepository userRepository) {
        this.userRepository = userRepository;
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

        System.out.println("Cleanup and seeding finished successfully.");
    }
}
