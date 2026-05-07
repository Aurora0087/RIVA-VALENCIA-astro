import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { formatPrice, isOnSale } from '@/lib/format';
import type { ShopifyProduct } from '@/lib/shopify';
import { addToCart } from '@/lib/storefrontCart';
import {
  getWishlist,
  isWishlisted,
  removeWishlistItem,
  wishlistItemFromProduct,
  addWishlistItem,
  WISHLIST_EVENT,
} from '@/lib/wishlist';

interface Props {
  products: ShopifyProduct[];
  mode?: 'grid' | 'carousel';
}

export function ProductGrid({ products, mode = 'grid' }: Props) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [adding, setAdding] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const rootRef = useRef<HTMLDivElement | null>(null);
  const swiperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sync = () => setWishlist(getWishlist().map((i) => i.id));
    sync();
    window.addEventListener(WISHLIST_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    const ro = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          ro.unobserve(entry.target);
        }),
      { threshold: 0.08 }
    );
    const t = setTimeout(() => {
      rootRef.current?.querySelectorAll('.cl-card:not(.in)').forEach((el) => ro.observe(el));
    }, 50);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [products, mode]);

  useEffect(() => {
    if (mode !== 'carousel') return;
    const swiperEl = swiperRef.current;
    const SwiperCtor = (window as any).Swiper;

    if (!swiperEl || !SwiperCtor) return;

    const existingInstance = (swiperEl as any).swiper;
    if (existingInstance) {
      existingInstance.update();
      return;
    }

    const instance = new SwiperCtor(swiperEl, {
      speed: 900,
      grabCursor: true,
      watchOverflow: true,
      observer: true,
      observeParents: true,
      slidesPerView: 1.12,
      spaceBetween: 12,
      breakpoints: {
        640: { slidesPerView: 2.15, spaceBetween: 16 },
        960: { slidesPerView: 3.15, spaceBetween: 20 },
        1280: { slidesPerView: 4.1, spaceBetween: 24 },
      },
    });

    return () => {
      instance?.destroy?.(true, true);
    };
  }, [mode, products.length]);

  const toggleWishlist = useCallback(
    (product: ShopifyProduct) => {
      if (isWishlisted(product.id)) {
        const next = removeWishlistItem(product.id);
        setWishlist(next.map((i) => i.id));
        return;
      }
      const next = addWishlistItem(
        wishlistItemFromProduct(product, selectedVariants[product.id])
      );
      setWishlist(next.map((i) => i.id));
    },
    [selectedVariants]
  );

  const selectVariant = (productId: string, variantId: string) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variantId }));
  };

  const handleAddToCart = useCallback(
    async (product: ShopifyProduct) => {
      if (adding.includes(product.handle)) return;

      const variants = product.variants.edges;
      let variantGid: string | undefined;

      if (variants.length <= 1) {
        variantGid = variants[0]?.node.id;
      } else {
        const selectedVariantId = selectedVariants[product.id];
        if (!selectedVariantId) {
          window.location.href = `/products/${product.handle}`;
          return;
        }
        variantGid = selectedVariantId;
      }

      if (!variantGid) return;
      setAdding((prev) => [...prev, product.handle]);
      try {
        await addToCart(variantGid, 1);
      } catch {
      } finally {
        setTimeout(
          () => setAdding((prev) => prev.filter((h) => h !== product.handle)),
          1800
        );
      }
    },
    [adding, selectedVariants]
  );

  const renderProductCard = (product: ShopifyProduct) => {
    const image = product.images.edges[0]?.node;
    const price = product.priceRange.minVariantPrice;
    const compareAt = product.compareAtPriceRange.minVariantPrice;
    const onSale = isOnSale(price.amount, compareAt.amount);
    const isNew = product.tags.some((t) =>
      ['new', 'new-in'].includes(t.toLowerCase())
    );
    const inWishlist = wishlist.includes(product.id);
    const isAdding = adding.includes(product.handle);
    const variants = product.variants.edges;
    const selectedVariantId = selectedVariants[product.id];
    const selectedVariant = variants.find(
      ({ node }) => node.id === selectedVariantId
    )?.node;
    const needsVariant = variants.length > 1 && !selectedVariantId;
    const displayPrice = selectedVariant?.price ?? price;

    return (
      <a className="cl-card" href={`/products/${product.handle}`}>
        <div className="cl-card-inner">
          <div className="cl-card-img-wrap">
            {image ? (
              <img
                src={image.url}
                alt={image.altText ?? product.title}
                loading="lazy"
              />
            ) : (
              <div className="cl-card-img-ph" />
            )}

            {isNew && <span className="cl-card-badge new">New In</span>}
            {onSale && !isNew && <span className="cl-card-badge sale">Sale</span>}
            {!product.availableForSale && (
              <span className="cl-card-badge">Sold Out</span>
            )}

            <div className="cl-card-actions">
              <button
                type="button"
                className="cl-card-action"
                title="Wishlist"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleWishlist(product);
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill={inWishlist ? '#8b3a2a' : 'none'}
                  stroke={inWishlist ? '#8b3a2a' : 'currentColor'}
                  strokeWidth="1.5"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </button>

              <button
                type="button"
                className="cl-card-action"
                title="Quick view"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/products/${product.handle}`;
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>

            {product.availableForSale && (
              <button
                type="button"
                className={cn('cl-card-quick', isAdding && 'added')}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCart(product);
                }}
              >
                {isAdding
                  ? 'Added ✓'
                  : needsVariant
                  ? 'Select Options →'
                  : `Quick Add — ${formatPrice(displayPrice.amount, displayPrice.currencyCode)}`}
              </button>
            )}
          </div>

          <div className="cl-card-info">
            <span className="cl-card-cat">
              {product.vendor || product.productType || 'Leather Goods'}
            </span>
            <span className="cl-card-name">{product.title}</span>
            <div className="cl-card-bottom">
              <span>
                <span className="cl-card-price">
                  {formatPrice(displayPrice.amount, displayPrice.currencyCode)}
                </span>
                {onSale && !selectedVariant && (
                  <span className="cl-card-price-old">
                    {formatPrice(compareAt.amount, compareAt.currencyCode)}
                  </span>
                )}
              </span>
            </div>

            {variants.length > 1 && (
              <div className="cl-card-variants">
                {variants.map(({ node: variant }) => (
                  <button
                    key={variant.id}
                    type="button"
                    className={cn(
                      'cl-card-variant',
                      selectedVariantId === variant.id && 'selected'
                    )}
                    disabled={!variant.availableForSale}
                    title={
                      variant.availableForSale
                        ? variant.title
                        : `${variant.title} (Sold Out)`
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selectVariant(product.id, variant.id);
                    }}
                  >
                    {variant.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </a>
    );
  };

  if (mode === 'carousel') {
    return (
      <div ref={rootRef} className="cl-carousel-wrap">
        {products.length > 0 ? (
          <div ref={swiperRef} className="swiper cl-carousel-swiper">
            <div className="swiper-wrapper">
              {products.map((product) => (
                <div key={product.id} className="swiper-slide cl-carousel-slide">
                  {renderProductCard(product)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="cl-empty">
            <h3>No Products Found</h3>
            <p>Try again once this collection has been updated.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="cl-grid-wrap">
      <div className="cl-grid">
        {products.map((product) => (
          <div key={product.id}>{renderProductCard(product)}</div>
        ))}
      </div>
    </div>
  );
}
