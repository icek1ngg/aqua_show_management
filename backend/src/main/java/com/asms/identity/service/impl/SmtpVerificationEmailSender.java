package com.asms.identity.service.impl;

import com.asms.core.exception.MailSendingException;
import com.asms.identity.entity.User;
import com.asms.identity.service.VerificationEmailSender;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class SmtpVerificationEmailSender implements VerificationEmailSender {

    private static final Logger log = LoggerFactory.getLogger(SmtpVerificationEmailSender.class);

    private final JavaMailSender mailSender;
    private final String backendBaseUrl;
    private final String fromEmail;

    public SmtpVerificationEmailSender(
            JavaMailSender mailSender,
            @Value("${asms.backend.base-url}") String backendBaseUrl,
            @Value("${spring.mail.username}") String fromEmail
    ) {
        this.mailSender = mailSender;
        this.backendBaseUrl = backendBaseUrl;
        this.fromEmail = fromEmail;
    }

    @Override
    public void send(User user, String rawToken) {
        try {
            String link = backendBaseUrl + "/api/auth/verify-email?token="
                    + URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
            String html = """
                    <html><body>
                    <h2>Verify your AquaPulse account</h2>
                    <p>Hello %s,</p>
                    <p><a href="%s">Verify Email</a></p>
                    <p>This link is valid for 30 minutes.</p>
                    </body></html>
                    """.formatted(HtmlUtils.htmlEscape(user.getFullName()), link);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject("Verify your AquaPulse account");
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException | MailException exception) {
            log.error("Failed to send verification email for user {}", user.getId());
            throw new MailSendingException(
                    "Failed to send verification email. Please try signing in to resend verification."
            );
        }
    }
}
