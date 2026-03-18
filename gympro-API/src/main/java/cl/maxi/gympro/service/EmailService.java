package cl.maxi.gympro.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public void sendOtpEmail(String to, String code, String subject) {
        if (fromEmail == null || fromEmail.trim().isEmpty()) {
            System.err.println("CRITICAL: GMAIL_USER is not configured in environment variables!");
            throw new RuntimeException("El sistema de correo no está configurado. Contacta al administrador.");
        }

        try {
            System.out.println("Sending OTP email to: " + to);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "CoachPro App");
            helper.setTo(to);
            helper.setSubject(subject != null ? subject : "Código de Verificación - CoachPro");
            helper.setText(buildHtml(code), true);

            mailSender.send(message);
            System.out.println("Email sent successfully to: " + to);

        } catch (Exception e) {
            System.err.println("Error sending email: " + e.getMessage());
            throw new RuntimeException("No se pudo enviar el correo: " + e.getMessage());
        }
    }

    private String buildHtml(String code) {
        return "<!DOCTYPE html>"
            + "<html><body>"
            + "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;padding:30px;border-radius:12px;\">"
            + "<h2 style=\"color:#0088ff;text-align:center;\">Tu c&oacute;digo de verificaci&oacute;n</h2>"
            + "<p style=\"font-size:16px;color:#333;\">Usa este c&oacute;digo para acceder a <strong>CoachPro</strong>:</p>"
            + "<div style=\"background:#f4f7ff;padding:20px;text-align:center;border-radius:10px;margin:20px 0;\">"
            + "<span style=\"font-size:40px;font-weight:bold;color:#0055cc;letter-spacing:10px;\">" + code + "</span>"
            + "</div>"
            + "<p style=\"font-size:13px;color:#888;\">Este c&oacute;digo expira en 20 minutos.</p>"
            + "<hr style=\"border:none;border-top:1px solid #eee;margin:20px 0;\">"
            + "<p style=\"font-size:12px;color:#aaa;text-align:center;\">CoachPro App &mdash; Fitness &amp; Performance</p>"
            + "</div></body></html>";
    }
}
