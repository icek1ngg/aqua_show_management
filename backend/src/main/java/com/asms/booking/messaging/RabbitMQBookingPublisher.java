package com.asms.booking.messaging;

import com.asms.booking.config.BookingRabbitConfig;
import com.asms.booking.dto.BookingDtos.BookingMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class RabbitMQBookingPublisher {

    private static final Logger log = LoggerFactory.getLogger(RabbitMQBookingPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public RabbitMQBookingPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishCreateBooking(BookingMessage message) {
        log.info(
                "Publishing booking message: requestId={}, holdId={}, userId={}, scheduleId={}, ticketType={}, quantity={}, exchange={}, routingKey={}",
                message.requestId(),
                message.holdId(),
                message.userId(),
                message.scheduleId(),
                message.ticketType(),
                message.quantity(),
                BookingRabbitConfig.BOOKING_EXCHANGE,
                BookingRabbitConfig.BOOKING_CREATE_ROUTING_KEY
        );
        try {
            rabbitTemplate.convertAndSend(
                    BookingRabbitConfig.BOOKING_EXCHANGE,
                    BookingRabbitConfig.BOOKING_CREATE_ROUTING_KEY,
                    message
            );
            log.info("Booking message published: requestId={}, holdId={}", message.requestId(), message.holdId());
        } catch (RuntimeException exception) {
            log.error(
                    "Failed to publish booking message: requestId={}, holdId={}, exchange={}, routingKey={}",
                    message.requestId(),
                    message.holdId(),
                    BookingRabbitConfig.BOOKING_EXCHANGE,
                    BookingRabbitConfig.BOOKING_CREATE_ROUTING_KEY,
                    exception
            );
            throw exception;
        }
    }
}
