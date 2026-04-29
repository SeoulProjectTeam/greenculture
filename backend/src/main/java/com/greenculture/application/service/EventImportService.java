package com.greenculture.application.service;

import com.greenculture.api.dto.response.admin.EventImportResponse;
import com.greenculture.domain.entity.CulturalEvent;
import com.greenculture.domain.repository.CulturalEventRepository;
import com.greenculture.infrastructure.seoul.CulturalEventInfoXml;
import com.greenculture.infrastructure.seoul.SeoulOpenApiClient;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EventImportService {

    private static final DateTimeFormatter SEOUL_DATETIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.S");

    private final SeoulOpenApiClient seoulOpenApiClient;
    private final CulturalEventRepository culturalEventRepository;

    @Transactional
    public EventImportResponse importPages(int start, int end) {
        CulturalEventInfoXml xml = seoulOpenApiClient.fetchCulturalEventInfo(start, end);
        if (xml.getResult() == null || !"INFO-000".equalsIgnoreCase(xml.getResult().getCode())) {
            String code = xml.getResult() == null ? "UNKNOWN" : xml.getResult().getCode();
            String message = xml.getResult() == null ? "No result" : xml.getResult().getMessage();
            throw new IllegalStateException("OpenAPI error: " + code + " " + message);
        }

        List<CulturalEventInfoXml.RowXml> rows = Optional.ofNullable(xml.getRows()).orElseGet(ArrayList::new);

        int inserted = 0;
        int updated = 0;
        int skipped = 0;

        for (CulturalEventInfoXml.RowXml row : rows) {
            String externalId = extractCultCode(row.getHomepage());
            if (externalId == null || externalId.isBlank()) {
                skipped++;
                continue;
            }

            CulturalEvent entity = culturalEventRepository.findByExternalId(externalId)
                    .orElseGet(CulturalEvent::new);

            boolean isNew = entity.getId() == null;

            entity.setExternalId(externalId);
            entity.setTitle(nullSafe(row.getTitle()));
            entity.setCategory(nullSafe(row.getCodeName()));
            entity.setVenueName(nullSafe(row.getPlace()));
            entity.setLatitude(parseDoubleOrNull(row.getLat()));
            entity.setLongitude(parseDoubleOrNull(row.getLot()));
            entity.setEventDate(parseLocalDateOrNull(row.getStartDateTime()));
            entity.setSourceUrl(pickUrl(row));

            culturalEventRepository.save(entity);
            if (isNew) inserted++; else updated++;
        }

        return new EventImportResponse(start, end, inserted, updated, skipped, xml.getListTotalCount());
    }

    public List<EventImportResponse> importRange(int pageSize, int maxItems) {
        int start = 1;
        int end = Math.min(pageSize, maxItems);
        List<EventImportResponse> results = new ArrayList<>();
        while (start <= maxItems) {
            results.add(importPages(start, end));
            start = end + 1;
            end = Math.min(start + pageSize - 1, maxItems);
        }
        return results;
    }

    private static String pickUrl(CulturalEventInfoXml.RowXml row) {
        if (row.getHomepage() != null && !row.getHomepage().isBlank()) return row.getHomepage();
        if (row.getOrgLink() != null && !row.getOrgLink().isBlank()) return row.getOrgLink();
        return null;
    }

    private static String nullSafe(String v) {
        return v == null ? null : v.trim();
    }

    private static Double parseDoubleOrNull(String v) {
        if (v == null || v.isBlank()) return null;
        try {
            return Double.parseDouble(v.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private static LocalDate parseLocalDateOrNull(String seoulDateTime) {
        if (seoulDateTime == null || seoulDateTime.isBlank()) return null;
        try {
            // "2026-08-13 00:00:00.0"
            return LocalDate.parse(seoulDateTime.trim().substring(0, 10));
        } catch (Exception e) {
            return null;
        }
    }

    private static String extractCultCode(String homepage) {
        if (homepage == null) return null;
        // e.g. https://culture.seoul.go.kr/.../view.do?cultcode=156698&menuNo=200009
        int idx = homepage.indexOf("cultcode=");
        if (idx < 0) return null;
        String sub = homepage.substring(idx + "cultcode=".length());
        int amp = sub.indexOf('&');
        return (amp >= 0 ? sub.substring(0, amp) : sub).trim();
    }
}

