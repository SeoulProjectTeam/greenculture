package com.greenculture.api.controller;

import com.greenculture.api.dto.request.CarbonCalculateRequest;
import com.greenculture.api.dto.response.CarbonCalculateResponse;
import com.greenculture.application.service.CarbonService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/carbon")
@RequiredArgsConstructor
public class CarbonController {
    private final CarbonService carbonService;

    @PostMapping("/calculate")
    public CarbonCalculateResponse calculate(@RequestBody CarbonCalculateRequest request) {
        double routeCarbon = carbonService.calculateRouteCarbon(request.getSegments());
        double saved = carbonService.calculateSavedCarbonVsCar(request.getTotalDistanceKm(), routeCarbon);
        return new CarbonCalculateResponse(routeCarbon, saved);
    }
}
