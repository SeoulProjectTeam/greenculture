package com.greenculture.infrastructure.seoul;

import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class SeoulOpenApiClient {

    private final XmlMapper xmlMapper = new XmlMapper();

    private final RestClient restClient = RestClient.builder()
            .baseUrl("http://openapi.seoul.go.kr:8088")
            .build();

    @Value("${seoul.openapi.key:}")
    private String apiKey;

    public CulturalEventInfoXml fetchCulturalEventInfo(int start, int end) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Missing seoul.openapi.key");
        }

        // Example: /{key}/xml/culturalEventInfo/1/5/
        byte[] body = restClient.get()
                .uri("/{key}/xml/culturalEventInfo/{start}/{end}/", apiKey, start, end)
                .retrieve()
                .body(byte[].class);

        if (body == null) throw new IllegalStateException("Empty response body");

        try {
            String xml = new String(body, StandardCharsets.UTF_8);
            return xmlMapper.readValue(xml, CulturalEventInfoXml.class);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse XML", e);
        }
    }
}

