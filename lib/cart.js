export const CART_UPDATED_EVENT = 'bgy-cart-updated';
const CART_KEY = 'bgy-store-cart';

function safeStorage() {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage; } catch { return null; }
}

export function getCartItems() {
  const storage = safeStorage();
  if (!storage) return [];
  try {
    const items = JSON.parse(storage.getItem(CART_KEY) || '[]');
    return Array.isArray(items) ? items.filter(item => item?.id && item?.title) : [];
  } catch {
    return [];
  }
}

export function addCartItem(product) {
  const storage = safeStorage();
  if (!storage || !product?.id) return 0;
  const item = {
    id: product.id,
    title: product.title,
    slug: product.slug,
    type: product.type,
    sale_price: product.sale_price,
  };
  const next = [item, ...getCartItems().filter(existing => existing.id !== item.id)].slice(0, 30);
  storage.setItem(CART_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { count: next.length } }));
  return next.length;
}
