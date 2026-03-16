package cl.maxi.gympro.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/status")
@CrossOrigin(origins = "*")
public class StatusController {

    @GetMapping
    public Map<String, String> getStatus() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "OK");
        status.put("timestamp", LocalDateTime.now().toString());
        status.put("message", "System is active");
        return status;
    }
}
