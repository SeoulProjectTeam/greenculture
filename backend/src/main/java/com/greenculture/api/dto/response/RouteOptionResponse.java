package com.greenculture.api.dto.response;

import com.greenculture.domain.enums.RouteType;
import lombok.Builder;

@Builder
public record RouteOptionResponse(
        Long routeAlternativeId,
        RouteType routeType,
        Integer durationMinutes,
        Integer transferCount,
        Double distanceKm,
        Double carbonKg,
        Boolean includesBike
) {
}
