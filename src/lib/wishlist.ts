import type { ShopifyProduct } from '@/lib/shopify';

export const WISHLIST_STORAGE_KEY = 'rv_wishlist';
export const WISHLIST_EVENT = 'rv:wishlist-changed';

export interface WishlistItem {
  id: string;
  productId: string;
  handle: string;
  title: string;
  type: string;
  vendor: string;
  url: string;
  image: string;
  imageAlt: string;
  variantId: string;
  availableForSale: boolean;
  priceAmount: string;
  compareAtAmount: string;
  currencyCode: string;
  tags: string[];
  addedAt: number;
}

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function dispatchWishlistChange(items: WishlistItem[]) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: { items } }));
  window.dispatchEvent(new CustomEvent('rv_wishlist_changed', { detail: { items } }));
}

function normalizeItem(item: Partial<WishlistItem>): WishlistItem | null {
  const id = String(item.id || item.productId || item.handle || '').trim();
  const handle = String(item.handle || '').trim();
  const title = String(item.title || '').trim();

  if (!id || !handle || !title) return null;

  return {
    id,
    productId: String(item.productId || id),
    handle,
    title,
    type: String(item.type || 'Leather Goods'),
    vendor: String(item.vendor || ''),
    url: String(item.url || `/products/${handle}`),
    image: String(item.image || ''),
    imageAlt: String(item.imageAlt || title),
    variantId: String(item.variantId || ''),
    availableForSale: item.availableForSale !== false,
    priceAmount: String(item.priceAmount || '0'),
    compareAtAmount: String(item.compareAtAmount || '0'),
    currencyCode: String(item.currencyCode || 'INR'),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    addedAt: Number(item.addedAt || Date.now()),
  };
}

export function getWishlist(): WishlistItem[] {
  if (!canUseStorage()) return [];

  try {
    const raw = JSON.parse(window.localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeItem).filter((item): item is WishlistItem => Boolean(item));
  } catch {
    return [];
  }
}

export function setWishlist(items: WishlistItem[]) {
  if (!canUseStorage()) return [];

  const unique = new Map<string, WishlistItem>();
  items.forEach((item) => {
    const normalized = normalizeItem(item);
    if (normalized) unique.set(normalized.id, normalized);
  });

  const next = Array.from(unique.values());
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
  dispatchWishlistChange(next);
  return next;
}

export function isWishlisted(id: string) {
  return getWishlist().some((item) => item.id === id);
}

export function addWishlistItem(item: WishlistItem) {
  const normalized = normalizeItem(item);
  if (!normalized) return getWishlist();

  const existing = getWishlist();
  const previous = existing.find((entry) => entry.id === normalized.id);
  const next = [
    { ...previous, ...normalized, addedAt: previous?.addedAt ?? Date.now() },
    ...existing.filter((entry) => entry.id !== normalized.id),
  ];

  return setWishlist(next);
}

export function removeWishlistItem(id: string) {
  return setWishlist(getWishlist().filter((item) => item.id !== id));
}

export function clearWishlist() {
  return setWishlist([]);
}

export function toggleWishlistItem(item: WishlistItem) {
  const exists = isWishlisted(item.id);
  const items = exists ? removeWishlistItem(item.id) : addWishlistItem(item);
  return { wished: !exists, items };
}

export function wishlistItemFromProduct(product: ShopifyProduct, variantId?: string): WishlistItem {
  const selectedVariant =
    product.variants.edges.find(({ node }) => node.id === variantId)?.node ??
    product.variants.edges.find(({ node }) => node.availableForSale)?.node ??
    product.variants.edges[0]?.node;
  const image = selectedVariant?.image ?? product.images.edges[0]?.node;
  const price = selectedVariant?.price ?? product.priceRange.minVariantPrice;
  const compareAt = selectedVariant?.compareAtPrice ?? product.compareAtPriceRange.minVariantPrice;

  return {
    id: product.id,
    productId: product.id,
    handle: product.handle,
    title: product.title,
    type: product.productType || 'Leather Goods',
    vendor: product.vendor || '',
    url: `/products/${product.handle}`,
    image: image?.url ?? '',
    imageAlt: image?.altText ?? product.title,
    variantId: selectedVariant?.id ?? '',
    availableForSale: product.availableForSale && selectedVariant?.availableForSale !== false,
    priceAmount: price.amount,
    compareAtAmount: compareAt?.amount ?? '0',
    currencyCode: price.currencyCode,
    tags: product.tags,
    addedAt: Date.now(),
  };
}
