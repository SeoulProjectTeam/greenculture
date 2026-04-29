package com.greenculture.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RouteCompareRequest {
    @NotBlank
    private String originName;
    @NotNull
    private Double originLat;
    @NotNull
    private Double originLng;

    @NotBlank
    private String destinationName;
    @NotNull
    private Double destinationLat;
    @NotNull
    private Double destinationLng;

    @NotNull
    private LocalDateTime departureTime;
}
