package com.asms.booking;

import com.asms.booking.entity.Booking;
import com.asms.booking.entity.BookingItem;
import com.asms.booking.enums.TicketType;
import com.asms.booking.dto.BookingDtos.CreateBookingItemRequest;
import com.asms.booking.dto.BookingDtos.CreateBookingRequest;
import com.asms.booking.repository.BookingItemRepository;
import com.asms.booking.repository.BookingRepository;
import com.asms.catalog.entity.Show;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.entity.Venue;
import com.asms.identity.entity.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BookingAggregateTest {

    @Test
    void bookingOwnsMultipleItemsAndRecalculatesTotals() {
        User user = new User("Aqua", "Visitor", "visitor@example.com", "0900000000", "hash");
        Show show = new Show("Ocean Dreams", "Water show", "image.jpg", 45);
        Venue venue = new Venue("Main Pool", "Central lagoon", 500);
        LocalDateTime start = LocalDateTime.of(2026, 7, 20, 19, 0);
        ShowSchedule standardSchedule = new ShowSchedule(show, venue, start, start.plusMinutes(45), 100, new BigDecimal("2500"));
        ShowSchedule vipSchedule = new ShowSchedule(show, venue, start.plusDays(1), start.plusDays(1).plusMinutes(45), 50, new BigDecimal("2500"));

        Booking booking = Booking.create(user, "AQB20260713ABC123", Instant.parse("2026-07-20T12:00:00Z"));
        booking.addItem(BookingItem.create(booking, standardSchedule, TicketType.STANDARD, 2, new BigDecimal("2500"), "hold-1"));
        booking.addItem(BookingItem.create(booking, vipSchedule, TicketType.VIP, 1, new BigDecimal("6250"), "hold-2"));

        assertThat(booking.getTotalQuantity()).isEqualTo(3);
        assertThat(booking.getTotalAmount()).isEqualByComparingTo("11250.00");
        assertThat(booking.getItems()).hasSize(2);
    }

    @Test
    void createBookingRequestUsesAnIdempotencyKeyAndItemList() {
        CreateBookingRequest request = new CreateBookingRequest(
                "checkout-123",
                List.of(
                        new CreateBookingItemRequest("schedule-1", "STANDARD", 2),
                        new CreateBookingItemRequest("schedule-2", "VIP", 1)
                )
        );

        assertThat(request.idempotencyKey()).isEqualTo("checkout-123");
        assertThat(request.items()).hasSize(2);
    }

    @Test
    void repositoriesExposeItemInventoryAndIdempotencyQueries() throws Exception {
        assertThat(BookingItemRepository.class.getMethod("countPaidTicketsByScheduleId", String.class)).isNotNull();
        assertThat(BookingItemRepository.class.getMethod(
                "countPaidTicketsByScheduleIdAndTicketType",
                String.class,
                TicketType.class
        )).isNotNull();
        assertThat(BookingRepository.class.getMethod("findByIdempotencyKey", String.class)).isNotNull();
        assertThat(Booking.class.getDeclaredField("idempotencyKey")).isNotNull();
    }

}
