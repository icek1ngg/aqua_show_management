package com.asms.booking.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BookingRabbitConfig {

    public static final String BOOKING_EXCHANGE = "asms.booking.exchange";
    public static final String BOOKING_CREATE_QUEUE = "asms.booking.create.queue";
    public static final String BOOKING_CREATE_ROUTING_KEY = "booking.create";

    @Bean("bookingExchange")
    public TopicExchange bookingExchange() {
        return new TopicExchange(BOOKING_EXCHANGE, true, false);
    }

    @Bean("bookingCreateQueue")
    public Queue bookingCreateQueue() {
        return new Queue(BOOKING_CREATE_QUEUE, true);
    }

    @Bean("bookingCreateBinding")
    public Binding bookingCreateBinding(
            @Qualifier("bookingCreateQueue") Queue bookingCreateQueue,
            @Qualifier("bookingExchange") TopicExchange bookingExchange
    ) {
        return BindingBuilder.bind(bookingCreateQueue)
                .to(bookingExchange)
                .with(BOOKING_CREATE_ROUTING_KEY);
    }

    @Bean
    public MessageConverter rabbitMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
