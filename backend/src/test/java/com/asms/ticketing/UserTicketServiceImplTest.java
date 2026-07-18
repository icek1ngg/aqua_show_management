package com.asms.ticketing;

import com.asms.booking.entity.Booking;
import com.asms.identity.entity.User;
import com.asms.ticketing.dto.MyTicketDtos.PageMyTicketResponse;
import com.asms.ticketing.entity.Ticket;
import com.asms.ticketing.enums.TicketStatus;
import com.asms.ticketing.repository.TicketRepository;
import com.asms.ticketing.service.impl.UserTicketServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserTicketServiceImplTest {
    @Test
    void returnsOnlyRepositoryScopedTicketsWithFiltersAndPagination() throws Exception {
        TicketRepository repository = mock(TicketRepository.class);
        User user = new User("A", "User", "user@example.com", "0900000000", "hash");
        Booking booking = Booking.create();
        booking.setUser(user);
        booking.setBookingCode("AQB-001");
        booking.setShowId("show");
        booking.setScheduleId("schedule");
        booking.setShowName("Ocean Show");
        booking.setShowDate(LocalDate.now().plusDays(1));
        booking.setTicketType("STANDARD");
        booking.setQuantity(1);
        booking.setUnitPrice(java.math.BigDecimal.valueOf(2000));
        booking.setExpiresAt(Instant.now().plusSeconds(600));
        Field id = Booking.class.getDeclaredField("id");
        id.setAccessible(true);
        id.set(booking, UUID.randomUUID());
        Ticket ticket = new Ticket(booking, "qr-value");
        PageRequest pageable = PageRequest.of(0, 12);
        when(repository.searchMyTickets(user, null, TicketStatus.VALID, "ocean", pageable))
                .thenReturn(new PageImpl<>(List.of(ticket), pageable, 1));

        PageMyTicketResponse response = new UserTicketServiceImpl(repository)
                .getMyTickets(user, 0, 12, " ocean ", "valid", null);

        assertThat(response.items()).hasSize(1);
        assertThat(response.items().getFirst().bookingId()).isEqualTo(booking.getId());
        assertThat(response.items().getFirst().bookingCode()).isEqualTo("AQB-001");
        assertThat(response.totalItems()).isEqualTo(1);
        verify(repository).searchMyTickets(eq(user), eq(null), eq(TicketStatus.VALID), eq("ocean"), eq(pageable));
    }
}
