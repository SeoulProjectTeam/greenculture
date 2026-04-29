package com.greenculture.application.service;

import com.greenculture.api.dto.request.BikePredictionRequest;
import com.greenculture.api.dto.response.ReturnAvailabilityResponse;
import com.greenculture.infrastructure.client.BikePredictionClient;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BikePredictionService {
    private final BikePredictionClient bikePredictionClient;

    public ReturnAvailabilityResponse predictReturnAvailability(String stationId, LocalDateTime dateTime) {
        BikePredictionRequest req = new BikePredictionRequest();
        req.setStationId(stationId);
        req.setTargetTime(dateTime);
        req.setHourOfDay(dateTime.getHour());
        req.setDayOfWeek(dateTime.getDayOfWeek().getValue());
        req.setHoliday(false);
        req.setRecentInflow1h(12.0);
        req.setRecentOutflow1h(9.0);
        return bikePredictionClient.predict(req);
    }
}
