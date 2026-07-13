export const CART_STORAGE_KEY = 'aquapulse.cart.v1';
export const CART_STORAGE_VERSION = 1;
export const CART_MAX_QUANTITY = 10;

export function normalizeTicketType(ticketType) {
  return String(ticketType ?? '').trim().toUpperCase();
}

export function cartItemKey(itemOrScheduleId, ticketType) {
  const scheduleId = typeof itemOrScheduleId === 'object'
    ? itemOrScheduleId?.scheduleId
    : itemOrScheduleId;
  const itemTicketType = typeof itemOrScheduleId === 'object'
    ? itemOrScheduleId?.ticketType
    : ticketType;
  return `${scheduleId}:${normalizeTicketType(itemTicketType)}`;
}

function quantityLimit(maxQuantity) {
  const numericMaximum = Number(maxQuantity);
  if (!Number.isFinite(numericMaximum)) {
    return CART_MAX_QUANTITY;
  }
  return Math.max(1, Math.min(CART_MAX_QUANTITY, Math.trunc(numericMaximum)));
}

function clampQuantity(quantity, maxQuantity = CART_MAX_QUANTITY) {
  const numericQuantity = Number(quantity);
  const safeQuantity = Number.isFinite(numericQuantity) ? Math.trunc(numericQuantity) : 1;
  return Math.max(1, Math.min(quantityLimit(maxQuantity), safeQuantity));
}

function normalizeItem(item, maxQuantity = CART_MAX_QUANTITY) {
  return {
    ...item,
    ticketType: normalizeTicketType(item?.ticketType),
    quantity: clampQuantity(item?.quantity, maxQuantity),
  };
}

export function addCartItem(items, item, maxQuantity = CART_MAX_QUANTITY) {
  const normalizedItem = normalizeItem(item, maxQuantity);
  const key = cartItemKey(normalizedItem);
  const existingIndex = items.findIndex((candidate) => cartItemKey(candidate) === key);

  if (existingIndex < 0) {
    return [...items, normalizedItem];
  }

  return items.map((candidate, index) => {
    if (index !== existingIndex) {
      return candidate;
    }
    return {
      ...candidate,
      ...normalizedItem,
      quantity: clampQuantity(Number(candidate.quantity) + Number(normalizedItem.quantity), maxQuantity),
    };
  });
}

export function updateCartItemQuantity(items, key, quantity, maxQuantity = CART_MAX_QUANTITY) {
  return items.map((item) => (
    cartItemKey(item) === key
      ? { ...item, quantity: clampQuantity(quantity, maxQuantity) }
      : item
  ));
}

export function removeCartItem(items, key) {
  return items.filter((item) => cartItemKey(item) !== key);
}

export function removeCartItems(items, keys) {
  const selectedKeys = keys instanceof Set ? keys : new Set(keys);
  return items.filter((item) => !selectedKeys.has(cartItemKey(item)));
}

export function cartTotalQuantity(items) {
  return items.reduce((total, item) => total + Math.max(0, Number(item.quantity) || 0), 0);
}

function browserStorage() {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function readCart(storage = browserStorage()) {
  if (!storage) {
    return [];
  }

  try {
    const value = JSON.parse(storage.getItem(CART_STORAGE_KEY));
    if (value?.version !== CART_STORAGE_VERSION || !Array.isArray(value.items)) {
      return [];
    }
    return value.items.map((item) => normalizeItem(item));
  } catch {
    return [];
  }
}

export function writeCart(storageOrItems, maybeItems) {
  const storage = maybeItems === undefined ? browserStorage() : storageOrItems;
  const items = maybeItems === undefined ? storageOrItems : maybeItems;
  if (!storage) {
    return;
  }
  storage.setItem(CART_STORAGE_KEY, JSON.stringify({
    version: CART_STORAGE_VERSION,
    items,
  }));
}
