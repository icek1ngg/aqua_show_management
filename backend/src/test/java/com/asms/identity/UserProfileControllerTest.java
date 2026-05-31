package com.asms.identity;

import com.asms.core.exception.UnauthorizedException;
import com.asms.core.response.ApiResponse;
import com.asms.identity.controller.UserProfileController;
import com.asms.identity.dto.AuthDtos.UpdateProfileRequest;
import com.asms.identity.dto.AuthDtos.UserProfileResponse;
import com.asms.identity.entity.User;
import com.asms.identity.enums.AuthProvider;
import com.asms.identity.enums.Gender;
import com.asms.identity.enums.UserRole;
import com.asms.identity.repository.UserRepository;
import com.asms.identity.service.UserProfileService;
import com.asms.identity.service.impl.UserProfileServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserProfileControllerTest {

    private UserRepository userRepository;
    private UserProfileService userProfileService;
    private UserProfileController userProfileController;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        userProfileService = new UserProfileServiceImpl(userRepository);
        userProfileController = new UserProfileController(userProfileService);
    }

    @Test
    void getProfileReturnsOwnProfileForAuthenticatedUser() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "hashed-password");
        user.setGender(Gender.MALE);
        user.setAddress("HCM");
        user.setDateOfBirth(LocalDate.of(2000, 1, 1));

        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));

        ApiResponse<UserProfileResponse> response = userProfileController.getProfile(user);

        assertThat(response.success()).isTrue();
        assertThat(response.data().email()).isEqualTo("user@example.com");
        assertThat(response.data().fullName()).isEqualTo("Nguyen Van A");
        assertThat(response.data().lastName()).isEqualTo("Nguyen");
        assertThat(response.data().firstMiddleName()).isEqualTo("Van A");
        assertThat(response.data().gender()).isEqualTo(Gender.MALE);
        assertThat(response.data().phoneNumber()).isEqualTo("0909123456");
        assertThat(response.data().address()).isEqualTo("HCM");
        assertThat(response.data().authProvider()).isEqualTo(AuthProvider.LOCAL);
        assertThat(response.data().dateOfBirth()).isEqualTo(LocalDate.of(2000, 1, 1));
    }

    @Test
    void getProfileThrowsUnauthorizedWhenUserNotFound() {
        User user = new User("Nguyen", "Van A", "nonexistent@example.com", "0909123456", "hashed-password");
        when(userRepository.findByEmailIgnoreCase("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userProfileController.getProfile(user))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Authentication required");
    }

    @Test
    void updateProfileUpdatesAllowedFields() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "hashed-password");
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));

        UpdateProfileRequest request = new UpdateProfileRequest(
                "Tran",
                "Thi B",
                Gender.FEMALE,
                "0912345678",
                "Hanoi",
                LocalDate.of(1995, 5, 5)
        );

        ApiResponse<UserProfileResponse> response = userProfileController.updateProfile(user, request);

        assertThat(response.success()).isTrue();
        assertThat(response.data().lastName()).isEqualTo("Tran");
        assertThat(response.data().firstMiddleName()).isEqualTo("Thi B");
        assertThat(response.data().gender()).isEqualTo(Gender.FEMALE);
        assertThat(response.data().phoneNumber()).isEqualTo("0912345678");
        assertThat(response.data().address()).isEqualTo("Hanoi");
        assertThat(response.data().dateOfBirth()).isEqualTo(LocalDate.of(1995, 5, 5));

        assertThat(user.getLastName()).isEqualTo("Tran");
        assertThat(user.getFirstMiddleName()).isEqualTo("Thi B");
        assertThat(user.getGender()).isEqualTo(Gender.FEMALE);
        assertThat(user.getPhoneNumber()).isEqualTo("0912345678");
        assertThat(user.getAddress()).isEqualTo("Hanoi");
        assertThat(user.getDateOfBirth()).isEqualTo(LocalDate.of(1995, 5, 5));
    }

    @Test
    void updateProfileNormalizesBlankPhoneAndAddressToNull() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "hashed-password");
        user.setAddress("HCM");
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));

        UpdateProfileRequest request = new UpdateProfileRequest(
                "Nguyen",
                "Van A",
                Gender.MALE,
                "   ",
                "",
                LocalDate.of(2000, 1, 1)
        );

        ApiResponse<UserProfileResponse> response = userProfileController.updateProfile(user, request);

        assertThat(response.data().phoneNumber()).isNull();
        assertThat(response.data().address()).isNull();
    }

    @Test
    void googleOAuthUserCanUpdateProfileWithoutPassword() {
        User user = new User("Google", "User", "google@example.com", null, null);
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setGoogleId("google-sub-id");

        when(userRepository.findByEmailIgnoreCase("google@example.com")).thenReturn(Optional.of(user));

        UpdateProfileRequest request = new UpdateProfileRequest(
                "Google",
                "User Updated",
                Gender.OTHER,
                "0987654321",
                "Da Nang",
                LocalDate.of(1990, 12, 12)
        );

        ApiResponse<UserProfileResponse> response = userProfileController.updateProfile(user, request);

        assertThat(response.success()).isTrue();
        assertThat(response.data().firstMiddleName()).isEqualTo("User Updated");
        assertThat(response.data().authProvider()).isEqualTo(AuthProvider.GOOGLE);
        assertThat(user.getPasswordHash()).isNull();
    }

    @Test
    void updateProfileOnlyModifiesAllowedFieldsAndIgnoresOrDoesNotTouchProtectedFields() {
        User user = new User("Nguyen", "Van A", "user@example.com", "0909123456", "hashed-password");
        String originalPassword = user.getPasswordHash();
        AuthProvider originalProvider = user.getAuthProvider();
        UserRole originalRole = user.getRole();
        
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));

        UpdateProfileRequest request = new UpdateProfileRequest(
                "Tran",
                "Thi B",
                Gender.FEMALE,
                "0912345678",
                "Hanoi",
                LocalDate.of(1995, 5, 5)
        );

        userProfileController.updateProfile(user, request);

        assertThat(user.getId()).isNotNull();
        assertThat(user.getEmail()).isEqualTo("user@example.com");
        assertThat(user.getPasswordHash()).isEqualTo(originalPassword);
        assertThat(user.getAuthProvider()).isEqualTo(originalProvider);
        assertThat(user.getRole()).isEqualTo(originalRole);
    }
}
