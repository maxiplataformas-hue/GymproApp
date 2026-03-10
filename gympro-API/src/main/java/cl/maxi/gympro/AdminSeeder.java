package cl.maxi.gympro;

import cl.maxi.gympro.model.User;
import cl.maxi.gympro.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;

    public AdminSeeder(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. CONFIGURACIÓN DE ADMIN
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
