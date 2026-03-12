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
        otp.setExpiryTime(LocalDateTime.now().plusMinutes(10));
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
        
        if (otpOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("No OTP found for this email");
        }

        OtpEntry otp = otpOpt.get();
        if (otp.getExpiryTime().isBefore(LocalDateTime.now())) {
            otpRepository.deleteByEmail(email);
            return ResponseEntity.badRequest().body("OTP expired");
        }

        if (!otp.getCode().equals(code)) {
            return ResponseEntity.badRequest().body("Invalid code");
        }

        // Success
        otpRepository.deleteByEmail(email);
        return ResponseEntity.ok(Map.of("message", "OTP verified successfully"));
    }
}
