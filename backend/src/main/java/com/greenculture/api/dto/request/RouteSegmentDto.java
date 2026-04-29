package com.greenculture.api.dto.request;

import com.greenculture.domain.enums.TransportMode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RouteSegmentDto {
    private TransportMode mode;
    private double distanceKm;
}
