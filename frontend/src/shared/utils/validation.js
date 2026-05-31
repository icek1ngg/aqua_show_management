const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const lettersAndSpacesPattern = /^[\p{L} ]+$/u;
const phonePattern = /^\d{9,11}$/;

export function sanitizeDigits(value, maxLength = 11) {
  return String(value || '').replace(/\D/g, '').slice(0, maxLength);
}

export function isValidEmail(value) {
  return emailPattern.test(String(value || '').trim());
}

export function validateName(value, label, { min = 1, required = true } = {}) {
  const trimmedValue = String(value || '').trim();

  if (required && !trimmedValue) {
    return `${label} is required.`;
  }

  if (trimmedValue && trimmedValue.length < min) {
    return `${label} must be at least ${min} characters.`;
  }

  if (trimmedValue && !lettersAndSpacesPattern.test(trimmedValue)) {
    return `${label} must contain letters and spaces only.`;
  }

  return '';
}

export function validateEmail(value) {
  const trimmedValue = String(value || '').trim();

  if (!trimmedValue) {
    return 'Email is required.';
  }

  if (!isValidEmail(trimmedValue)) {
    return 'Please enter a valid email address.';
  }

  return '';
}

export function validatePhone(value, { required = true } = {}) {
  const trimmedValue = String(value || '').trim();

  if (required && !trimmedValue) {
    return 'Phone number is required.';
  }

  if (trimmedValue && !phonePattern.test(trimmedValue)) {
    return 'Phone number must contain 9 to 11 digits only.';
  }

  return '';
}

export function validatePassword(value) {
  const password = String(value || '');

  if (!password) {
    return 'Password is required.';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include at least one letter and one number.';
  }

  return '';
}

export function validateRequired(value, label) {
  return String(value || '').trim() ? '' : `${label} is required.`;
}

export function isTodayOrFuture(dateValue) {
  if (!dateValue) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = new Date(`${dateValue}T00:00:00`);
  return selectedDate >= today;
}
