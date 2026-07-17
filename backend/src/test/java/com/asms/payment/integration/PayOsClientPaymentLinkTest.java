package com.asms.payment.integration;

import com.asms.booking.entity.Booking;
import com.asms.booking.entity.BookingItem;
import com.asms.booking.enums.TicketType;
import com.asms.core.exception.BadRequestException;
import com.asms.identity.entity.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class PayOsClientPaymentLinkTest {

    @Test
    void createsOnePayOsItemForEveryBookingLine() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://api-merchant.payos.vn");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        PayOsClient client = client(builder.build());
        Booking booking = booking(
                new BigDecimal("110000"),
                item("Dolphin Dreams", TicketType.VIP, 2, "30000"),
                item("Ocean Wonders", TicketType.FAMILY, 1, "50000")
        );

        server.expect(once(), requestTo("https://api-merchant.payos.vn/v2/payment-requests"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().json("""
                        {
                          "amount": 110000,
                          "items": [
                            {"name": "Dolphin Dreams - VIP", "quantity": 2, "price": 30000},
                            {"name": "Ocean Wonders - FAMILY", "quantity": 1, "price": 50000}
                          ]
                        }
                        """, false))
                .andRespond(withSuccess("""
                        {"code":"00","data":{"checkoutUrl":"https://pay.payos.vn/link","amount":110000}}
                        """, MediaType.APPLICATION_JSON));

        client.createPaymentLink(booking, "123456789");

        server.verify();
    }

    @Test
    void rejectsBookingWhoseLineTotalsDoNotMatchTotalBeforeCallingPayOs() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://api-merchant.payos.vn");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        PayOsClient client = client(builder.build());
        Booking booking = booking(
                new BigDecimal("109999"),
                item("Dolphin Dreams", TicketType.VIP, 2, "30000"),
                item("Ocean Wonders", TicketType.FAMILY, 1, "50000")
        );

        assertThatThrownBy(() -> client.createPaymentLink(booking, "123456789"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("item total")
                .hasMessageContaining("booking total");

        server.verify();
    }

    @Test
    void rejectsBookingWithoutItemsBeforeCallingPayOs() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://api-merchant.payos.vn");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        PayOsClient client = client(builder.build());
        Booking booking = booking(new BigDecimal("100000"));

        assertThatThrownBy(() -> client.createPaymentLink(booking, "123456789"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("without items");

        server.verify();
    }

    private PayOsClient client(RestClient restClient) {
        return new PayOsClient(
                "client-id", "api-key", "checksum-secret", false, "test",
                "http://localhost:5173", new ObjectMapper(), restClient
        );
    }

    private Booking booking(BigDecimal totalAmount, BookingItem... items) {
        User user = mock(User.class);
        when(user.getFullName()).thenReturn("Test User");
        when(user.getEmail()).thenReturn("test@example.com");
        when(user.getPhoneNumber()).thenReturn("0900000000");

        Booking booking = mock(Booking.class);
        when(booking.getItems()).thenReturn(List.of(items));
        when(booking.getTotalAmount()).thenReturn(totalAmount);
        when(booking.getUser()).thenReturn(user);
        when(booking.getExpiresAt()).thenReturn(Instant.now().plusSeconds(600));
        when(booking.getId()).thenReturn(java.util.UUID.randomUUID());
        return booking;
    }

    private BookingItem item(String showName, TicketType type, int quantity, String unitPrice) {
        BookingItem item = mock(BookingItem.class);
        when(item.getShowName()).thenReturn(showName);
        when(item.getTicketType()).thenReturn(type);
        when(item.getQuantity()).thenReturn(quantity);
        when(item.getUnitPrice()).thenReturn(new BigDecimal(unitPrice));
        return item;
    }
}
