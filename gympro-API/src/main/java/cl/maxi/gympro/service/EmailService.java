package cl.maxi.gympro.service;

import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.HttpRequest;
import org.apache.hc.core5.http.HttpResponse;
import org.apache.hc.core5.http.protocol.HttpContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class EmailService {

    @Value("${google.script.url:}")
    private String scriptUrl;

    // RestTemplate with Apache HttpClient to follow POST redirects
    private final RestTemplate restTemplate;

    public EmailService() {
        HttpClient apacheClient = HttpClients.custom()
            .setRedirectStrategy(new org.apache.hc.client5.http.impl.DefaultRedirectStrategy() {
                @Override
                public boolean isRedirected(HttpRequest request, HttpResponse response, HttpContext context) {
                    int status = response.getCode();
                    return (status == 301 || status == 302 || status == 303 || status == 307 || status == 308);
                }
            })
            .build();
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(apacheClient);
        this.restTemplate = new RestTemplate(factory);
    }

    public void sendOtpEmail(String to, String code, String subject) {
        if (scriptUrl == null || scriptUrl.trim().isEmpty()) {
            System.err.println("CRITICAL: google.script.url is not configured!");
            throw new RuntimeException("Configuración de correo no encontrada. Verifica GOOGLE_SCRIPT_URL.");
        }

        Map<String, String> body = new HashMap<>();
        body.put("to", to);
        body.put("code", code);
        body.put("subject", subject != null ? subject : "Código de Verificación - CoachPro");

        try {
            System.out.println("Sending OTP email to: " + to + " via Google Script (POST + redirect)");
            String response = restTemplate.postForObject(scriptUrl, body, String.class);
            System.out.println("Email sent to: " + to + ". Script response: " + response);
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Unknown error";
            System.err.println("Error calling email proxy: " + msg);
            throw new RuntimeException("No se pudo enviar el código al correo: " + msg);
        }
    }
}
