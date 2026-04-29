package com.greenculture.api.dto.request;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CarbonCalculateRequest {
    private List<RouteSegmentDto> segments;
    private double totalDistanceKm;
}
