function lineKey(value) {
  return `${String(value?.scheduleId ?? '').trim()}:${String(value?.ticketType ?? '').trim().toUpperCase()}:${String(value?.passengerType || 'ADULT').trim().toUpperCase()}`;
}

function cartLineKey(value) {
  return `${String(value?.scheduleId ?? '').trim()}:${String(value?.ticketType ?? '').trim().toUpperCase()}`;
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function classifyCheckoutError(error) {
  const response = error?.response;
  const body = response?.data;
  const code = typeof body?.code === 'string' ? body.code : null;
  const message = typeof body?.message === 'string' ? body.message : undefined;
  if (response?.status === 409 && code === 'CHECKOUT_REVIEW_REQUIRED') {
    return { kind: 'review', data: body?.data, message };
  }
  if (response?.status === 409 && code === 'CHECKOUT_IN_PROGRESS') {
    return { kind: 'inProgress', data: body?.data, message };
  }
  if (response?.status === 409 && code === 'IDEMPOTENCY_KEY_REUSED') {
    return { kind: 'idempotencyReused', data: body?.data, message };
  }
  return { kind: 'other', data: body?.data, message };
}

export function beginCheckoutSubmission(latch) {
  if (!latch || latch.current) return false;
  latch.current = true;
  return true;
}

export function finishCheckoutSubmission(latch) {
  if (latch) latch.current = false;
}

export function applyAuthoritativeReview(draft, data) {
  const authoritativeByKey = new Map(
    (Array.isArray(data?.items) ? data.items : []).map(item => [lineKey(item), item]),
  );
  return draft.items.map(item => {
    const authoritative = authoritativeByKey.get(lineKey(item));
    if (!authoritative) return item;
    const currentAvailable = finiteNumber(authoritative.availableQuantity);
    const currentUnitPrice = finiteNumber(authoritative.currentUnitPrice);
    if (currentAvailable === null || currentAvailable < 0 || currentUnitPrice === null || currentUnitPrice < 0) {
      return { ...item, invalid: true, reason: 'The server returned invalid checkout review data.', authoritative: true };
    }
    const available = Math.max(0, Math.trunc(currentAvailable));
    return {
      ...item,
      currentAvailable: available,
      currentUnitPrice,
      priceChanged: currentUnitPrice !== Number(item.expectedUnitPrice),
      noStock: available < Number(item.quantity),
      authoritative: true,
      invalid: false,
    };
  });
}

function cleanReviewedItem(line) {
  const item = {
    scheduleId: String(line.scheduleId).trim(),
    ticketType: String(line.ticketType).trim().toUpperCase(),
    passengerType: String(line.passengerType || 'ADULT').trim().toUpperCase(),
    quantity: Math.min(Number(line.quantity), Number(line.currentAvailable ?? line.quantity)),
    expectedUnitPrice: Number(line.currentUnitPrice ?? line.expectedUnitPrice),
  };
  if (line.displaySnapshot) item.displaySnapshot = line.displaySnapshot;
  return item;
}

export function purchasedCartKeys(items) {
  return [...new Set((Array.isArray(items) ? items : []).map(cartLineKey).filter(key => !key.startsWith(':')))];
}

export function confirmCheckoutReview(draft, lines, newIdempotencyKey) {
  const items = (Array.isArray(lines) ? lines : [])
    .filter(line => !line.invalid && Number(line.currentAvailable ?? line.quantity) > 0)
    .map(cleanReviewedItem);
  return {
    ...draft,
    idempotencyKey: String(newIdempotencyKey ?? '').trim(),
    cartKeys: purchasedCartKeys(items),
    items,
  };
}
