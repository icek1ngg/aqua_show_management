package com.asms.ticketing.service.impl;

import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.UnauthorizedException;
import com.asms.booking.entity.Booking;
import com.asms.identity.entity.User;
import com.asms.ticketing.dto.MyTicketDtos.MyTicketResponse;
import com.asms.ticketing.dto.MyTicketDtos.PageMyTicketResponse;
import com.asms.ticketing.entity.Ticket;
import com.asms.ticketing.enums.TicketStatus;
import com.asms.ticketing.repository.TicketRepository;
import com.asms.ticketing.service.UserTicketService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class UserTicketServiceImpl implements UserTicketService {
    private final TicketRepository ticketRepository;

    public UserTicketServiceImpl(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PageMyTicketResponse getMyTickets(
            User user, int page, int size, String keyword, String status, UUID bookingId) {
        if (user == null) throw new UnauthorizedException("Authentication required");
        int safePage = Math.max(0, page);
        int safeSize = size <= 0 ? 12 : Math.min(size, 50);
        String normalizedKeyword = keyword == null || keyword.isBlank() ? null : keyword.trim();
        TicketStatus normalizedStatus = parseStatus(status);
        Specification<Ticket> filters = buildFilters(user, bookingId, normalizedStatus, normalizedKeyword);
        PageRequest pageRequest = PageRequest.of(
                safePage,
                safeSize,
                Sort.by(Sort.Direction.DESC, "showStartTime")
                        .and(Sort.by(Sort.Direction.DESC, "issuedAt")));
        Page<Ticket> result = ticketRepository.findAll(filters, pageRequest);
        return new PageMyTicketResponse(
                result.getContent().stream().map(this::toResponse).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(),
                result.hasNext(), result.hasPrevious());
    }

    private Specification<Ticket> buildFilters(
            User user, UUID bookingId, TicketStatus status, String keyword) {
        return (root, query, criteriaBuilder) -> {
            Join<Ticket, Booking> booking = root.join("booking");
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.equal(booking.get("user"), user));

            if (bookingId != null) {
                predicates.add(criteriaBuilder.equal(booking.get("id"), bookingId));
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (keyword != null) {
                String pattern = "%" + keyword.toLowerCase(Locale.ROOT) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(booking.get("bookingCode")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("showName")), pattern)));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private TicketStatus parseStatus(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) return null;
        try {
            return TicketStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unknown ticket status");
        }
    }

    private MyTicketResponse toResponse(Ticket ticket) {
        return new MyTicketResponse(
                ticket.getId(), ticket.getBooking().getId(), ticket.getBooking().getBookingCode(),
                ticket.getBookingItem() == null ? null : ticket.getBookingItem().getId(),
                ticket.getQrCode(), ticket.getStatus(), ticket.getShowName(), ticket.getVenueName(),
                ticket.getScheduleId(), ticket.getTicketType(),
                ticket.getBookingItem() == null ? null : ticket.getBookingItem().getPassengerType(),
                ticket.getShowStartTime(),
                ticket.getShowEndTime(), ticket.getIssuedAt(), ticket.getUsedAt());
    }
}
