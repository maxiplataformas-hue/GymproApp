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
        if (scriptUrl == null || scriptUrl.trim().isEmpty()) {
            System.err.println("CRITICAL: google.script.url is not configured!");
            throw new RuntimeException("Configuración de correo (Google Script URL) no encontrada. Verifica las variables de entorno.");
        }

        Map<String, String> body = new HashMap<>();
        body.put("to", to);
        body.put("code", code);
        body.put("subject", subject != null ? subject : "Código de Verificación - CoachPro");
        
        try {
            System.out.println("Attempting to send OTP to " + to + " via " + scriptUrl);
            String response = restTemplate.postForObject(scriptUrl, body, String.class);
            System.out.println("Email effectively sent via Proxy to: " + to + ". Response: " + response);
        } catch (Exception e) {
            String errorMsg = "Error llamando al Proxy de Email: " + e.getMessage();
            System.err.println(errorMsg);
            if (e.getMessage().contains("404")) {
                errorMsg = "URL de Script no encontrada (404). Verifica GOOGLE_SCRIPT_URL.";
            } else if (e.getMessage().contains("Connection refused")) {
                errorMsg = "No se pudo conectar con el Proxy de correo. Revisa la conexión.";
            }
            throw new RuntimeException(errorMsg);
        }
    }
}
