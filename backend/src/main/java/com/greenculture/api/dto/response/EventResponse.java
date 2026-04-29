package com.greenculture.api.dto.response;

import java.time.LocalDate;
import lombok.Builder;

@Builder
public record EventResponse(
        Long id,
        String title,
        String category,
        String venueName,
        Double latitude,
        Double longitude,
        LocalDate eventDate,
        String sourceUrl
) {
}
