package com.greenculture.api.dto.request;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BikePredictionRequest {
    private String stationId;
    private LocalDateTime targetTime;
    private Integer hourOfDay;
    private Integer dayOfWeek;
    private boolean holiday;
    private Double recentInflow1h;
    private Double recentOutflow1h;
}
