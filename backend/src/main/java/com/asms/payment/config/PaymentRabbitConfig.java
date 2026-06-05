package com.asms.payment.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PaymentRabbitConfig {

    public static final String PAYMENT_EXCHANGE = "asms.payment.exchange";
    public static final String PAYMENT_COMPLETED_QUEUE = "asms.payment.completed.queue";
    public static final String PAYMENT_COMPLETED_ROUTING_KEY = "payment.completed";

    @Bean("paymentExchange")
    public TopicExchange paymentExchange() {
        return new TopicExchange(PAYMENT_EXCHANGE, true, false);
    }

    @Bean("paymentCompletedQueue")
    public Queue paymentCompletedQueue() {
        return new Queue(PAYMENT_COMPLETED_QUEUE, true);
    }

    @Bean("paymentCompletedBinding")
    public Binding paymentCompletedBinding(
            @Qualifier("paymentCompletedQueue") Queue paymentCompletedQueue,
            @Qualifier("paymentExchange") TopicExchange paymentExchange
    ) {
        return BindingBuilder.bind(paymentCompletedQueue)
                .to(paymentExchange)
                .with(PAYMENT_COMPLETED_ROUTING_KEY);
    }
}
