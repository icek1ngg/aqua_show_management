package com.asms.payment.messaging;

import com.asms.booking.entity.Booking;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.repository.BookingRepository;
import com.asms.notification.enums.EmailNotificationStatus;
import com.asms.notification.repository.EmailNotificationRepository;
import com.asms.notification.service.EmailNotificationService;
import com.asms.payment.config.PaymentRabbitConfig;
import com.asms.ticketing.entity.Ticket;
import com.asms.ticketing.service.TicketGenerationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class PaymentCompletedConsumer {

    private static final Logger log = LoggerFactory.getLogger(PaymentCompletedConsumer.class);

    private final BookingRepository bookingRepository;
    private final TicketGenerationService ticketGenerationService;
    private final EmailNotificationService emailNotificationService;
    private final EmailNotificationRepository emailNotificationRepository;

    public PaymentCompletedConsumer(
            BookingRepository bookingRepository,
            TicketGenerationService ticketGenerationService,
            EmailNotificationService emailNotificationService,
            EmailNotificationRepository emailNotificationRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.ticketGenerationService = ticketGenerationService;
        this.emailNotificationService = emailNotificationService;
        this.emailNotificationRepository = emailNotificationRepository;
    }

    @RabbitListener(queues = PaymentRabbitConfig.PAYMENT_COMPLETED_QUEUE)
    @Transactional
    public void consumePaymentCompleted(PaymentCompletedMessage message) {
        log.info(
                "Received payment completed message: bookingId={}, paymentId={}, payosOrderCode={}",
                message.bookingId(),
                message.paymentId(),
                message.payosOrderCode()
        );

        Booking booking = bookingRepository.findById(message.bookingId())
                .orElseThrow(() -> new IllegalStateException("Booking not found for payment completed message: " + message.bookingId()));

        if (booking.getStatus() != BookingStatus.PAID) {
            log.warn(
                    "Payment completed message skipped because booking is not PAID: bookingId={}, status={}",
                    booking.getId(),
                    booking.getStatus()
            );
            return;
        }

        List<Ticket> tickets = ticketGenerationService.generateTicketsIfMissing(booking);
        if (emailNotificationRepository.existsByBooking_IdAndStatus(booking.getId(), EmailNotificationStatus.SENT)) {
            log.info("Ticket email already sent; skipping duplicate send: bookingId={}", booking.getId());
            return;
        }

        emailNotificationService.sendPaymentSuccessEmail(booking, tickets);
        log.info(
                "Post-payment processing completed: bookingId={}, tickets={}",
                booking.getId(),
                tickets.size()
        );
    }
}
