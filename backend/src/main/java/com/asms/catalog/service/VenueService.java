package com.asms.catalog.service;

import com.asms.catalog.dto.CatalogDtos.CreateVenueRequest;
import com.asms.catalog.dto.CatalogDtos.UpdateVenueRequest;
import com.asms.catalog.dto.CatalogDtos.VenueResponse;
import com.asms.catalog.entity.Venue;
import com.asms.catalog.enums.VenueStatus;
import com.asms.catalog.repository.VenueRepository;
import com.asms.core.exception.ConflictException;
import com.asms.core.exception.NotFoundException;
import com.asms.core.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class VenueService {

    private final VenueRepository venueRepository;

    public VenueService(VenueRepository venueRepository) {
        this.venueRepository = venueRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<VenueResponse> getVenues(String keyword, VenueStatus status, int page, int size) {
        Page<Venue> venues = venueRepository.search(normalizeKeyword(keyword), status, PageRequest.of(Math.max(page, 0), sanitizeSize(size)));
        return PageResponse.from(venues, venues.getContent().stream().map(CatalogMapper::toVenue).toList());
    }

    @Transactional(readOnly = true)
    public VenueResponse getVenue(UUID id) {
        return venueRepository.findById(id)
                .map(CatalogMapper::toVenue)
                .orElseThrow(() -> new NotFoundException("Venue not found"));
    }

    @Transactional
    public VenueResponse createVenue(CreateVenueRequest request) {
        String name = requireUniqueName(request.name(), null);
        return CatalogMapper.toVenue(venueRepository.save(new Venue(name, request.location().trim(), request.capacity())));
    }

    @Transactional
    public VenueResponse updateVenue(UUID id, UpdateVenueRequest request) {
        Venue venue = venueRepository.findById(id).orElseThrow(() -> new NotFoundException("Venue not found"));
        if (request.name() != null && !request.name().isBlank()) {
            venue.setName(requireUniqueName(request.name(), venue.getId()));
        }
        if (request.location() != null && !request.location().isBlank()) {
            venue.setLocation(request.location().trim());
        }
        if (request.capacity() != null) {
            venue.setCapacity(request.capacity());
        }
        if (request.status() != null) {
            venue.setStatus(request.status());
        }
        return CatalogMapper.toVenue(venue);
    }

    @Transactional
    public void activateVenue(UUID id) {
        setStatus(id, VenueStatus.ACTIVE);
    }

    @Transactional
    public void deactivateVenue(UUID id) {
        setStatus(id, VenueStatus.INACTIVE);
    }

    private void setStatus(UUID id, VenueStatus status) {
        Venue venue = venueRepository.findById(id).orElseThrow(() -> new NotFoundException("Venue not found"));
        venue.setStatus(status);
    }

    private String requireUniqueName(String name, UUID currentId) {
        String normalized = name.trim();
        boolean exists = currentId == null
                ? venueRepository.existsByNameIgnoreCase(normalized)
                : venueRepository.existsByNameIgnoreCaseAndIdNot(normalized, currentId);
        if (exists) {
            throw new ConflictException("Venue name already exists");
        }
        return normalized;
    }

    private String normalizeKeyword(String keyword) {
        return keyword == null || keyword.isBlank() ? null : keyword.trim();
    }

    private int sanitizeSize(int size) {
        if (size <= 0) {
            return 10;
        }
        return Math.min(size, 100);
    }
}
