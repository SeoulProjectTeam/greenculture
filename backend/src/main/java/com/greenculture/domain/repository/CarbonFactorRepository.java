package com.greenculture.domain.repository;

import com.greenculture.domain.entity.CarbonFactor;
import com.greenculture.domain.enums.TransportMode;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CarbonFactorRepository extends JpaRepository<CarbonFactor, Long> {
    Optional<CarbonFactor> findByMode(TransportMode mode);
}
