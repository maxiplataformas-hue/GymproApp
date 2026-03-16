package cl.maxi.gympro.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import java.time.LocalDateTime;

@Service
public class KeepAliveService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String STATUS_URL = "https://gymproapp.onrender.com/api/status";

    @Scheduled(fixedRate = 30000) // Every 30 seconds
    public void pingSelf() {
        try {
            System.out.println("--- KEEP-ALIVE PING START --- " + LocalDateTime.now());
            ResponseEntity<String> response = restTemplate.getForEntity(STATUS_URL, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("KEEP-ALIVE SUCCESS: " + response.getBody());
            } else {
                System.err.println("KEEP-ALIVE WARNING: Received " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("KEEP-ALIVE ERROR: Could not ping self. " + e.getMessage());
        }
    }
}
