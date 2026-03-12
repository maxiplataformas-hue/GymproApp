package cl.maxi.gympro.controller;

import cl.maxi.gympro.model.OtpEntry;
import cl.maxi.gympro.repository.OtpRepository;
import cl.maxi.gympro.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private EmailService emailService;

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }

        // Generate 6-digit random code
        String code = String.format("%06d", new Random().nextInt(1000000));
        
        // Save to DB
        otpRepository.deleteByEmail(email);
        OtpEntry otp = new OtpEntry();
        otp.setEmail(email);
        otp.setCode(code);
        otp.setExpiryTime(LocalDateTime.now().plusMinutes(20));
        otpRepository.save(otp);

        // Send email
        try {
            emailService.sendOtpEmail(email, code);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("SMTP Error: " + e.getMessage());
        }
        
        System.out.println("OTP sent to " + email + ": " + code);
        return ResponseEntity.ok(Map.of("message", "OTP sent successfully"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");

        if (email == null || code == null) {
            return ResponseEntity.badRequest().body("Email and code are required");
        }

        Optional<OtpEntry> otpOpt = otpRepository.findByEmail(email);
        
        System.out.println("Verifying OTP for " + email + ". Searching in DB...");
        if (otpOpt.isEmpty()) {
            System.err.println("No OTP found for " + email);
            return ResponseEntity.badRequest().body("No se encontró un código para este correo. Solicita uno nuevo.");
        }

        OtpEntry otp = otpOpt.get();
        System.out.println("Found OTP in DB: " + otp.getCode() + ", current time: " + LocalDateTime.now() + ", expiry: " + otp.getExpiryTime());
        
        if (otp.getExpiryTime().isBefore(LocalDateTime.now())) {
            System.err.println("OTP expired for " + email);
            otpRepository.deleteByEmail(email);
            return ResponseEntity.badRequest().body("Código expirado. Solicita uno nuevo.");
        }

        if (!otp.getCode().equals(code)) {
            System.err.println("Invalid code for " + email + ". Expected: " + otp.getCode() + ", Received: " + code);
            return ResponseEntity.badRequest().body("Código incorrecto. Verifica el correo e intenta de nuevo.");
        }

        // Success
        System.out.println("OTP verified successfully for " + email);
        otpRepository.deleteByEmail(email);
        return ResponseEntity.ok(Map.of("message", "OTP verified successfully"));
    }
}
