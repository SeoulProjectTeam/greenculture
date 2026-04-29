package com.greenculture.api.controller.admin;

import com.greenculture.api.dto.response.admin.EventImportResponse;
import com.greenculture.application.service.EventImportService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/events")
@RequiredArgsConstructor
public class AdminEventController {

    private final EventImportService eventImportService;

    // Example:
    // POST /api/admin/events/import?start=1&end=200
    @PostMapping("/import")
    public EventImportResponse importPage(
            @RequestParam int start,
            @RequestParam int end
    ) {
        return eventImportService.importPages(start, end);
    }

    // Example:
    // POST /api/admin/events/import-range?pageSize=200&maxItems=1000
    @PostMapping("/import-range")
    public List<EventImportResponse> importRange(
            @RequestParam(defaultValue = "200") int pageSize,
            @RequestParam(defaultValue = "1000") int maxItems
    ) {
        return eventImportService.importRange(pageSize, maxItems);
    }
}

