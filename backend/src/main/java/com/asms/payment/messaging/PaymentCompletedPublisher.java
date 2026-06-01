package com.asms.payment.messaging;

import com.asms.payment.config.PaymentRabbitConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class PaymentCompletedPublisher {

    private static final Logger log = LoggerFactory.getLogger(PaymentCompletedPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public PaymentCompletedPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publish(PaymentCompletedMessage message) {
        log.info(
                "Publishing payment completed message: bookingId={}, paymentId={}, payosOrderCode={}, exchange={}, routingKey={}",
                message.bookingId(),
                message.paymentId(),
                message.payosOrderCode(),
                PaymentRabbitConfig.PAYMENT_EXCHANGE,
                PaymentRabbitConfig.PAYMENT_COMPLETED_ROUTING_KEY
        );
        rabbitTemplate.convertAndSend(
                PaymentRabbitConfig.PAYMENT_EXCHANGE,
                PaymentRabbitConfig.PAYMENT_COMPLETED_ROUTING_KEY,
                message
        );
    }
}
