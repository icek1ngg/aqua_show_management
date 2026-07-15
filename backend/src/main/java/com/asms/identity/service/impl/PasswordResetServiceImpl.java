package com.asms.identity.service.impl;

import com.asms.core.exception.BadRequestException;
import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthProvider;
import com.asms.identity.enums.AuthChallengeType;
import com.asms.identity.enums.UserStatus;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.service.AuthChallengeService;
import com.asms.identity.service.PasswordResetService;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetServiceImpl.class);
    private static final SecureRandom secureRandom = new SecureRandom();

    private final AuthChallengeService challengeService;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    @Value("${asms.frontend.base-url}")
    private String frontendBaseUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public PasswordResetServiceImpl(
            AuthChallengeService challengeService,
            UserRepository userRepository,
            JavaMailSender mailSender,
            PasswordEncoder passwordEncoder
    ) {
        this.challengeService = challengeService;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email.trim());
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for nonexistent email: {}", email);
            return;
        }

        User user = userOpt.get();

        // Check if user is Google-only
        if (user.getAuthProvider() == AuthProvider.GOOGLE && user.getPasswordHash() == null) {
            log.info("Password reset requested for Google-only account: {}", email);
            return;
        }

        // Check if user is disabled or inactive
        if (user.getStatus() == UserStatus.DISABLED || user.getStatus() == UserStatus.INACTIVE) {
            log.info("Password reset requested for inactive or disabled user: {}", email);
            return;
        }

        try {
            AuthChallengeService.IssuedChallenge issued = challengeService.issue(
                    user,
                    AuthChallengeType.PASSWORD_RESET,
                    java.time.Duration.ofMinutes(15)
            );
            String tokenString = issued.rawToken();

            // Construct email link
            String resetLink = frontendBaseUrl + "/reset-password?token=" + tokenString;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject("Reset your AquaPulse password");

            String htmlContent = "<!DOCTYPE html>"
                    + "<html>"
                    + "<head>"
                    + "  <meta charset=\"utf-8\">"
                    + "  <title>Reset your password</title>"
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
                    + "              <h1 style=\"margin: 0 0 16px 0; font-size: 24px; font-weight: 800; text-align: center; color: #111827; letter-spacing: -0.5px;\">Reset your password</h1>"
                    + "              <p style=\"margin: 0 0 24px 0; font-size: 15px; line-height: 24px; text-align: center; color: #4b5563;\">"
                    + "                We received a request to reset your password. If you didn't make this request, you can safely ignore this email. Otherwise, click the button below to reset your password."
                    + "              </p>"
                    + "              <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">"
                    + "                <tr>"
                    + "                  <td align=\"center\" style=\"padding: 8px 0 24px 0;\">"
                    + "                    <a href=\"" + resetLink + "\" target=\"_blank\" style=\"display: inline-block; padding: 14px 36px; background-color: #0f766e; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 50px; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25); text-align: center;\">Reset Password</a>"
                    + "                  </td>"
                    + "                </tr>"
                    + "              </table>"
                    + "              <p style=\"margin: 0 0 16px 0; font-size: 13px; line-height: 20px; text-align: center; color: #9ca3af;\">"
                    + "                This password reset link is valid for <strong>15 minutes</strong>."
                    + "              </p>"
                    + "            </td>"
                    + "          </tr>"
                    + "          <tr>"
                    + "            <td style=\"padding: 0 32px 32px 32px; background-color: #fafafa; border-bottom-left-radius: 24px; border-bottom-right-radius: 24px; border-top: 1px solid #f3f4f6;\">"
                    + "              <p style=\"margin: 24px 0 8px 0; font-size: 12px; line-height: 18px; color: #6b7280; text-align: center;\">"
                    + "                If the button above doesn't work, copy and paste this link into your browser:"
                    + "              </p>"
                    + "              <p style=\"margin: 0 0 24px 0; font-size: 12px; line-height: 18px; word-break: break-all; text-align: center;\">"
                    + "                <a href=\"" + resetLink + "\" target=\"_blank\" style=\"color: #06b6d4; text-decoration: underline;\">" + resetLink + "</a>"
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
            log.error("Failed to send password reset email to {}", user.getEmail(), e);
            // Account enumeration prevention: Log internally, but do not expose it to the client
        }
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        com.asms.identity.entity.AuthChallenge challenge = challengeService.consume(token, AuthChallengeType.PASSWORD_RESET);

        User user = challenge.getUser();

        // Verify user is eligible for reset
        if (user.getAuthProvider() == AuthProvider.GOOGLE && user.getPasswordHash() == null) {
            throw new BadRequestException("Google sign-in accounts cannot reset password");
        }

        if (user.getStatus() == UserStatus.DISABLED || user.getStatus() == UserStatus.INACTIVE) {
            throw new BadRequestException("Account is inactive or disabled");
        }

        // Update BCrypt password hash
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        // Disable other challenges
        challengeService.invalidate(user, AuthChallengeType.PASSWORD_RESET);
    }
}
