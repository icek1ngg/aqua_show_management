package com.asms.core.config;

import com.asms.booking.entity.Booking;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.repository.BookingRepository;
import com.asms.catalog.entity.Show;
import com.asms.catalog.entity.ShowSchedule;
import com.asms.catalog.entity.Venue;
import com.asms.catalog.repository.ShowRepository;
import com.asms.catalog.repository.ShowScheduleRepository;
import com.asms.catalog.repository.VenueRepository;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserRole;
import com.asms.identity.repository.UserRepository;
import com.asms.payment.entity.Payment;
import com.asms.payment.enums.PaymentStatus;
import com.asms.payment.repository.PaymentRepository;
import com.asms.ticketing.entity.Ticket;
import com.asms.ticketing.enums.TicketStatus;
import com.asms.ticketing.repository.TicketRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Configuration
public class DevDataSeeder {

    private static final String USER_EMAIL = "visitor@asms.test";
    private static final String STAFF_EMAIL = "staff@asms.test";
    private static final String MANAGER_EMAIL = "manager@asms.test";
    private static final String ADMIN_EMAIL = "admin@asms.test";
    private static final String PASSWORD = "Password123";

    @Bean
    CommandLineRunner seedUcPaymentAndTicketData(DevSeedService devSeedService) {
        return (args) -> devSeedService.seed();
    }

    @Configuration
    static class DevSeedService {

        private final UserRepository userRepository;
        private final BookingRepository bookingRepository;
        private final PaymentRepository paymentRepository;
        private final TicketRepository ticketRepository;
        private final ShowRepository showRepository;
        private final VenueRepository venueRepository;
        private final ShowScheduleRepository scheduleRepository;
        private final PasswordEncoder passwordEncoder;

        DevSeedService(
                UserRepository userRepository,
                BookingRepository bookingRepository,
                PaymentRepository paymentRepository,
                TicketRepository ticketRepository,
                ShowRepository showRepository,
                VenueRepository venueRepository,
                ShowScheduleRepository scheduleRepository,
                PasswordEncoder passwordEncoder
        ) {
            this.userRepository = userRepository;
            this.bookingRepository = bookingRepository;
            this.paymentRepository = paymentRepository;
            this.ticketRepository = ticketRepository;
            this.showRepository = showRepository;
            this.venueRepository = venueRepository;
            this.scheduleRepository = scheduleRepository;
            this.passwordEncoder = passwordEncoder;
        }

        @Transactional
        public void seed() {
            User visitor = userRepository.findByEmailIgnoreCase(USER_EMAIL)
                    .orElseGet(() -> userRepository.save(new User("Demo", "Visitor", USER_EMAIL, "0900000001", passwordEncoder.encode(PASSWORD))));

            userRepository.findByEmailIgnoreCase(STAFF_EMAIL)
                    .orElseGet(() -> {
                        User staff = new User("Demo", "Staff", STAFF_EMAIL, "0900000002", passwordEncoder.encode(PASSWORD));
                        staff.setRole(UserRole.STAFF);
                        return userRepository.save(staff);
                    });

            userRepository.findByEmailIgnoreCase(MANAGER_EMAIL)
                    .orElseGet(() -> {
                        User manager = new User("Demo", "Manager", MANAGER_EMAIL, "0900000003", passwordEncoder.encode(PASSWORD));
                        manager.setRole(UserRole.MANAGER);
                        return userRepository.save(manager);
                    });

            userRepository.findByEmailIgnoreCase(ADMIN_EMAIL)
                    .orElseGet(() -> {
                        User admin = new User("Demo", "Admin", ADMIN_EMAIL, "0900000004", passwordEncoder.encode(PASSWORD));
                        admin.setRole(UserRole.ADMIN);
                        return userRepository.save(admin);
                    });

            seedCatalog();
            seedPendingBooking(visitor);
            seedPaidBookingWithTickets(visitor);
        }

        private void seedCatalog() {
            if (showRepository.existsByTitleIgnoreCase("Midnight Aqua Symphony")) {
                return;
            }

            Show show = showRepository.save(new Show(
                    "Midnight Aqua Symphony",
                    "A luminous water, light, and music performance designed for families and evening visitors.",
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
                    45
            ));
            Venue venue = venueRepository.save(new Venue("Main Plaza Pool", "Central lagoon", 500));
            scheduleRepository.save(new ShowSchedule(
                    show,
                    venue,
                    LocalDateTime.now().plusDays(7).withHour(19).withMinute(30).withSecond(0).withNano(0),
                    LocalDateTime.now().plusDays(7).withHour(20).withMinute(15).withSecond(0).withNano(0),
                    300,
                    new BigDecimal("45.00")
            ));
        }

        private void seedPendingBooking(User visitor) {
            boolean hasPending = bookingRepository.findByUserOrderByCreatedAtDesc(visitor)
                    .stream()
                    .anyMatch((booking) -> booking.getStatus() == BookingStatus.PENDING_PAYMENT);

            if (hasPending) {
                return;
            }

            Booking booking = baseBooking(visitor, "ASMS-DEMO-HOLD-PENDING", 2, "STANDARD", new BigDecimal("45.00"));
            booking.setStatus(BookingStatus.PENDING_PAYMENT);
            booking.setExpiresAt(Instant.now().plus(30, ChronoUnit.MINUTES));
            bookingRepository.save(booking);
        }

        private void seedPaidBookingWithTickets(User visitor) {
            if (ticketRepository.findByQrCode("ASMS:DEMO:VALID").isPresent()) {
                return;
            }

            Booking paidBooking = baseBooking(visitor, "ASMS-DEMO-HOLD-PAID", 4, "STANDARD", new BigDecimal("45.00"));
            paidBooking.setStatus(BookingStatus.PAID);
            paidBooking.setExpiresAt(Instant.now().plus(30, ChronoUnit.MINUTES));
            Booking savedBooking = bookingRepository.save(paidBooking);

            Payment payment = new Payment(
                    savedBooking,
                    String.valueOf(880000000000L + Math.abs(savedBooking.getId().hashCode())),
                    savedBooking.getTotalAmount(),
                    "http://localhost:5173/payments/result?bookingId=" + savedBooking.getId()
            );
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaidAt(Instant.now());
            paymentRepository.save(payment);

            Ticket validTicket = new Ticket(savedBooking, "ASMS:DEMO:VALID");
            Ticket validTicketTwo = new Ticket(savedBooking, "ASMS:DEMO:VALID2");

            Ticket usedTicket = new Ticket(savedBooking, "ASMS:DEMO:USED");
            usedTicket.setStatus(TicketStatus.USED);
            usedTicket.setUsedAt(Instant.now().minus(1, ChronoUnit.HOURS));

            Ticket expiredTicket = new Ticket(savedBooking, "ASMS:DEMO:EXPIRED");
            expiredTicket.setStatus(TicketStatus.EXPIRED);

            ticketRepository.saveAll(List.of(validTicket, validTicketTwo, usedTicket, expiredTicket));
        }

        private Booking baseBooking(User visitor, String holdId, int quantity, String ticketType, BigDecimal unitPrice) {
            Booking booking = Booking.create();
            booking.setUser(visitor);
            booking.setBookingCode("AQB" + Math.abs(holdId.hashCode()));
            booking.setHoldId(holdId);
            booking.setShowId("SHOW-DEMO-AQUA");
            booking.setScheduleId("SCHEDULE-DEMO-AQUA");
            booking.setShowName("Midnight Aqua Symphony");
            booking.setShowDate(LocalDate.now().plusDays(7));
            booking.setTicketType(ticketType);
            booking.setQuantity(quantity);
            booking.setUnitPrice(unitPrice);
            booking.setTotalAmount(unitPrice.multiply(BigDecimal.valueOf(quantity)));
            return booking;
        }
    }
}
