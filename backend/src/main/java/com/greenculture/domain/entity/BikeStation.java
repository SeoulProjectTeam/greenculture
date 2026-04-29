package com.greenculture.domain.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class BikeStation {
    @Id
    private String stationId;

    private String stationName;
    private Double latitude;
    private Double longitude;
    private Integer totalRacks;
}
