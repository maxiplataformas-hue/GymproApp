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
        byte[] postData = json.getBytes("UTF-8");

        for (int i = 0; i <= maxRedirects; i++) {
            URL url = new URL(currentUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(false); // We handle redirects manually
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(15000);
            conn.setDoOutput(true);
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Content-Length", String.valueOf(postData.length));

            try (OutputStream os = conn.getOutputStream()) {
                os.write(postData);
            }

            int status = conn.getResponseCode();

            if (status == 200 || status == 201) {
                // Success — read body
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), "UTF-8"))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) sb.append(line);
                    return sb.toString();
                }
            } else if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308) {
                // Follow redirect
                String location = conn.getHeaderField("Location");
                if (location == null || location.isBlank()) {
                    throw new IOException("Redirect without Location header. Status: " + status);
                }
                currentUrl = location;
                
                // For 301, 302, 303: switch to GET as per HTTP spec for "found" redirects
                boolean isMethodPreservation = (status == 307 || status == 308);
                
                HttpURLConnection nextConn = (HttpURLConnection) new URL(currentUrl).openConnection();
                nextConn.setConnectTimeout(15000);
                nextConn.setReadTimeout(15000);
                
                if (isMethodPreservation) {
                    nextConn.setRequestMethod("POST");
                    nextConn.setDoOutput(true);
                    nextConn.setRequestProperty("Content-Type", "application/json");
                    nextConn.setRequestProperty("Content-Length", String.valueOf(postData.length));
                    try (OutputStream os = nextConn.getOutputStream()) {
                        os.write(postData);
                    }
                } else {
                    nextConn.setRequestMethod("GET");
                }
                
                int nextStatus = nextConn.getResponseCode();
                if (nextStatus == 200 || nextStatus == 201) {
                    try (BufferedReader br = new BufferedReader(
                            new InputStreamReader(nextConn.getInputStream(), "UTF-8"))) {
                        StringBuilder sb = new StringBuilder();
                        String line;
                        while ((line = br.readLine()) != null) sb.append(line);
                        return sb.toString();
                    }
                } else if (nextStatus >= 300 && nextStatus < 400 && i < maxRedirects) {
                    // It's another redirect, let the loop handle it
                    currentUrl = nextConn.getHeaderField("Location");
                    conn.disconnect();
                    continue; 
                } else {
                    throw new IOException("Unexpected HTTP status after redirect: " + nextStatus + " for URL: " + currentUrl);
                }
            } else {
                throw new IOException("Unexpected HTTP status: " + status + " for URL: " + currentUrl);
            }

        }

        throw new IOException("Too many redirects (max " + maxRedirects + ") for URL: " + urlString);
    }
}
