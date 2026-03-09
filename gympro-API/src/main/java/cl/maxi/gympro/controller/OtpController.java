package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.OtpCode;
import cl.maxi.gympro.model.User;
import cl.maxi.gympro.repository.OtpCodeRepository;
import cl.maxi.gympro.repository.UserRepository;
import cl.maxi.gympro.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/otp")
public class OtpController {

    private final OtpCodeRepository otpRepo;
    private final UserRepository userRepo;
    private final EmailService emailService;

    public OtpController(OtpCodeRepository otpRepo, UserRepository userRepo, EmailService emailService) {
        this.otpRepo = otpRepo;
        this.userRepo = userRepo;
        this.emailService = emailService;
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email requerido"));
        }

        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Don't reveal if user exists; still return success to avoid enumeration
            return ResponseEntity.ok(Map.of("message", "Si el correo está registrado, recibirás un código."));
        }

        // Delete previous codes for this email
        otpRepo.deleteByEmail(email);

        // Generate 6-digit code
        String code = String.format("%06d", new Random().nextInt(999999));

        OtpCode otp = new OtpCode(email, code);
        otpRepo.save(otp);

        emailService.sendOtpEmail(email, code);

        return ResponseEntity.ok(Map.of("message", "Código enviado al correo."));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");

        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email y código requeridos"));
        }

        Optional<OtpCode> otpOpt = otpRepo.findTopByEmailAndUsedFalseOrderByExpiresAtDesc(email);

        if (otpOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Código no encontrado o ya utilizado."));
        }

        OtpCode otp = otpOpt.get();

        if (Instant.now().isAfter(otp.getExpiresAt())) {
            return ResponseEntity.status(401).body(Map.of("error", "El código ha expirado. Solicita uno nuevo."));
        }

        if (!otp.getCode().equals(code)) {
            return ResponseEntity.status(401).body(Map.of("error", "Código incorrecto."));
        }

        // Mark as used
        otp.setUsed(true);
        otpRepo.save(otp);

        // Return the user
        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado."));
        }

        return ResponseEntity.ok(userOpt.get());
    }
}
