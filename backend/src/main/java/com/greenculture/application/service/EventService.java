package com.greenculture.application.service;

import com.greenculture.api.dto.response.EventResponse;
import com.greenculture.domain.repository.CulturalEventRepository;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EventService {
    private final CulturalEventRepository culturalEventRepository;

    public List<EventResponse> recommend(LocalDate date, String interest) {
        return culturalEventRepository.findByEventDateAndCategoryContaining(date, interest).stream()
                .map(event -> EventResponse.builder()
                        .id(event.getId())
                        .title(event.getTitle())
                        .category(event.getCategory())
                        .venueName(event.getVenueName())
                        .latitude(event.getLatitude())
                        .longitude(event.getLongitude())
                        .eventDate(event.getEventDate())
                        .sourceUrl(event.getSourceUrl())
                        .build())
                .toList();
    }
}
