package com.greenculture.application.service;

import com.greenculture.api.dto.request.RouteSegmentDto;
import com.greenculture.domain.enums.TransportMode;
import com.greenculture.domain.repository.CarbonFactorRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CarbonService {
    private final CarbonFactorRepository carbonFactorRepository;

    public double calculateRouteCarbon(List<RouteSegmentDto> segments) {
        Map<TransportMode, Double> factors = carbonFactorRepository.findAll().stream()
                .collect(Collectors.toMap(f -> f.getMode(), f -> f.getKgCo2PerKm()));

        return segments.stream()
                .mapToDouble(segment -> segment.getDistanceKm() * factors.getOrDefault(segment.getMode(), 0.0))
                .sum();
    }

    public double calculateSavedCarbonVsCar(double totalDistanceKm, double routeCarbonKg) {
        double carFactor = carbonFactorRepository.findByMode(TransportMode.CAR)
                .map(f -> f.getKgCo2PerKm())
                .orElse(0.192);
        return (totalDistanceKm * carFactor) - routeCarbonKg;
    }
}
