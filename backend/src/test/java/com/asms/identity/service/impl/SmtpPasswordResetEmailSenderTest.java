package com.asms.identity.service.impl;

import com.asms.identity.entity.User;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.task.SyncTaskExecutor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SmtpPasswordResetEmailSenderTest {

    @Mock
    private JavaMailSender mailSender;

    private SmtpPasswordResetEmailSender emailSender;

    @BeforeEach
    void setUp() {
        emailSender = new SmtpPasswordResetEmailSender(mailSender, new SyncTaskExecutor());
        ReflectionTestUtils.setField(emailSender, "frontendBaseUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(emailSender, "fromEmail", "test@test.com");
    }

    @Test
    void sendPasswordResetEmail_shouldSendEmail() {
        User user = new User("Last", "First", "user@example.com", "123456789", "hash");

        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailSender.sendPasswordResetEmail(user, "test-token");

        verify(mailSender).send(mimeMessage);
    }

    @Test
    void sendPasswordChangedEmail_shouldSendEmail() {
        User user = new User("Last", "First", "user@example.com", "123456789", "hash");

        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailSender.sendPasswordChangedEmail(user);

        verify(mailSender).send(mimeMessage);
    }
    
    @Test
    void sendPasswordResetEmail_shouldNotThrowException_whenMailSenderFails() {
        User user = new User("Last", "First", "user@example.com", "123456789", "hash");

        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("Mail exception")).when(mailSender).send(any(MimeMessage.class));

        emailSender.sendPasswordResetEmail(user, "test-token");

        verify(mailSender).send(mimeMessage);
    }
}
