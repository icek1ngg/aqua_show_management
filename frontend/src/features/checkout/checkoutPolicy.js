export const MAX_CHECKOUT_TICKETS = 10;

export const CHECKOUT_QUANTITY_ERROR = `A booking can contain at most ${MAX_CHECKOUT_TICKETS} tickets.`;

export function checkoutTotalQuantity(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((total, item) => {
    const quantity = Number(item?.quantity);
    return total + (Number.isFinite(quantity) ? Math.max(0, quantity) : 0);
  }, 0);
}

export function isCheckoutQuantityAllowed(items) {
  if (!Array.isArray(items) || items.length === 0) return false;
  const quantities = items.map(item => Number(item?.quantity));
  return quantities.every(quantity => Number.isInteger(quantity) && quantity > 0)
    && quantities.reduce((total, quantity) => total + quantity, 0) <= MAX_CHECKOUT_TICKETS;
}
