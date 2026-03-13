package cl.maxi.gympro.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
public class EmailService {

    @Value("${google.script.url:}")
    private String scriptUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendOtpEmail(String to, String code, String subject) {
        if (scriptUrl == null || scriptUrl.isEmpty()) {
            throw new RuntimeException("Google Script URL is NOT configured in properties.");
        }

        Map<String, String> body = new HashMap<>();
        body.put("to", to);
        body.put("code", code);
        body.put("subject", subject != null ? subject : "Código de Verificación - CoachPro");
        
        try {
            String response = restTemplate.postForObject(scriptUrl, body, String.class);
            System.out.println("Email effectively sent via Proxy to: " + to + ". Response: " + response);
        } catch (Exception e) {
            System.err.println("Error sending email via Proxy: " + e.getMessage());
            throw new RuntimeException("Failed to send email via Proxy: " + e.getMessage());
        }
    }
}
