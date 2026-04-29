package com.greenculture.api.controller;

import com.greenculture.api.dto.request.RouteCompareRequest;
import com.greenculture.api.dto.response.RouteCompareResponse;
import com.greenculture.api.dto.response.RouteExplainResponse;
import com.greenculture.application.service.RouteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {
    private final RouteService routeService;

    @PostMapping("/compare")
    public RouteCompareResponse compare(@Valid @RequestBody RouteCompareRequest request) {
        return routeService.compareRoutes(request);
    }

    @PostMapping("/{routeAlternativeId}/explain")
    public RouteExplainResponse explain(@PathVariable Long routeAlternativeId) {
        return routeService.explainRoute(routeAlternativeId);
    }
}
