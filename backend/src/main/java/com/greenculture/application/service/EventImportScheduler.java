package com.greenculture.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventImportScheduler {

    private final EventImportService eventImportService;

    @Value("${seoul.import.enabled:false}")
    private boolean enabled;

    @Value("${seoul.openapi.key:}")
    private String apiKey;

    @Value("${seoul.import.pageSize:200}")
    private int pageSize;

    @Value("${seoul.import.maxItems:1000}")
    private int maxItems;

    @Scheduled(cron = "${seoul.import.cron:0 0 3 * * *}", zone = "Asia/Seoul")
    public void importDaily() {
        if (!enabled) return;
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Seoul import enabled but SEOUL_OPENAPI_KEY is missing. Skipping.");
            return;
        }

        try {
            log.info("Seoul culturalEventInfo import started (pageSize={}, maxItems={})", pageSize, maxItems);
            var results = eventImportService.importRange(pageSize, maxItems);
            int inserted = results.stream().mapToInt(r -> r.inserted()).sum();
            int updated = results.stream().mapToInt(r -> r.updated()).sum();
            int skipped = results.stream().mapToInt(r -> r.skipped()).sum();
            log.info("Seoul culturalEventInfo import finished (inserted={}, updated={}, skipped={})", inserted, updated, skipped);
        } catch (Exception e) {
            log.error("Seoul culturalEventInfo import failed", e);
        }
    }
}

