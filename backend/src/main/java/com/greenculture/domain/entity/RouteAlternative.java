package com.greenculture.domain.entity;

import com.greenculture.domain.enums.RouteType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class RouteAlternative {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private RoutePlan routePlan;

    @Enumerated(EnumType.STRING)
    private RouteType routeType;

    private Integer durationMinutes;
    private Integer transferCount;
    private Double distanceKm;
    private Double carbonKg;
    private Boolean includesBike;
}
