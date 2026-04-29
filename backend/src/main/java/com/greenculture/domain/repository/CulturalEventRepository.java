package com.greenculture.domain.repository;

import com.greenculture.domain.entity.CulturalEvent;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CulturalEventRepository extends JpaRepository<CulturalEvent, Long> {
    List<CulturalEvent> findByEventDateAndCategoryContaining(LocalDate eventDate, String category);
}
