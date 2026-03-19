package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.OtpEntry;
import cl.maxi.gympro.repository.OtpRepository;
import cl.maxi.gympro.repository.UserRepository;
import cl.maxi.gympro.service.EmailService;
import cl.maxi.gympro.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String deviceId = request.get("deviceId");
            
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body("Email is required");
            }

            String normalizedEmail = email.trim().toLowerCase();

            // Resilient user lookup (avoid 500 if duplicates exist)
            List<User> users = userRepository.findAll().stream()
                    .filter(u -> u.getEmail() != null && normalizedEmail.equalsIgnoreCase(u.getEmail()) && !Boolean.TRUE.equals(u.getIsDeleted()))
                    .collect(Collectors.toList());

            if (!users.isEmpty()) {
                User user = users.get(0);
                if (deviceId != null && user.getTrustedDeviceIds() != null && user.getTrustedDeviceIds().contains(deviceId)) {
                    System.out.println("OTP skipped for trusted device: " + deviceId + " user: " + normalizedEmail);
                    return ResponseEntity.ok(Map.of(
                        "otpSkipped", true,
                        "message", "Known device, OTP skipped",
                        "user", user
                    ));
                }
            }

            // Generate 6-digit random code
            String code = String.format("%06d", new Random().nextInt(1000000));
            
            // Save to DB
            otpRepository.deleteByEmail(normalizedEmail);
            OtpEntry otp = new OtpEntry();
            otp.setEmail(normalizedEmail);
            otp.setCode(code);
            otp.setExpiryTime(LocalDateTime.now().plusMinutes(20));
            otpRepository.save(otp);

            // Send email
            try {
                emailService.sendOtpEmail(normalizedEmail, code, "Código de Verificación - CoachPro");
            } catch (Exception e) {
                return ResponseEntity.status(500).body("SMTP Error: " + e.getMessage());
            }
            
            System.out.println("OTP sent to " + normalizedEmail + ": " + code);
            return ResponseEntity.ok(Map.of("otpSkipped", false, "message", "OTP sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error interno Auth: " + e.getMessage());
        }
    }


    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String deviceId = request.get("deviceId");

        if (email == null || code == null) {
            return ResponseEntity.badRequest().body("Email and code are required");
        }

        Optional<OtpEntry> otpOpt = otpRepository.findByEmail(email);
        
        System.out.println("Verifying OTP for " + email + ". Searching in DB...");
        if (otpOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("No se encontró un código para este correo. Solicita uno nuevo.");
        }

        OtpEntry otp = otpOpt.get();
        if (otp.getExpiryTime().isBefore(LocalDateTime.now())) {
            otpRepository.deleteByEmail(email);
            return ResponseEntity.badRequest().body("Código expirado. Solicita uno nuevo.");
        }

        if (!otp.getCode().equals(code)) {
            return ResponseEntity.badRequest().body("Código incorrecto. Verifica el correo e intenta de nuevo.");
        }

        // Success - Mark device as trusted if deviceId provided
        if (deviceId != null) {
            String normalizedEmail = email.trim().toLowerCase();
            List<User> users = userRepository.findAll().stream()
                    .filter(u -> u.getEmail() != null && normalizedEmail.equalsIgnoreCase(u.getEmail()))
                    .collect(Collectors.toList());

            if (!users.isEmpty()) {
                User user = users.get(0);
                if (user.getTrustedDeviceIds() == null) {
                    user.setTrustedDeviceIds(new ArrayList<>());
                }
                if (!user.getTrustedDeviceIds().contains(deviceId)) {
                    user.getTrustedDeviceIds().add(deviceId);
                    userRepository.save(user);
                    System.out.println("Device " + deviceId + " added to trusted list for " + normalizedEmail);
                }
            }
        }


        otpRepository.deleteByEmail(email);
        return ResponseEntity.ok(Map.of("message", "OTP verified successfully"));
    }
}
