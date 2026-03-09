package cl.maxi.gympro.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Tu código de acceso CoachPro");
        message.setText(
                "Hola,\n\n" +
                        "Tu código de verificación para acceder a CoachPro es:\n\n" +
                        "    " + code + "\n\n" +
                        "Este código expira en 10 minutos.\n" +
                        "Si no solicitaste este código, ignora este mensaje.\n\n" +
                        "— Equipo CoachPro");
        mailSender.send(message);
    }
}
