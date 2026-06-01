package com.asms.notification.service.impl;

import com.asms.booking.entity.Booking;
import com.asms.booking.enums.BookingStatus;
import com.asms.booking.repository.BookingRepository;
import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.NotFoundException;
import com.asms.core.exception.UnauthorizedException;
import com.asms.identity.entity.User;
import com.asms.identity.repository.UserRepository;
import com.asms.notification.entity.EmailNotification;
import com.asms.notification.enums.EmailNotificationStatus;
import com.asms.notification.enums.EmailNotificationType;
import com.asms.notification.repository.EmailNotificationRepository;
import com.asms.notification.service.EmailNotificationService;
import com.asms.ticketing.entity.Ticket;
import com.asms.ticketing.repository.TicketRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class EmailNotificationServiceImpl implements EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationServiceImpl.class);
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.forLanguageTag("vi-VN"));
    private static final NumberFormat VND_FORMATTER = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN"));

    private final EmailNotificationRepository emailNotificationRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final String mailUsername;

    public EmailNotificationServiceImpl(
            EmailNotificationRepository emailNotificationRepository,
            BookingRepository bookingRepository,
            TicketRepository ticketRepository,
            UserRepository userRepository,
            JavaMailSender mailSender,
            @Value("${spring.mail.username}") String mailUsername
    ) {
        this.emailNotificationRepository = emailNotificationRepository;
        this.bookingRepository = bookingRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
        this.mailUsername = mailUsername;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendPaymentSuccessEmail(Booking booking, List<Ticket> tickets) {
        String subject = "AquaPulse booking confirmed";
        EmailNotification notification = emailNotificationRepository.save(new EmailNotification(
                booking.getUser(),
                booking,
                EmailNotificationType.QR_TICKET,
                booking.getUser().getEmail(),
                subject
        ));

        try {
            if (mailUsername == null || mailUsername.isBlank()) {
                throw new IllegalStateException("Gmail username is not configured");
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailUsername);
            helper.setTo(booking.getUser().getEmail());
            helper.setSubject(subject);
            helper.setText(buildPlainTextBody(booking, tickets), buildHtmlBody(booking, tickets));
            mailSender.send(message);

            notification.setStatus(EmailNotificationStatus.SENT);
            notification.setSentAt(Instant.now());
        } catch (Exception exception) {
            log.warn(
                    "Failed to send AquaPulse ticket email: bookingId={}, recipient={}, reason={}",
                    booking.getId(),
                    booking.getUser().getEmail(),
                    exception.getMessage(),
                    exception
            );
            notification.setStatus(EmailNotificationStatus.FAILED);
        }

        emailNotificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void resendPaymentSuccessEmail(UUID bookingId, String currentUserEmail) {
        User currentUser = userRepository.findByEmailIgnoreCase(currentUserEmail)
                .orElseThrow(() -> new UnauthorizedException("Authentication required"));
        Booking booking = bookingRepository.findByIdAndUser(bookingId, currentUser)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PAID) {
            throw new BadRequestException("Only paid bookings can resend ticket email");
        }

        List<Ticket> tickets = ticketRepository.findByBooking_Id(booking.getId());
        if (tickets.isEmpty()) {
            throw new BadRequestException("Booking does not have generated tickets");
        }

        sendPaymentSuccessEmail(booking, tickets);
    }

    private String buildPlainTextBody(Booking booking, List<Ticket> tickets) {
        StringBuilder body = new StringBuilder();
        body.append("Your AquaPulse booking is paid and confirmed.\n\n");
        body.append("Booking code: ").append(booking.getBookingCode()).append("\n");
        body.append("Show: ").append(booking.getShowName()).append("\n");
        body.append("Show date: ").append(formatDate(booking)).append("\n");
        body.append("Total paid: ").append(formatCurrency(booking.getTotalAmount())).append("\n");
        body.append("Tickets: ").append(tickets.size()).append("\n\n");
        body.append("QR codes:\n");
        for (Ticket ticket : tickets) {
            body.append("- ").append(ticket.getQrCode()).append("\n");
        }
        return body.toString();
    }

    private String buildHtmlBody(Booking booking, List<Ticket> tickets) {
        String ticketCards = tickets.stream()
                .map((ticket) -> """
                        <tr>
                          <td style="padding:16px 0;border-top:1px solid #d8f3f4;">
                            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                              <tr>
                                <td width="168" valign="top" style="padding-right:18px;">
                                  <img src="%s" width="148" height="148" alt="Ticket QR code" style="display:block;width:148px;height:148px;border:1px solid #bdecef;border-radius:14px;background:#ffffff;padding:8px;" />
                                </td>
                                <td valign="top" style="font-family:Arial,'Helvetica Neue',sans-serif;">
                                  <p style="margin:0 0 8px;font-size:13px;font-weight:800;color:#00696b;letter-spacing:.12em;text-transform:uppercase;">QR Ticket</p>
                                  <p style="margin:0 0 10px;font-size:18px;font-weight:800;color:#102a2b;">%s</p>
                                  <p style="margin:0;padding:12px;border-radius:12px;background:#f2fbfc;font-size:12px;line-height:18px;color:#436568;word-break:break-all;">%s</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        """.formatted(qrImageUrl(ticket), HtmlUtils.htmlEscape(ticket.getStatus().name()), HtmlUtils.htmlEscape(ticket.getQrCode())))
                .reduce("", String::concat);

        return """
                <!doctype html>
                <html>
                <body style="margin:0;padding:0;background:#eef9fa;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#eef9fa;">
                    <tr>
                      <td align="center" style="padding:28px 14px;">
                        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%%;border-collapse:collapse;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #cceff1;">
                          <tr>
                            <td style="padding:34px 34px 28px;background:linear-gradient(135deg,#00696b,#008b8b);font-family:Arial,'Helvetica Neue',sans-serif;color:#ffffff;">
                              <p style="margin:0 0 8px;font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#d7fbff;">AquaPulse</p>
                              <h1 style="margin:0;font-size:30px;line-height:38px;font-weight:900;">Booking confirmed</h1>
                              <p style="margin:12px 0 0;font-size:15px;line-height:24px;color:#e7feff;">Your payment was completed. Keep this email and present the QR ticket at the gate.</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:30px 34px 12px;font-family:Arial,'Helvetica Neue',sans-serif;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f2fbfc;border:1px solid #d8f3f4;border-radius:16px;">
                                <tr>
                                  <td style="padding:20px;">
                                    <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#647b7d;">Booking reference</p>
                                    <p style="margin:0;font-size:22px;font-weight:900;color:#102a2b;">%s</p>
                                  </td>
                                  <td align="right" style="padding:20px;">
                                    <span style="display:inline-block;padding:7px 14px;border-radius:999px;background:#d8f8e8;color:#047857;font-size:12px;font-weight:900;letter-spacing:.08em;">PAID</span>
                                  </td>
                                </tr>
                              </table>
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:18px;">
                                <tr>
                                  <td style="padding:10px 0;color:#647b7d;font-size:13px;">Show</td>
                                  <td align="right" style="padding:10px 0;color:#102a2b;font-size:14px;font-weight:800;">%s</td>
                                </tr>
                                <tr>
                                  <td style="padding:10px 0;color:#647b7d;font-size:13px;">Date</td>
                                  <td align="right" style="padding:10px 0;color:#102a2b;font-size:14px;font-weight:800;">%s</td>
                                </tr>
                                <tr>
                                  <td style="padding:10px 0;color:#647b7d;font-size:13px;">Ticket type</td>
                                  <td align="right" style="padding:10px 0;color:#102a2b;font-size:14px;font-weight:800;">%s x %d</td>
                                </tr>
                                <tr>
                                  <td style="padding:14px 0;border-top:1px solid #d8f3f4;color:#647b7d;font-size:13px;font-weight:800;">Total paid</td>
                                  <td align="right" style="padding:14px 0;border-top:1px solid #d8f3f4;color:#00696b;font-size:20px;font-weight:900;">%s</td>
                                </tr>
                              </table>
                              <h2 style="margin:24px 0 0;font-size:20px;line-height:28px;color:#102a2b;">Your QR tickets</h2>
                              <p style="margin:6px 0 0;font-size:13px;line-height:21px;color:#647b7d;">Each ticket can be checked in successfully only once.</p>
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:8px;">
                                %s
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:22px 34px 30px;font-family:Arial,'Helvetica Neue',sans-serif;color:#647b7d;font-size:12px;line-height:20px;background:#fbffff;">
                              Please arrive at least 15 minutes before show time. If QR images are blocked by your email app, staff can validate the text code shown under each QR.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                HtmlUtils.htmlEscape(booking.getBookingCode()),
                HtmlUtils.htmlEscape(booking.getShowName()),
                formatDate(booking),
                HtmlUtils.htmlEscape(booking.getTicketType()),
                booking.getQuantity(),
                formatCurrency(booking.getTotalAmount()),
                ticketCards
        );
    }

    private String qrImageUrl(Ticket ticket) {
        return "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data="
                + java.net.URLEncoder.encode(ticket.getQrCode(), java.nio.charset.StandardCharsets.UTF_8);
    }

    private String formatDate(Booking booking) {
        return booking.getShowDate().atStartOfDay(VIETNAM_ZONE).format(DATE_FORMATTER);
    }

    private String formatCurrency(BigDecimal amount) {
        return VND_FORMATTER.format(amount == null ? BigDecimal.ZERO : amount);
    }
}
