package com.asms.identity.service.impl;

import com.asms.core.exception.BadRequestException;
import com.asms.core.exception.MailSendingException;
import com.asms.core.exception.NotFoundException;
import com.asms.identity.entity.EmailVerificationToken;
import com.asms.identity.entity.User;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.EmailVerificationTokenRepository;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.service.EmailVerificationService;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationServiceImpl.class);

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${asms.backend.base-url}")
    private String backendBaseUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailVerificationServiceImpl(
            EmailVerificationTokenRepository tokenRepository,
            UserRepository userRepository,
            JavaMailSender mailSender
    ) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    @Override
    @Transactional
    public void sendVerificationEmail(User user) {
        try {
            // Delete any existing tokens for this user
            tokenRepository.deleteByUser(user);

            // Generate token (expires in 30 minutes)
            String tokenString = UUID.randomUUID().toString();
            EmailVerificationToken verificationToken = new EmailVerificationToken(user, tokenString, 30);
            tokenRepository.save(verificationToken);

            // Construct email link
            String verificationLink = backendBaseUrl + "/api/auth/verify-email?token=" + tokenString;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject("Verify your AquaPulse account");
            
            String htmlContent = "<!DOCTYPE html>"
                    + "<html>"
                    + "<head>"
                    + "  <meta charset=\"utf-8\">"
                    + "  <title>Verify your AquaPulse Account</title>"
                    + "</head>"
                    + "<body style=\"margin: 0; padding: 0; background-color: #f0fdfa; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;\">"
                    + "  <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"table-layout: fixed;\">"
                    + "    <tr>"
                    + "      <td align=\"center\" style=\"padding: 40px 10px;\">"
                    + "        <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width: 500px; background-color: #ffffff; border-radius: 24px; border: 1px solid #ccfbf1; box-shadow: 0 10px 25px -5px rgba(20, 184, 166, 0.08);\">"
                    + "          <tr>"
                    + "            <td align=\"center\" style=\"padding: 32px 32px 16px 32px;\">"
                    + "              <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\">"
                    + "                <tr>"
                    + "                  <td style=\"font-size: 28px; font-weight: 800; color: #0f766e; letter-spacing: -0.5px;\">"
                    + "                    Aqua<span style=\"color: #06b6d4;\">Pulse</span>"
                    + "                  </td>"
                    + "                </tr>"
                    + "              </table>"
                    + "            </td>"
                    + "          </tr>"
                    + "          <tr>"
                    + "            <td style=\"padding: 0 32px;\">"
                    + "              <div style=\"border-top: 1px solid #f2f4f7;\"></div>"
                    + "            </td>"
                    + "          </tr>"
                    + "          <tr>"
                    + "            <td style=\"padding: 32px;\">"
                    + "              <h1 style=\"margin: 0 0 16px 0; font-size: 24px; font-weight: 800; text-align: center; color: #111827; letter-spacing: -0.5px;\">Verify your email</h1>"
                    + "              <p style=\"margin: 0 0 24px 0; font-size: 15px; line-height: 24px; text-align: center; color: #4b5563;\">"
                    + "                Welcome to AquaPulse! We're excited to have you. Please verify your email address to activate your account and access our premium synchronized water and light shows."
                    + "              </p>"
                    + "              <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">"
                    + "                <tr>"
                    + "                  <td align=\"center\" style=\"padding: 8px 0 24px 0;\">"
                    + "                    <a href=\"" + verificationLink + "\" target=\"_blank\" style=\"display: inline-block; padding: 14px 36px; background-color: #0f766e; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 50px; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25); text-align: center;\">Verify Email</a>"
                    + "                  </td>"
                    + "                </tr>"
                    + "              </table>"
                    + "              <p style=\"margin: 0 0 16px 0; font-size: 13px; line-height: 20px; text-align: center; color: #9ca3af;\">"
                    + "                This verification link is valid for <strong>30 minutes</strong>."
                    + "              </p>"
                    + "            </td>"
                    + "          </tr>"
                    + "          <tr>"
                    + "            <td style=\"padding: 0 32px 32px 32px; background-color: #fafafa; border-bottom-left-radius: 24px; border-bottom-right-radius: 24px; border-top: 1px solid #f3f4f6;\">"
                    + "              <p style=\"margin: 24px 0 8px 0; font-size: 12px; line-height: 18px; color: #6b7280; text-align: center;\">"
                    + "                If the button above doesn't work, copy and paste this link into your browser:"
                    + "              </p>"
                    + "              <p style=\"margin: 0 0 24px 0; font-size: 12px; line-height: 18px; word-break: break-all; text-align: center;\">"
                    + "                <a href=\"" + verificationLink + "\" target=\"_blank\" style=\"color: #06b6d4; text-decoration: underline;\">" + verificationLink + "</a>"
                    + "              </p>"
                    + "              <p style=\"margin: 0; font-size: 11px; line-height: 16px; color: #9ca3af; text-align: center;\">"
                    + "                &copy; 2026 AquaPulse. All rights reserved."
                    + "              </p>"
                    + "            </td>"
                    + "          </tr>"
                    + "        </table>"
                    + "      </td>"
                    + "    </tr>"
                    + "  </table>"
                    + "</body>"
                    + "</html>";
                    
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}", user.getEmail(), e);
            throw new MailSendingException("Failed to send verification email. Please try signing in to resend verification.");
        }
    }

    @Override
    @Transactional
    public void verifyEmail(String token) {
        EmailVerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new NotFoundException("Invalid verification token"));

        if (verificationToken.isUsed()) {
            throw new BadRequestException("Verification token has already been used");
        }

        if (verificationToken.isExpired()) {
            throw new BadRequestException("Verification token has expired");
        }

        verificationToken.setUsedAt(LocalDateTime.now());
        tokenRepository.save(verificationToken);

        User user = verificationToken.getUser();
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public String resendVerificationEmail(String email) {
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email.trim());
        if (userOpt.isEmpty()) {
            return "If the email exists and is not verified, a verification email has been sent.";
        }

        User user = userOpt.get();
        if (user.getStatus() == UserStatus.ACTIVE) {
            return "Account is already verified.";
        }

        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            sendVerificationEmail(user);
            return "Verification email has been sent.";
        }

        throw new BadRequestException("Account is not eligible for email verification.");
    }
}
