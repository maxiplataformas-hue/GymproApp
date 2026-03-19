package cl.maxi.gympro.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.*;

@Service
public class EmailService {

    @Value("${google.script.url:}")
    private String scriptUrl;

    public void sendOtpEmail(String to, String code, String subject) {
        if (scriptUrl == null || scriptUrl.trim().isEmpty()) {
            System.err.println("CRITICAL: google.script.url is not configured!");
            throw new RuntimeException("Configuración de correo no encontrada. Verifica GOOGLE_SCRIPT_URL.");
        }

        String effectiveSubject = (subject != null && !subject.isBlank())
                ? subject : "Código de Verificación - CoachPro";

        // Build JSON body manually (no extra dependencies)
        String json = String.format(
                "{\"to\":\"%s\",\"code\":\"%s\",\"subject\":\"%s\"}",
                to.replace("\"", "\\\""),
                code.replace("\"", "\\\""),
                effectiveSubject.replace("\"", "\\\"")
        );

        try {
            System.out.println("Sending OTP email to: " + to + " via Google Script (native HTTP POST + redirect)");
            String response = postWithRedirect(scriptUrl, json, 5);
            System.out.println("Email sent to: " + to + ". Script response: " + response);
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Unknown error";
            System.err.println("Error calling email proxy for " + to + ": " + msg);
            throw new RuntimeException("No se pudo enviar el código al correo: " + msg);
        }
    }

    /**
     * Posts JSON to a URL and follows redirects (including 302 POST→GET redirect from Google).
     * Pure Java, no extra dependencies.
     */
    private String postWithRedirect(String urlString, String json, int maxRedirects) throws IOException {
        String currentUrl = urlString;
        String method = "POST";
        byte[] postData = json.getBytes("UTF-8");

        for (int i = 0; i <= maxRedirects; i++) {
            URL url = new URL(currentUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(false);
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(15000);
            conn.setRequestMethod(method);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");

            if ("POST".equals(method)) {
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                conn.setRequestProperty("Content-Length", String.valueOf(postData.length));
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(postData);
                }
            }


            int status = conn.getResponseCode();

            if (status == 200 || status == 201) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) sb.append(line);
                    return sb.toString();
                }
            } else if (status == 301 || status == 302 || status == 303) {
                // For Google Scripts, a redirect usually means the execution was successful
                // and it's trying to take us to a result page.
                System.out.println("Success (implicit) via redirect: " + status + " for URL: " + currentUrl);
                return "{\"status\":\"success\",\"message\":\"Redirected success\"}";
            } else if (status == 307 || status == 308) {
                // Must preserve method and body (very rare for Google macros, usually 302)
                String location = conn.getHeaderField("Location");
                if (location == null || location.isBlank()) {
                    throw new IOException("Redirect without Location header. Status: " + status);
                }
                currentUrl = location;
                conn.disconnect();
                System.out.println("Retrying POST (307/308) to: " + currentUrl);
                continue; 
            } else {
                throw new IOException("Unexpected HTTP status: " + status + " for URL: " + currentUrl);
            }

        }


        throw new IOException("Too many redirects (max " + maxRedirects + ") for URL: " + urlString);
    }
}
