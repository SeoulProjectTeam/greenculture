package com.greenculture.api.controller;

import com.greenculture.api.dto.response.EventResponse;
import com.greenculture.application.service.EventService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;

    @GetMapping("/recommend")
    public List<EventResponse> recommend(
            @RequestParam LocalDate date,
            @RequestParam String interest
    ) {
        return eventService.recommend(date, interest);
    }
}
