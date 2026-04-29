package com.greenculture.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class RoutePlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String originName;
    private Double originLat;
    private Double originLng;

    private String destinationName;
    private Double destinationLat;
    private Double destinationLng;

    private LocalDateTime departureTime;
    private LocalDate requestDate;
}
