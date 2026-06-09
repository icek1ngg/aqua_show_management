package com.asms.catalog.repository;

import com.asms.catalog.entity.Venue;
import com.asms.catalog.enums.VenueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface VenueRepository extends JpaRepository<Venue, UUID>, JpaSpecificationExecutor<Venue> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

    Optional<Venue> findByIdAndStatus(UUID id, VenueStatus status);

}
