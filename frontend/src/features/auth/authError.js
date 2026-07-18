export function getAuthErrorCode(error) {
  return error?.code || error?.response?.data?.code || '';
}

export function shouldOfferVerificationResend(error) {
  return getAuthErrorCode(error) === 'EMAIL_VERIFICATION_REQUIRED';
}
