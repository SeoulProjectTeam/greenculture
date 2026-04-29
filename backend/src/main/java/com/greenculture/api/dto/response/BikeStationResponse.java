package com.greenculture.api.dto.response;

public record BikeStationResponse(
        String stationId,
        String stationName,
        Double latitude,
        Double longitude,
        Integer totalRacks
) {
}
