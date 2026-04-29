package com.greenculture.api.dto.response.admin;

public record EventImportResponse(
        int start,
        int end,
        int inserted,
        int updated,
        int skipped,
        Integer listTotalCount
) {
}

