package com.greenculture.application.service;

import com.greenculture.api.dto.response.BikeStationResponse;
import com.greenculture.domain.repository.BikeStationRepository;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BikeStationService {
    private final BikeStationRepository bikeStationRepository;

    public List<BikeStationResponse> findNearby(double lat, double lng, double radiusKm) {
        return bikeStationRepository.findAll().stream()
                .map(station -> new BikeStationDistance(
                        station.getStationId(),
                        station.getStationName(),
                        station.getLatitude(),
                        station.getLongitude(),
                        station.getTotalRacks(),
                        haversineKm(lat, lng, station.getLatitude(), station.getLongitude())
                ))
                .filter(station -> station.distanceKm <= radiusKm)
                .sorted(Comparator.comparingDouble(s -> s.distanceKm))
                .limit(10)
                .map(station -> new BikeStationResponse(
                        station.stationId,
                        station.stationName,
                        station.latitude,
                        station.longitude,
                        station.totalRacks
                ))
                .toList();
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private record BikeStationDistance(
            String stationId,
            String stationName,
            Double latitude,
            Double longitude,
            Integer totalRacks,
            double distanceKm
    ) {}
}
