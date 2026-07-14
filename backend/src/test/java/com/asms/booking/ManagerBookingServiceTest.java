package com.asms.booking;

import com.asms.booking.entity.Booking;
import com.asms.booking.entity.BookingItem;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.enums.TicketType;
import com.asms.booking.repository.BookingRepository;
import com.asms.booking.service.ManagerBookingService;
import com.asms.catalog.entity.Show;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.entity.Venue;
import com.asms.identity.entity.User;
import com.asms.payment.repository.PaymentRepository;
import com.asms.ticketing.repository.TicketRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ManagerBookingServiceTest {

    @Test
    void detailContainsEveryBookingItemAndAggregateTotals() {
        BookingRepository bookingRepository = mock(BookingRepository.class);
        PaymentRepository paymentRepository = mock(PaymentRepository.class);
        TicketRepository ticketRepository = mock(TicketRepository.class);
        ManagerBookingService service = new ManagerBookingService(bookingRepository, paymentRepository, ticketRepository);
        Booking booking = multiItemBooking();
        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(paymentRepository.findByBooking_Id(booking.getId())).thenReturn(Optional.empty());
        when(ticketRepository.findByBooking_Id(booking.getId())).thenReturn(List.of());

        var detail = service.getBooking(booking.getId());

        assertThat(detail.booking().items()).hasSize(2);
        assertThat(detail.booking().totalQuantity()).isEqualTo(3);
        assertThat(detail.booking().totalAmount()).isEqualByComparingTo("11250");
        assertThat(detail.booking().items()).extracting(item -> item.ticketType().name())
                .containsExactly("STANDARD", "VIP");
    }

    @Test
    void managerFiltersArePassedForBookingItemShowAndSchedule() {
        BookingRepository bookingRepository = mock(BookingRepository.class);
        PaymentRepository paymentRepository = mock(PaymentRepository.class);
        TicketRepository ticketRepository = mock(TicketRepository.class);
        ManagerBookingService service = new ManagerBookingService(bookingRepository, paymentRepository, ticketRepository);
        when(bookingRepository.searchForManager(any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of()));

        service.getBookings(" show-2 ", " schedule-2 ", BookingStatus.PAID, null, null, 0, 10);

        ArgumentCaptor<String> showCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> scheduleCaptor = ArgumentCaptor.forClass(String.class);
        verify(bookingRepository).searchForManager(
                showCaptor.capture(), scheduleCaptor.capture(), any(), any(), any(), any(Pageable.class)
        );
        assertThat(showCaptor.getValue()).isEqualTo("show-2");
        assertThat(scheduleCaptor.getValue()).isEqualTo("schedule-2");
    }

    private Booking multiItemBooking() {
        User user = new User("Test", "Manager", "manager-test@example.com", "0900000003", "hash");
        Show firstShow = new Show("Ocean Lights", "Water show", "first.jpg", 45);
        Show secondShow = new Show("Aqua Parade", "Water show", "second.jpg", 45);
        Venue venue = new Venue("Main Pool", "Central lagoon", 500);
        LocalDateTime start = LocalDateTime.now().plusDays(2);
        ShowSchedule first = new ShowSchedule(firstShow, venue, start, start.plusMinutes(45), 10, 0, 0, new BigDecimal("2500"));
        ShowSchedule second = new ShowSchedule(secondShow, venue, start.plusDays(1), start.plusDays(1).plusMinutes(45), 0, 5, 0, new BigDecimal("2500"));
        Booking booking = Booking.create(user, "AQB-MANAGER-MULTI", Instant.now().plusSeconds(900));
        booking.addItem(BookingItem.create(booking, first, TicketType.STANDARD, 2, new BigDecimal("2500"), "hold-one"));
        booking.addItem(BookingItem.create(booking, second, TicketType.VIP, 1, new BigDecimal("6250"), "hold-two"));
        return booking;
    }
}
