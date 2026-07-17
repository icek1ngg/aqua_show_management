const DRAFT_KEY = 'aqua_pulse_checkout_draft';
const DRAFT_VERSION = 1;
export const CHECKOUT_DRAFT_TTL_MS = 30 * 60 * 1000;

const snapshotFields = ['showTitle', 'imageUrl', 'venueName', 'startTime', 'endTime'];
const validTicketTypes = new Set(['STANDARD', 'VIP', 'FAMILY']);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function storage() {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function normalizeNonBlank(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function normalizeSnapshot(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const snapshot = {};
  for (const field of snapshotFields) {
    if (typeof value[field] === 'string' && value[field].trim()) {
      snapshot[field] = value[field].trim();
    }
  }
  return Object.keys(snapshot).length ? snapshot : undefined;
}

function normalizeItem(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const scheduleId = normalizeNonBlank(value.scheduleId);
  const ticketType = normalizeNonBlank(value.ticketType)?.toUpperCase();
  const quantity = value.quantity;
  const expectedUnitPrice = value.expectedUnitPrice;
  if (
    !scheduleId
    || !uuidPattern.test(scheduleId)
    || !ticketType
    || !validTicketTypes.has(ticketType)
    || !Number.isInteger(quantity)
    || quantity < 1
    || quantity > 10
    || typeof expectedUnitPrice !== 'number'
    || !Number.isFinite(expectedUnitPrice)
    || expectedUnitPrice < 0
  ) return null;

  const normalized = { scheduleId, ticketType, quantity, expectedUnitPrice };
  const displaySnapshot = normalizeSnapshot(value.displaySnapshot);
  if (displaySnapshot) normalized.displaySnapshot = displaySnapshot;
  return normalized;
}

function normalizeContents(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const idempotencyKey = normalizeNonBlank(value.idempotencyKey);
  const rawCartKeys = Array.isArray(value.cartKeys) ? value.cartKeys : [];
  if (rawCartKeys.some(key => typeof key !== 'string' || !key.trim())) return null;
  const cartKeys = [...new Set(rawCartKeys.map(key => key.trim()))];
  const rawItems = Array.isArray(value.items) ? value.items : [];
  const items = rawItems.map(normalizeItem);
  if (!idempotencyKey || cartKeys.length === 0 || items.length === 0 || items.some(item => !item)) return null;
  const itemKeys = items.map(item => `${item.scheduleId}:${item.ticketType}`);
  if (new Set(itemKeys).size !== itemKeys.length) return null;
  if (cartKeys.length !== itemKeys.length || itemKeys.some(key => !cartKeys.includes(key))) return null;
  return { idempotencyKey, cartKeys, items };
}

function removeStoredDraft(resolvedStorage = storage()) {
  try {
    resolvedStorage?.removeItem(DRAFT_KEY);
  } catch {
    // sessionStorage can be disabled; clearing a stale draft remains best-effort.
  }
}

export function saveCheckoutDraft(draft) {
  const contents = normalizeContents(draft);
  if (!contents) {
    removeStoredDraft();
    throw new TypeError('Invalid checkout draft.');
  }

  const createdAt = Date.now();
  const payload = {
    version: DRAFT_VERSION,
    ...contents,
    createdAt,
    expiresAt: createdAt + CHECKOUT_DRAFT_TTL_MS,
  };
  const resolvedStorage = storage();
  if (!resolvedStorage) throw new Error('Checkout draft storage is unavailable.');
  resolvedStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  return payload;
}

export function getCheckoutDraft() {
  const resolvedStorage = storage();
  let raw;
  try {
    raw = resolvedStorage?.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const value = JSON.parse(raw);
    const contents = normalizeContents(value);
    const now = Date.now();
    const validTimestamps = Number.isInteger(value?.createdAt)
      && Number.isInteger(value?.expiresAt)
      && value.createdAt <= now
      && value.expiresAt === value.createdAt + CHECKOUT_DRAFT_TTL_MS
      && now < value.expiresAt
      && now - value.createdAt < CHECKOUT_DRAFT_TTL_MS;
    if (value?.version !== DRAFT_VERSION || !contents || !validTimestamps) {
      removeStoredDraft(resolvedStorage);
      return null;
    }
    return { version: DRAFT_VERSION, ...contents, createdAt: value.createdAt, expiresAt: value.expiresAt };
  } catch {
    removeStoredDraft(resolvedStorage);
    return null;
  }
}

export const readCheckoutDraft = getCheckoutDraft;

export function revalidateCheckoutDraft(activeDraft) {
  const storedDraft = getCheckoutDraft();
  if (!storedDraft || storedDraft.idempotencyKey !== activeDraft?.idempotencyKey) return null;
  return storedDraft;
}

export function clearCheckoutDraft() {
  removeStoredDraft();
}
