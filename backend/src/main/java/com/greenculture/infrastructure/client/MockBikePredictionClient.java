package com.greenculture.infrastructure.client;

import com.greenculture.api.dto.request.BikePredictionRequest;
import com.greenculture.api.dto.response.ReturnAvailabilityResponse;
import com.greenculture.domain.enums.AvailabilityLevel;
import java.time.LocalDateTime;
import org.springframework.stereotype.Component;

@Component
public class MockBikePredictionClient implements BikePredictionClient {

    @Override
    public ReturnAvailabilityResponse predict(BikePredictionRequest request) {
        // Simple baseline scoring with recent inflow/outflow.
        double inflow = request.getRecentInflow1h() == null ? 0.0 : request.getRecentInflow1h();
        double outflow = request.getRecentOutflow1h() == null ? 0.0 : request.getRecentOutflow1h();
        double rawScore = 0.5 + (inflow - outflow) * 0.03;
        double score = Math.max(0.0, Math.min(1.0, rawScore));

        AvailabilityLevel level;
        if (score >= 0.7) {
            level = AvailabilityLevel.HIGH;
        } else if (score >= 0.4) {
            level = AvailabilityLevel.MEDIUM;
        } else {
            level = AvailabilityLevel.LOW;
        }

        LocalDateTime target = request.getTargetTime();
        return new ReturnAvailabilityResponse(request.getStationId(), target, level, score);
    }
}
