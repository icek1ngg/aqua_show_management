package com.asms.catalog.service;

import com.asms.catalog.dto.CatalogDtos.CreateShowRequest;
import com.asms.catalog.dto.CatalogDtos.ShowManagementResponse;
import com.asms.catalog.dto.CatalogDtos.UpdateShowRequest;
import com.asms.catalog.entity.Show;
import com.asms.catalog.enums.ShowStatus;
import com.asms.catalog.repository.ShowRepository;
import com.asms.core.exception.ConflictException;
import com.asms.core.exception.NotFoundException;
import com.asms.core.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ShowService {

    private final ShowRepository showRepository;
    private final CatalogCacheService cacheService;

    public ShowService(ShowRepository showRepository, CatalogCacheService cacheService) {
        this.showRepository = showRepository;
        this.cacheService = cacheService;
    }

    @Transactional(readOnly = true)
    public PageResponse<ShowManagementResponse> getShows(String keyword, ShowStatus status, int page, int size) {
        String normalizedKeyword = normalizeKeyword(keyword);
        PageRequest pageRequest = PageRequest.of(Math.max(page, 0), sanitizeSize(size), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Show> shows;
        if (normalizedKeyword != null) {
            shows = showRepository.searchByKeyword(normalizedKeyword, status, pageRequest);
        } else if (status != null) {
            shows = showRepository.findByStatusOrderByCreatedAtDesc(status, pageRequest);
        } else {
            shows = showRepository.findAll(pageRequest);
        }
        return PageResponse.from(shows, shows.getContent().stream().map(CatalogMapper::toShowManagement).toList());
    }

    @Transactional(readOnly = true)
    public ShowManagementResponse getShow(UUID id) {
        return showRepository.findById(id)
                .map(CatalogMapper::toShowManagement)
                .orElseThrow(() -> new NotFoundException("Show not found"));
    }

    @Transactional
    public ShowManagementResponse createShow(CreateShowRequest request) {
        String title = requireUniqueTitle(request.title(), null);
        Show show = new Show(title, request.description().trim(), normalizeNullable(request.imageUrl()), request.durationMinutes());
        Show savedShow = showRepository.save(show);
        cacheService.invalidateShowCache(savedShow.getId());
        return CatalogMapper.toShowManagement(savedShow);
    }

    @Transactional
    public ShowManagementResponse updateShow(UUID id, UpdateShowRequest request) {
        Show show = showRepository.findById(id).orElseThrow(() -> new NotFoundException("Show not found"));
        if (request.title() != null && !request.title().isBlank()) {
            show.setTitle(requireUniqueTitle(request.title(), show.getId()));
        }
        if (request.description() != null && !request.description().isBlank()) {
            show.setDescription(request.description().trim());
        }
        if (request.imageUrl() != null) {
            show.setImageUrl(normalizeNullable(request.imageUrl()));
        }
        if (request.durationMinutes() != null) {
            show.setDurationMinutes(request.durationMinutes());
        }
        if (request.status() != null) {
            show.setStatus(request.status());
        }
        cacheService.invalidateShowCache(show.getId());
        return CatalogMapper.toShowManagement(show);
    }

    @Transactional
    public void activateShow(UUID id) {
        setStatus(id, ShowStatus.ACTIVE);
    }

    @Transactional
    public void deactivateShow(UUID id) {
        setStatus(id, ShowStatus.INACTIVE);
    }

    private void setStatus(UUID id, ShowStatus status) {
        Show show = showRepository.findById(id).orElseThrow(() -> new NotFoundException("Show not found"));
        show.setStatus(status);
        cacheService.invalidateShowCache(show.getId());
    }

    private String requireUniqueTitle(String title, UUID currentId) {
        String normalized = title.trim();
        boolean exists = currentId == null
                ? showRepository.existsByTitleIgnoreCase(normalized)
                : showRepository.existsByTitleIgnoreCaseAndIdNot(normalized, currentId);
        if (exists) {
            throw new ConflictException("Show title already exists");
        }
        return normalized;
    }

    private String normalizeKeyword(String keyword) {
        return keyword == null || keyword.isBlank() ? null : keyword.trim();
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private int sanitizeSize(int size) {
        if (size <= 0) {
            return 10;
        }
        return Math.min(size, 100);
    }
}
