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

    private final String SYSTEM_PROMPT = "Eres el Motor de Lógica Deportiva COACHPRO. Generas rutinas técnicas optimizadas.\n" +
            "DICCIONARIO DE DATOS (Input JSON):\n" +
            "- d: Día de la semana (ej. MONDAY).\n" +
            "- dt: Fecha actual.\n" +
            "- e: Edad.\n" +
            "- p: Peso (kg).\n" +
            "- a: Altura (cm).\n" +
            "- obj: Objetivo (muscle-gain, weight-loss, endurance, health).\n" +
            "- niv: Nivel (beginner, intermediate, advanced).\n" +
            "- frec: Días de entreno x semana.\n" +
            "- eq: EQUIPO DISPONIBLE (gym, dumbbells, bodyweight, home).\n" +
            "- pv: Volumen Anterior total.\n\n" +
            "REGLAS ESTRÍCTAS:\n" +
            "1. EQUIPO: Solo usa ejercicios compatibles con 'eq'. Si eq='bodyweight', PROHIBIDO usar pesas.\n" +
            "2. VARIEDAD: Usa el día 'd' para rotar ejercicios. No repitas la misma rutina exacta.\n" +
            "3. LÓGICA: Para 'muscle-gain', si pv > 0, aumenta la carga un 5%.\n" +
            "4. IDIOMA: Siempre en ESPAÑOL.\n" +
            "5. SALIDA: Solo JSON, sin explicaciones.";

    public String getResponse(String userMessage, String studentContext) {
        if (apiKey == null || apiKey.isEmpty()) {
            return "Lo siento, la API Key de Gemini no está configurada. Por favor, contacta al administrador.";
        }

        // Configure RestTemplate with timeouts (30 seconds)
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(30000);
        factory.setReadTimeout(30000);
        RestTemplate restTemplate = new RestTemplate(factory);
        
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

        System.out.println("--- AI REQUEST DEBUG ---");
        System.out.println("API KEY Configured: " + (apiKey != null && !apiKey.isEmpty() ? "YES (" + apiKey.substring(0, Math.min(4, apiKey.length())) + "...)" : "NO"));
        System.out.println("Full Prompt Sent: " + fullPrompt);

        parts.put("text", fullPrompt);
        contents.put("parts", Collections.singletonList(parts));
        requestBody.put("contents", Collections.singletonList(contents));

        // Configuration for Efficiency and Consistency
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.4);
        generationConfig.put("topP", 0.8);
        generationConfig.put("maxOutputTokens", 800);
        generationConfig.put("responseMimeType", "application/json");

        generationConfig.put("responseMimeType", "application/json");

        requestBody.put("generationConfig", generationConfig);

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
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
                    String aiText = (String) firstPart.get("text");
                    System.out.println("AI RESPONSE SUCCESS: " + aiText);
                    return aiText;
                }
            } else {
                System.err.println("API ERROR RESPONSE CODE: " + response.getStatusCode());
                System.err.println("API ERROR BODY: " + response.getBody());
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            System.err.println("HTTP CLIENT ERROR: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            return "ERROR_AI_CLIENT: " + e.getStatusCode();
        } catch (Exception e) {
            System.err.println("CRITICAL EXCEPTION CALLING GEMINI: " + e.getMessage());
            e.printStackTrace();
            return "ERROR_AI_CRITICAL: " + e.getMessage();
        }

        return "No pude generar una respuesta en este momento.";
    }
}
