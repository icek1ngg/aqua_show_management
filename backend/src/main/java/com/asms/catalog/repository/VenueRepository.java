package com.asms.catalog.repository;

import com.asms.catalog.entity.Venue;
import com.asms.catalog.enums.VenueStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface VenueRepository extends JpaRepository<Venue, UUID> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

    Optional<Venue> findByIdAndStatus(UUID id, VenueStatus status);

    @Query("""
            select v from Venue v
            where (:status is null or v.status = :status)
              and (coalesce(:keyword, '') = '' or lower(v.name) like lower(concat('%', :keyword, '%'))
                   or lower(v.location) like lower(concat('%', :keyword, '%')))
            order by v.createdAt desc
            """)
    Page<Venue> search(@Param("keyword") String keyword, @Param("status") VenueStatus status, Pageable pageable);
}
