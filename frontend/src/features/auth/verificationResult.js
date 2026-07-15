const CURRENT_RESULTS = new Set(['success', 'expired', 'used', 'invalid']);

export function getVerificationResult(query) {
  const verification = query?.get?.('verification') ?? query?.verification;
  if (CURRENT_RESULTS.has(verification)) {
    return verification;
  }

  const verified = query?.get?.('verified') ?? query?.verified;
  if (verified === 'true') {
    return 'success';
  }
  if (verified === 'false') {
    return 'invalid';
  }

  return '';
}
