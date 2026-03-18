package cl.maxi.gympro.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

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

        try {
            System.out.println("Attempting to send OTP to " + to + " via Email Proxy (GET)");

            // Using GET ensures RestTemplate follows the 302 redirect from Google Scripts
            UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(scriptUrl)
                .queryParam("to", to)
                .queryParam("code", code)
                .queryParam("subject", subject != null ? subject : "Código de Verificación - CoachPro");

            String response = restTemplate.getForObject(builder.toUriString(), String.class);
            System.out.println("Email sent via Proxy to: " + to + ". Response: " + response);
        } catch (Exception e) {
            String errorMsg = "Error llamando al Proxy de Email: " + e.getMessage();
            System.err.println(errorMsg);
            if (e.getMessage() != null && e.getMessage().contains("404")) {
                errorMsg = "URL de Script no encontrada (404). Verifica GOOGLE_SCRIPT_URL.";
            } else if (e.getMessage() != null && e.getMessage().contains("Connection refused")) {
                errorMsg = "No se pudo conectar con el Proxy de correo. Revisa la conexión.";
            }
            throw new RuntimeException(errorMsg);
        }
    }
}
