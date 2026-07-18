export const LEGAL_DOCUMENT_VERSION = '2026-07-15';
export const REGISTRATION_LIMITS = Object.freeze({
  lastName: 100,
  firstMiddleName: 150,
  email: 150,
  phoneNumber: 11,
  password: 100,
});

export function buildRegistrationPayload({
  lastName,
  firstMiddleName,
  email,
  phoneNumber,
  password,
  acceptedTerms,
}) {
  return {
    lastName: String(lastName || '').trim(),
    firstMiddleName: String(firstMiddleName || '').trim(),
    email: String(email || '').trim(),
    phoneNumber: String(phoneNumber || '').trim(),
    password,
    acceptedTerms: Boolean(acceptedTerms),
    legalDocumentVersion: LEGAL_DOCUMENT_VERSION,
  };
}
