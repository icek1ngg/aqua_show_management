package com.asms.ticketing;

import com.asms.booking.entity.Booking;
import com.asms.booking.entity.BookingItem;
import com.asms.booking.enums.TicketType;
import com.asms.catalog.entity.Show;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.entity.Venue;
import com.asms.identity.entity.User;
import com.asms.ticketing.entity.Ticket;
import com.asms.ticketing.repository.TicketRepository;
import com.asms.ticketing.service.impl.TicketGenerationServiceImpl;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MultiItemTicketGenerationTest {

    @Test
    void generatesOneTicketPerSeatWithItsBookingItemSnapshot() {
        TicketRepository repository = mock(TicketRepository.class);
        when(repository.existsByBooking_Id(org.mockito.ArgumentMatchers.any())).thenReturn(false);
        when(repository.saveAll(org.mockito.ArgumentMatchers.anyList()))
                .thenAnswer(invocation -> invocation.getArgument(0));
        TicketGenerationServiceImpl service = new TicketGenerationServiceImpl(repository);

        Show show = new Show("Ocean Dreams", "Water show", "image.jpg", 45);
        Venue venue = new Venue("Main Pool", "Central lagoon", 500);
        LocalDateTime start = LocalDateTime.now().plusDays(2);
        ShowSchedule standardSchedule = new ShowSchedule(
                show, venue, start, start.plusMinutes(45), 10, 0, 0, new BigDecimal("2500")
        );
        ShowSchedule vipSchedule = new ShowSchedule(
                show, venue, start.plusDays(1), start.plusDays(1).plusMinutes(45), 0, 5, 0, new BigDecimal("2500")
        );
        Booking booking = Booking.create(new User("Test", "User", "tickets@example.com", "0900000002", "hash"),
                "AQB-TICKETS", Instant.now().plusSeconds(900));
        BookingItem standard = BookingItem.create(booking, standardSchedule, TicketType.STANDARD, 2,
                new BigDecimal("2500"), "hold-standard");
        BookingItem vip = BookingItem.create(booking, vipSchedule, TicketType.VIP, 1,
                new BigDecimal("6250"), "hold-vip");
        booking.addItem(standard);
        booking.addItem(vip);

        List<Ticket> result = service.generateTicketsIfMissing(booking);

        assertThat(result).hasSize(3);
        assertThat(result).extracting(Ticket::getBookingItem)
                .containsExactly(standard, standard, vip);
        assertThat(result).extracting(Ticket::getScheduleId)
                .containsExactly(standard.getScheduleId(), standard.getScheduleId(), vip.getScheduleId());
        assertThat(result).extracting(Ticket::getTicketType)
                .containsExactly(TicketType.STANDARD, TicketType.STANDARD, TicketType.VIP);
        assertThat(result).extracting(Ticket::getQrCode).doesNotHaveDuplicates();

        ArgumentCaptor<List<Ticket>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(3);
    }
}
