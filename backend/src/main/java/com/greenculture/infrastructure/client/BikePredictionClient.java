package com.greenculture.infrastructure.client;

import com.greenculture.api.dto.request.BikePredictionRequest;
import com.greenculture.api.dto.response.ReturnAvailabilityResponse;

public interface BikePredictionClient {
    ReturnAvailabilityResponse predict(BikePredictionRequest request);
}
