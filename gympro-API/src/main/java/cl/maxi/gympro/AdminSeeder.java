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

        // 2. SEEDING DE EJERCICIOS (Se añaden si no existen por nombre)
        seedExercises();
        System.out.println("Exercise seeding finished successfully.");
    }

    private void seedExercises() {
        // Format: { name, muscleGroup, equipment, category }
        String[][] exercises = {
            // ─────────────────────────────────────────────────
            // GIMNASIO
            // ─────────────────────────────────────────────────
            {"Press de Banca Plano", "Pecho", "Barra", "Gimnasio"},
            {"Press de Banca Inclinado", "Pecho", "Barra", "Gimnasio"},
            {"Press de Banca Declinado", "Pecho", "Barra", "Gimnasio"},
            {"Press con Mancuernas Plano", "Pecho", "Mancuerna", "Gimnasio"},
            {"Aperturas con Mancuernas", "Pecho", "Mancuerna", "Gimnasio"},
            {"Máquina Peck Deck (Mariposa)", "Pecho", "Máquina", "Gimnasio"},
            {"Peso Muerto Convencional", "Espalda", "Barra", "Gimnasio"},
            {"Peso Muerto Rumano", "Espalda", "Barra", "Gimnasio"},
            {"Remo con Barra", "Espalda", "Barra", "Gimnasio"},
            {"Remo con Mancuerna (Un Brazo)", "Espalda", "Mancuerna", "Gimnasio"},
            {"Jalón al Pecho (Lat Pulldown)", "Espalda", "Polea", "Gimnasio"},
            {"Jalón con Agarre Neutro", "Espalda", "Polea", "Gimnasio"},
            {"Sentadilla Libre (Back Squat)", "Pierna", "Barra", "Gimnasio"},
            {"Sentadilla Frontal (Front Squat)", "Pierna", "Barra", "Gimnasio"},
            {"Prensa de Piernas", "Pierna", "Máquina", "Gimnasio"},
            {"Extensión de Cuádriceps en Máquina", "Pierna", "Máquina", "Gimnasio"},
            {"Curl de Bíceps Femoral en Máquina", "Pierna", "Máquina", "Gimnasio"},
            {"Zancadas con Mancuernas", "Pierna", "Mancuerna", "Gimnasio"},
            {"Elevación de Pantorrillas de Pie", "Pierna", "Máquina", "Gimnasio"},
            {"Hip Thrust con Barra", "Glúteo", "Barra", "Gimnasio"},
            {"Press Militar de Pie", "Hombro", "Barra", "Gimnasio"},
            {"Press Arnold", "Hombro", "Mancuerna", "Gimnasio"},
            {"Elevaciones Laterales", "Hombro", "Mancuerna", "Gimnasio"},
            {"Elevaciones Frontales", "Hombro", "Mancuerna", "Gimnasio"},
            {"Face Pull con Polea", "Hombro", "Polea", "Gimnasio"},
            {"Curl con Barra Recta", "Brazo", "Barra", "Gimnasio"},
            {"Curl con Mancuerna Alterno", "Brazo", "Mancuerna", "Gimnasio"},
            {"Curl Martillo (Hammer Curl)", "Brazo", "Mancuerna", "Gimnasio"},
            {"Tríceps en Polea (Pushdown)", "Brazo", "Polea", "Gimnasio"},
            {"Patada de Tríceps (Kickback)", "Brazo", "Mancuerna", "Gimnasio"},
            {"Rompecráneos (Skull Crusher)", "Brazo", "Barra", "Gimnasio"},
            {"Plancha (Plank)", "Core", "Libre", "Gimnasio"},
            {"Crunch Abdominal", "Core", "Libre", "Gimnasio"},
            {"Elevación de Piernas Tumbado", "Core", "Libre", "Gimnasio"},

            // ─────────────────────────────────────────────────
            // CALISTENIA
            // ─────────────────────────────────────────────────
            {"Flexiones (Push-ups)", "Pecho", "Libre", "Calistenia"},
            {"Flexiones Diamante", "Brazo", "Libre", "Calistenia"},
            {"Flexiones Arqueras (Archer Push-ups)", "Pecho", "Libre", "Calistenia"},
            {"Dominadas Prontas (Pull-ups)", "Espalda", "Barra fija", "Calistenia"},
            {"Dominadas Supinas (Chin-ups)", "Brazo", "Barra fija", "Calistenia"},
            {"Dominadas Neutras", "Espalda", "Barra fija", "Calistenia"},
            {"Fondos en Paralelas (Dips)", "Pecho", "Paralelas", "Calistenia"},
            {"Sentadilla con Peso Corporal", "Pierna", "Libre", "Calistenia"},
            {"Pistol Squat (Sentadilla a una pierna)", "Pierna", "Libre", "Calistenia"},
            {"Elevación de Cadera (Glute Bridge)", "Glúteo", "Libre", "Calistenia"},
            {"Fondos en Banco (Triceps Dips)", "Brazo", "Banco", "Calistenia"},
            {"Muscle-Up", "Todos", "Barra fija", "Calistenia"},
            {"L-Sit", "Core", "Paralelas", "Calistenia"},
            {"Plancha Lateral", "Core", "Libre", "Calistenia"},
            {"Dragon Flag", "Core", "Barra fija", "Calistenia"},
            {"Burpee", "Todos", "Libre", "Calistenia"},

            // ─────────────────────────────────────────────────
            // HIIT
            // ─────────────────────────────────────────────────
            {"Sprint en Cinta (Intervals)", "Todos", "Cinta", "HIIT"},
            {"Jumping Jacks", "Todos", "Libre", "HIIT"},
            {"Montañero (Mountain Climber)", "Core", "Libre", "HIIT"},
            {"Saltos al Cajón (Box Jump)", "Pierna", "Cajón", "HIIT"},
            {"Saltos de Tijera (Jump Lunge)", "Pierna", "Libre", "HIIT"},
            {"Burpee con Salto", "Todos", "Libre", "HIIT"},
            {"Skipping (Rodillas al Pecho)", "Pierna", "Libre", "HIIT"},
            {"Sentadilla con Salto (Jump Squat)", "Pierna", "Libre", "HIIT"},
            {"Patada de Glúteo (Butt Kicks)", "Pierna", "Libre", "HIIT"},
            {"High Knees con Cuerda (Jump Rope)", "Todos", "Cuerda", "HIIT"},
            {"Plank to Push-up", "Core", "Libre", "HIIT"},
            {"Bear Crawl", "Todos", "Libre", "HIIT"},
            {"Remo en Máquina (Intervals)", "Espalda", "Máquina", "HIIT"},
            {"Battle Ropes", "Todos", "Cuerdas", "HIIT"},
            {"Sled Push", "Todos", "Trineo", "HIIT"},

            // ─────────────────────────────────────────────────
            // CROSSFIT
            // ─────────────────────────────────────────────────
            {"Thruster (Barra)", "Todos", "Barra", "CrossFit"},
            {"Clean and Jerk", "Todos", "Barra", "CrossFit"},
            {"Snatch (Arranque)", "Todos", "Barra", "CrossFit"},
            {"Wall Ball Shots", "Todos", "Balón medicinal", "CrossFit"},
            {"Toes to Bar", "Core", "Barra", "CrossFit"},
            {"Kipping Pull-up", "Espalda", "Barra", "CrossFit"},
            {"Handstand Push-up", "Hombro", "Libre", "CrossFit"},
            {"Rope Climb", "Espalda", "Cuerda", "CrossFit"},
            {"Kettlebell Swing", "Glúteo", "Kettlebell", "CrossFit"},
            {"Kettlebell Snatch", "Todos", "Kettlebell", "CrossFit"},
            {"Double Unders (Comba doble)", "Todos", "Cuerda", "CrossFit"},
            {"Box Jump Over", "Pierna", "Cajón", "CrossFit"},
            {"Power Clean", "Todos", "Barra", "CrossFit"},
            {"Deadlift AMRAP", "Espalda", "Barra", "CrossFit"},
            {"Turkish Get-up", "Todos", "Kettlebell", "CrossFit"},

            // ─────────────────────────────────────────────────
            // RUNNING
            // ─────────────────────────────────────────────────
            {"Carrera Continua (Aeróbico)", "Todos", "Ninguno", "Running"},
            {"Fartlek", "Todos", "Ninguno", "Running"},
            {"Tempo Run (Umbral Anaeróbico)", "Todos", "Ninguno", "Running"},
            {"Series de 400m", "Pierna", "Ninguno", "Running"},
            {"Carrera en Colinas (Hill Repeats)", "Pierna", "Ninguno", "Running"},
            {"Long Run (Carrera Larga Fondo)", "Todos", "Ninguno", "Running"},
            {"Strides (Aceleraciones)", "Pierna", "Ninguno", "Running"},
            {"Carrera Descalzo (Trail)", "Pierna", "Ninguno", "Running"},
            {"Caminata Rápida (Power Walking)", "Todos", "Ninguno", "Running"},
            {"Trote Regenerativo", "Todos", "Ninguno", "Running"},
            {"Step-ups (Escalones)", "Pierna", "Cajón", "Running"},
            {"Zancadas Caminando (Walking Lunges)", "Pierna", "Libre", "Running"},

            // ─────────────────────────────────────────────────
            // CASA (Peso Corporal)
            // ─────────────────────────────────────────────────
            {"Flexiones de Pared", "Pecho", "Libre", "Casa"},
            {"Sentadilla con Silla", "Pierna", "Silla", "Casa"},
            {"Sentadilla Isométrica (Wall Sit)", "Pierna", "Libre", "Casa"},
            {"Elevación de Cadera en el Suelo", "Glúteo", "Libre", "Casa"},
            {"Patada Trasera de Glúteo (Donkey Kick)", "Glúteo", "Libre", "Casa"},
            {"Abducción de Cadera en el Suelo", "Glúteo", "Libre", "Casa"},
            {"Superman (Extensión de Espalda)", "Espalda", "Libre", "Casa"},
            {"Remo Invertido con Mesa", "Espalda", "Mesa / Barra baja", "Casa"},
            {"Plancha Abdominal", "Core", "Libre", "Casa"},
            {"Bicicleta Abdominal (Bicycle Crunch)", "Core", "Libre", "Casa"},
            {"Crunch con Piernas Elevadas", "Core", "Libre", "Casa"},
            {"Saltos en el Lugar", "Todos", "Libre", "Casa"},
            {"Tap de Hombros en Plancha", "Core", "Libre", "Casa"},
            {"Fondos entre Sillas", "Brazo", "Silla", "Casa"},
            {"Step-ups en Escalón de Casa", "Pierna", "Escalón", "Casa"},
        };

        int added = 0;
        for (String[] row : exercises) {
            String name = row[0];
            // Only add if this exercise doesn't already exist by name
            if (!exerciseRepository.existsByNameIgnoreCase(name)) {
                Exercise ex = new Exercise();
                ex.setName(name);
                ex.setMuscleGroup(row[1]);
                ex.setEquipment(row[2]);
                ex.setCategory(row[3]);
                exerciseRepository.save(ex);
                added++;
            }
        }
        System.out.println("Exercises seeded: " + added + " new exercises added.");
    }
}
