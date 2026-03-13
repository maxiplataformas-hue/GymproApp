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
            "- d: Día de la semana (usar para variar ejercicios).\n" +
            "- dt: Fecha actual.\n" +
            "- e: Edad del usuario.\n" +
            "- p: Peso (kg).\n" +
            "- a: Altura (cm).\n" +
            "- obj: Objetivo (muscle-gain, weight-loss, endurance, health).\n" +
            "- niv: Nivel (beginner, intermediate, advanced).\n" +
            "- frec: Días de entreno x semana.\n" +
            "- eq: Equipamiento disponible.\n" +
            "- pv: Volumen Anterior total (sets*reps*peso).\n\n" +
            "LÓGICA DE PROGRAMACIÓN:\n" +
            "- GANAR MÚSCULO (muscle-gain): Hipertrofia. Si pv > 0, asegurar que el volumen nuevo sea 2-5% superior (Sobrecarga Progresiva). 3-4 series, 8-12 reps.\n" +
            "- PERDER PESO (weight-loss): Déficit y densidad. Circuitos, 12-15 reps, descansos cortos.\n" +
            "- RESISTENCIA (endurance): 15-20 reps, 2-3 series.\n" +
            "- SALUD (health): Bajo impacto, 10-12 reps.\n\n" +
            "REGLAS ESTRÍCTAS:\n" +
            "1. Ejercicios siempre en ESPAÑOL.\n" +
            "2. Sin texto explicativo (SOLO JSON).\n" +
            "3. Variar rutina según el día 'd' para evitar monotonía.";

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

        parts.put("text", fullPrompt);
        contents.put("parts", Collections.singletonList(parts));
        requestBody.put("contents", Collections.singletonList(contents));

        // Configuration for Efficiency and Consistency
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.4);
        generationConfig.put("topP", 0.8);
        generationConfig.put("maxOutputTokens", 800);
        generationConfig.put("responseMimeType", "application/json");

        // Force exact JSON structure using responseSchema
        Map<String, Object> responseSchema = new HashMap<>();
        responseSchema.put("type", "OBJECT");
        
        Map<String, Object> exercisesProp = new HashMap<>();
        exercisesProp.put("type", "ARRAY");
        
        Map<String, Object> itemsSchema = new HashMap<>();
        itemsSchema.put("type", "OBJECT");
        
        Map<String, Object> itemProperties = new HashMap<>();
        itemProperties.put("name", Map.of("type", "STRING", "description", "Nombre del ejercicio en español"));
        itemProperties.put("sets", Map.of("type", "INTEGER"));
        itemProperties.put("reps", Map.of("type", "STRING", "description", "Número o rango de repeticiones"));
        itemProperties.put("weight", Map.of("type", "NUMBER", "description", "Peso inicial recomendado en kg"));
        
        itemsSchema.put("properties", itemProperties);
        itemsSchema.put("required", List.of("name", "sets", "reps", "weight"));
        
        exercisesProp.put("items", itemsSchema);
        
        responseSchema.put("properties", Map.of("exercises", exercisesProp));
        responseSchema.put("required", List.of("exercises"));
        
        generationConfig.put("responseSchema", responseSchema);
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
                    return (String) firstPart.get("text");
                }
            } else {
                System.err.println("API Error Response: " + response.getBody());
            }
        } catch (Exception e) {
            System.err.println("Exception calling Gemini: " + e.getMessage());
            return "Hubo un error al comunicar con el Coach IA (v2.5-flash): " + e.getMessage();
        }

        return "No pude generar una respuesta en este momento.";
    }
}
