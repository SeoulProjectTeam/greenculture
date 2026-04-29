package com.greenculture.api.controller;

import com.greenculture.api.dto.response.BikeStationResponse;
import com.greenculture.api.dto.response.ReturnAvailabilityResponse;
import com.greenculture.application.service.BikePredictionService;
import com.greenculture.application.service.BikeStationService;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bike-stations")
@RequiredArgsConstructor
public class BikeController {
    private final BikeStationService bikeStationService;
    private final BikePredictionService bikePredictionService;

    @GetMapping("/nearby")
    public List<BikeStationResponse> nearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "1.0") double radiusKm
    ) {
        return bikeStationService.findNearby(lat, lng, radiusKm);
    }

    @GetMapping("/{stationId}/return-availability")
    public ReturnAvailabilityResponse predict(
            @PathVariable String stationId,
            @RequestParam LocalDateTime datetime
    ) {
        return bikePredictionService.predictReturnAvailability(stationId, datetime);
    }
}
