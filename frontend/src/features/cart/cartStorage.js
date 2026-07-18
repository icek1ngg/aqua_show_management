export const CART_STORAGE_KEY = 'aquapulse.cart.v2';
export const CART_STORAGE_VERSION = 2;
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
  if (!item || typeof item !== 'object') return null;
  const scheduleId = String(item.scheduleId || '').trim();
  const ticketType = normalizeTicketType(item.ticketType);
  if (!scheduleId || !['STANDARD', 'VIP', 'FAMILY'].includes(ticketType)) return null;
  let initialQuantity = item?.quantity;
  let ages = item?.ages;

  if (!ages) {
    ages = { adult: initialQuantity ? Number(initialQuantity) : 1, child: 0, senior: 0 };
  }
  
  ages = {
    adult: Math.max(0, Math.trunc(Number(ages.adult) || 0)),
    child: Math.max(0, Math.trunc(Number(ages.child) || 0)),
    senior: Math.max(0, Math.trunc(Number(ages.senior) || 0)),
  };
  const total = ages.adult + ages.child + ages.senior;
  const clampedQuantity = clampQuantity(total, maxQuantity);
  
  if (total !== clampedQuantity) {
    ages = { adult: clampedQuantity, child: 0, senior: 0 };
  }

  return {
    ...item,
    scheduleId,
    ticketType,
    quantity: clampedQuantity,
    ages,
  };
}

export function addCartItem(items, item, maxQuantity = CART_MAX_QUANTITY) {
  const normalizedItem = normalizeItem(item, maxQuantity);
  if (!normalizedItem) return Array.isArray(items) ? items : [];
  const key = cartItemKey(normalizedItem);
  const existingIndex = items.findIndex((candidate) => cartItemKey(candidate) === key);

  if (existingIndex < 0) {
    return [...items, normalizedItem];
  }

  return items.map((candidate, index) => {
    if (index !== existingIndex) {
      return candidate;
    }
    const newAges = {
      adult: (candidate.ages?.adult || 0) + (normalizedItem.ages?.adult || 0),
      child: (candidate.ages?.child || 0) + (normalizedItem.ages?.child || 0),
      senior: (candidate.ages?.senior || 0) + (normalizedItem.ages?.senior || 0),
    };
    const totalAges = newAges.adult + newAges.child + newAges.senior;
    const clampedQuantity = clampQuantity(totalAges, maxQuantity);
    
    if (totalAges !== clampedQuantity) {
      newAges.adult = clampedQuantity;
      newAges.child = 0;
      newAges.senior = 0;
    }

    return {
      ...candidate,
      ...normalizedItem,
      quantity: clampedQuantity,
      ages: newAges,
    };
  });
}

export function addCartItems(items, additions) {
  return (Array.isArray(additions) ? additions : []).reduce(
    (currentItems, item) => addCartItem(currentItems, item, item?.availableTickets),
    items,
  );
}

export function updateCartItemQuantity(items, key, quantity, maxQuantity = CART_MAX_QUANTITY, ages = null) {
  return items.map((item) => {
    if (cartItemKey(item) === key) {
      let newAges = ages;
      if (!newAges) {
        const currentTotal = (item.ages?.adult || 0) + (item.ages?.child || 0) + (item.ages?.senior || 0);
        if (item.ages && currentTotal === quantity) {
          newAges = item.ages;
        } else {
          newAges = { adult: quantity, child: 0, senior: 0 };
        }
      }
      let total = (newAges.adult || 0) + (newAges.child || 0) + (newAges.senior || 0);
      let clampedQuantity = clampQuantity(total, maxQuantity);
      if (total !== clampedQuantity) {
        newAges = { adult: clampedQuantity, child: 0, senior: 0 };
      }
      return { ...item, quantity: clampedQuantity, ages: newAges };
    }
    return item;
  });
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
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function cartStorageKey(owner = 'guest') {
  const normalizedOwner = String(owner || 'guest').trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
  return `${CART_STORAGE_KEY}:${normalizedOwner || 'guest'}`;
}

export function readCart(storage) {
  const resolvedStorage = arguments.length === 0 ? browserStorage() : storage;
  if (!resolvedStorage) {
    return [];
  }

  try {
    const value = JSON.parse(resolvedStorage.getItem(CART_STORAGE_KEY));
    if (value?.version !== CART_STORAGE_VERSION || !Array.isArray(value.items)) {
      return [];
    }
    return value.items.map((item) => normalizeItem(item)).filter(Boolean);
  } catch {
    return [];
  }
}

export function readCartForOwner(owner, storage = browserStorage()) {
  if (!storage) return [];
  try {
    const value = JSON.parse(storage.getItem(cartStorageKey(owner)));
    if (value?.version !== CART_STORAGE_VERSION || value?.owner !== String(owner || 'guest') || !Array.isArray(value.items)) return [];
    return value.items.map((item) => normalizeItem(item)).filter(Boolean);
  } catch {
    return [];
  }
}

export function writeCartForOwner(owner, items, storage = browserStorage()) {
  if (!storage) return;
  const normalizedItems = (Array.isArray(items) ? items : []).map((item) => normalizeItem(item)).filter(Boolean);
  try {
    storage.setItem(cartStorageKey(owner), JSON.stringify({
      version: CART_STORAGE_VERSION,
      owner: String(owner || 'guest'),
      items: normalizedItems,
    }));
  } catch {
    // Persistence remains best-effort.
  }
}

export function writeCart(storageOrItems, maybeItems) {
  const hasInjectedStorage = arguments.length >= 2;
  const storage = hasInjectedStorage ? storageOrItems : browserStorage();
  const items = hasInjectedStorage ? maybeItems : storageOrItems;
  if (!storage) {
    return;
  }
  try {
    storage.setItem(CART_STORAGE_KEY, JSON.stringify({
      version: CART_STORAGE_VERSION,
      items,
    }));
  } catch {
    // Persistence is best-effort; the CartContext continues to own the in-memory cart.
  }
}
