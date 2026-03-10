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

    private final String API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

    private final String SYSTEM_PROMPT = "Eres un Entrenador Personal Profesional de la app COACHPRO. " +
            "Tu objetivo es ayudar a los alumnos con sus rutinas, técnica, nutrición y motivación de forma CONCISA y PRECISA. "
            +
            "REGLAS CRÍTICAS:\n" +
            "1. Sé breve. No uses introducciones largas ni mucha cortesía innecesaria.\n" +
            "2. Ve al grano. Responde exactamente lo que se te pregunta con datos técnicos y directos.\n" +
            "3. Solo habla de salud, fitness y nutrición. Para otros temas, declina amablemente.\n" +
            "4. Idioma: Español.";

    public String getResponse(String userMessage, String studentContext) {
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

        // Combine system prompt, student context and user message
        String fullPrompt = SYSTEM_PROMPT + "\n\n" +
                (studentContext != null && !studentContext.isEmpty() ? studentContext + "\n\n" : "") +
                "Usuario dice: " + userMessage;

        parts.put("text", fullPrompt);
        contents.put("parts", Collections.singletonList(parts));
        requestBody.put("contents", Collections.singletonList(contents));

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            // Usamos ParameterizedTypeReference para tipificar la respuesta correctamente
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                    });

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
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
            return "Hubo un error al comunicar con el Coach IA (v2.5-flash): " + e.getMessage();
        }

        return "No pude generar una respuesta en este momento.";
    }
}
