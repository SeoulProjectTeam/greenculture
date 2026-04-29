package com.greenculture.api.dto.response;

import com.greenculture.domain.enums.AvailabilityLevel;
import java.time.LocalDateTime;

public record ReturnAvailabilityResponse(
        String stationId,
        LocalDateTime targetTime,
        AvailabilityLevel level,
        Double score
) {
}
