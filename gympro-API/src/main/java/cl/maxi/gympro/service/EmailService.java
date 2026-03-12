package cl.maxi.gympro.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("alumnocoachpro@gmail.com");
        message.setTo(to);
        message.setSubject("Código de verificación CoachPRO");
        message.setText("Tu código de verificación para CoachPRO es: " + code + "\n\nEste código expirará en 10 minutos.");
        
        try {
            mailSender.send(message);
            System.out.println("Email effectively sent to: " + to);
        } catch (Exception e) {
            System.err.println("Error sending email: " + e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }
}
