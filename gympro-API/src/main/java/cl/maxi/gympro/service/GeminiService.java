package cl.maxi.gympro.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;

@Service
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    private final String API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

    private final String SYSTEM_PROMPT = "Eres un Entrenador Personal Profesional de la app COACHPRO. " +
            "Tu objetivo es ayudar a los alumnos con sus rutinas, técnica de ejercicios, nutrición deportiva y motivación. "
            +
            "REGLA CRÍTICA: Solo puedes hablar de temas relacionados con el entrenamiento físico, salud deportiva y nutrición. "
            +
            "Si te preguntan sobre otros temas (política, entretenimiento, historia, etc.), responde amablemente que como Coach IA de COACHPRO, "
            +
            "solo estás capacitado para asesorar en temas de fitness. Responde siempre en español, de forma motivadora pero técnica.";

    public String getResponse(String userMessage) {
        if (apiKey == null || apiKey.isEmpty()) {
            return "Lo siento, la API Key de Gemini no está configurada. Por favor, contacta al administrador.";
        }

        RestTemplate restTemplate = new RestTemplate();
        String url = API_URL + "?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Prepare the request body for Gemini API
        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> contents = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();

        // Combine system prompt and user message
        parts.put("text", SYSTEM_PROMPT + "\n\nUsuario dice: " + userMessage);
        contents.put("parts", Collections.singletonList(parts));
        requestBody.put("contents", Collections.singletonList(contents));

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = (Map<String, Object>) response.getBody();
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");

                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> firstCandidate = candidates.get(0);
                    Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
                    List<Map<String, Object>> responseParts = (List<Map<String, Object>>) content.get("parts");
                    Map<String, Object> firstPart = responseParts.get(0);
                    return (String) firstPart.get("text");
                }
            }
        } catch (Exception e) {
            return "Hubo un error al comunicar con el Coach IA: " + e.getMessage();
        }

        return "No pude generar una respuesta en este momento.";
    }
}
