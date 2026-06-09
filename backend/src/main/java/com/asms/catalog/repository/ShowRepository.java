package com.asms.catalog.repository;

import com.asms.catalog.entity.Show;
import com.asms.catalog.enums.ShowStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ShowRepository extends JpaRepository<Show, UUID> {

    boolean existsByTitleIgnoreCase(String title);

    boolean existsByTitleIgnoreCaseAndIdNot(String title, UUID id);

    Optional<Show> findByIdAndStatus(UUID id, ShowStatus status);

    Page<Show> findByStatusOrderByCreatedAtDesc(ShowStatus status, Pageable pageable);

    @Query("""
            select s from Show s
            where (:status is null or s.status = :status)
              and (lower(s.title) like lower(concat('%', :keyword, '%'))
                   or lower(s.description) like lower(concat('%', :keyword, '%')))
            order by s.createdAt desc
            """)
    Page<Show> searchByKeyword(@Param("keyword") String keyword, @Param("status") ShowStatus status, Pageable pageable);
}
