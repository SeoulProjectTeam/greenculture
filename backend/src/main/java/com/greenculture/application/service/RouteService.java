package com.greenculture.application.service;

import com.greenculture.api.dto.request.RouteCompareRequest;
import com.greenculture.api.dto.response.RouteCompareResponse;
import com.greenculture.api.dto.response.RouteExplainResponse;
import com.greenculture.api.dto.response.RouteOptionResponse;
import com.greenculture.domain.entity.RouteAlternative;
import com.greenculture.domain.entity.RoutePlan;
import com.greenculture.domain.enums.RouteType;
import com.greenculture.domain.repository.RouteAlternativeRepository;
import com.greenculture.domain.repository.RoutePlanRepository;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RouteService {
    private final RoutePlanRepository routePlanRepository;
    private final RouteAlternativeRepository routeAlternativeRepository;

    @Transactional
    public RouteCompareResponse compareRoutes(RouteCompareRequest request) {
        RoutePlan routePlan = new RoutePlan();
        routePlan.setOriginName(request.getOriginName());
        routePlan.setOriginLat(request.getOriginLat());
        routePlan.setOriginLng(request.getOriginLng());
        routePlan.setDestinationName(request.getDestinationName());
        routePlan.setDestinationLat(request.getDestinationLat());
        routePlan.setDestinationLng(request.getDestinationLng());
        routePlan.setDepartureTime(request.getDepartureTime());
        routePlan.setRequestDate(LocalDate.now());
        routePlanRepository.save(routePlan);

        RouteAlternative fast = saveAlternative(routePlan, RouteType.FAST, 35, 2, 14.2, 1.35, false);
        RouteAlternative eco = saveAlternative(routePlan, RouteType.ECO, 48, 1, 13.7, 0.42, true);
        RouteAlternative balanced = saveAlternative(routePlan, RouteType.BALANCED, 40, 1, 14.0, 0.80, true);

        List<RouteOptionResponse> routes = List.of(fast, eco, balanced).stream()
                .map(this::toResponse)
                .toList();
        return new RouteCompareResponse(routes);
    }

    public RouteExplainResponse explainRoute(Long routeAlternativeId) {
        RouteAlternative route = routeAlternativeRepository.findById(routeAlternativeId)
                .orElseThrow(() -> new IllegalArgumentException("Route not found."));

        String explanation = switch (route.getRouteType()) {
            case FAST -> "This route has the shortest travel time.";
            case ECO -> "This route minimizes carbon emissions.";
            case BALANCED -> "This route balances travel time and carbon emissions.";
        };

        return new RouteExplainResponse(routeAlternativeId, explanation);
    }

    private RouteAlternative saveAlternative(
            RoutePlan plan,
            RouteType type,
            int minutes,
            int transfers,
            double distance,
            double carbon,
            boolean bike
    ) {
        RouteAlternative alternative = new RouteAlternative();
        alternative.setRoutePlan(plan);
        alternative.setRouteType(type);
        alternative.setDurationMinutes(minutes);
        alternative.setTransferCount(transfers);
        alternative.setDistanceKm(distance);
        alternative.setCarbonKg(carbon);
        alternative.setIncludesBike(bike);
        return routeAlternativeRepository.save(alternative);
    }

    private RouteOptionResponse toResponse(RouteAlternative route) {
        return RouteOptionResponse.builder()
                .routeAlternativeId(route.getId())
                .routeType(route.getRouteType())
                .durationMinutes(route.getDurationMinutes())
                .transferCount(route.getTransferCount())
                .distanceKm(route.getDistanceKm())
                .carbonKg(route.getCarbonKg())
                .includesBike(route.getIncludesBike())
                .build();
    }
}
