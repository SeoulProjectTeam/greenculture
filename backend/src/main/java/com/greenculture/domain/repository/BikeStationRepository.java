package com.greenculture.domain.repository;

import com.greenculture.domain.entity.BikeStation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BikeStationRepository extends JpaRepository<BikeStation, String> {
}
