import { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { formatPrice, isOnSale } from '@/lib/format';
import type { ShopifyProduct, ShopifyConnectionStatus } from '@/lib/shopify';
import { addToCart } from '@/lib/storefrontCart';
import { getWishlist, isWishlisted, removeWishlistItem, wishlistItemFromProduct, addWishlistItem, WISHLIST_EVENT } from '@/lib/wishlist';

const DEFAULT_CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'shoulder-bags', label: 'Shoulder Bags' },
  { key: 'handbags', label: 'Handbags' },
  { key: 'sling-bags', label: 'Sling Bags' },
  { key: 'backpacks', label: 'Backpacks' },
  { key: 'laptop-bags', label: 'Laptop Bags' },
  { key: 'briefcases', label: 'Briefcases' },
  { key: 'wallets', label: 'Wallets' },
  { key: 'belts', label: 'Belts' },
  { key: 'travel-bags', label: 'Travel Bags' },
] as const;

const PRICE_RANGES = [
  { label: 'Under ₹5,000', key: '0-5000' },
  { label: '₹5,000 – ₹10,000', key: '5000-10000' },
  { label: '₹10,000 – ₹20,000', key: '10000-20000' },
  { label: 'Above ₹20,000', key: '20000-999999' },
] as const;

const COLOR_SWATCHES = [
  { color: '#1a1008', name: 'Black' },
  { color: '#8b4513', name: 'Tan' },
  { color: '#c9a96e', name: 'Camel' },
  { color: '#8b3a2a', name: 'Burgundy' },
  { color: '#2c4a3e', name: 'Forest' },
  { color: '#e8e4de', name: 'Ivory' },
  { color: '#5a4a3a', name: 'Tobacco' },
  { color: '#8a7660', name: 'Sand' },
] as const;

const MATERIAL_OPTIONS = ['Full-Grain', 'Nappa', 'Suede', 'Patent'] as const;

const SORT_OPTIONS = [
  { key: 'featured', label: 'Featured' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'title-asc', label: 'Name: A to Z' },
  { key: 'title-desc', label: 'Name: Z to A' },
] as const;

const CATEGORY_MATCHERS: Record<string, string[]> = {
  man: [' man ', ' men ', 'mens', "men's", 'briefcase', 'attache'],
  woman: [' woman ', ' women ', 'womens', "women's", 'handbag', 'shoulder'],
  'work-essentials': ['work essential', 'work essentials', 'office', 'desk', 'folio', 'organizer'],
  techpack: ['techpack', 'tech pack', 'tech', 'charger', 'cable', 'device'],
  gloves: ['glove', 'gloves'],
  'mobile-case': ['mobile case', 'phone case', 'iphone case', 'smartphone case'],
  'watch-strap': ['watch strap', 'watchband', 'watch band'],
  keychain: ['keychain', 'key chain', 'keyring', 'key ring'],
  'shoulder-bags': ['shoulder', 'hobo'],
  handbags: ['handbag', 'tote', 'satchel', 'top-handle'],
  'sling-bags': ['sling', 'crossbody'],
  backpacks: ['backpack', 'rucksack'],
  'laptop-bags': ['laptop', 'messenger', 'office'],
  briefcases: ['briefcase', 'attache'],
  wallets: ['wallet', 'cardholder'],
  belts: ['belt'],
  'travel-bags': ['travel', 'duffle', 'duffel', 'weekender'],
} as const;

const COLOR_MATCHERS: Record<string, string[]> = {
  Black: ['black', 'noir'],
  Tan: ['tan', 'brown', 'cognac'],
  Camel: ['camel', 'beige'],
  Burgundy: ['burgundy', 'maroon', 'wine'],
  Forest: ['forest', 'green', 'olive'],
  Ivory: ['ivory', 'cream', 'white'],
  Tobacco: ['tobacco', 'chestnut'],
  Sand: ['sand', 'taupe', 'stone'],
};

const MATERIAL_MATCHERS: Record<string, string[]> = {
  'Full-Grain': ['full-grain', 'full grain', 'genuine leather', 'leather'],
  Nappa: ['nappa'],
  Suede: ['suede'],
  Patent: ['patent'],
};

const BATCH = 12;

type CategoryKey = 'all' | keyof typeof CATEGORY_MATCHERS;
type SortKey = (typeof SORT_OPTIONS)[number]['key'];
type CategoryTab = { key: CategoryKey; label: string };

interface Props {
  products: ShopifyProduct[];
  status: ShopifyConnectionStatus;
  title?: string;
  kicker?: string;
  breadcrumbLabel?: string;
  metaItems?: string[];
  embedded?: boolean;
  categoryTabs?: CategoryTab[];
}

interface CatalogItem {
  product: ShopifyProduct;
  searchText: string;
  colors: string[];
  materials: string[];
}

function normalizeProductText(product: ShopifyProduct): string {
  return [
    product.title,
    product.handle,
    product.description,
    product.vendor,
    product.productType,
    ...product.tags,
  ].join(' ').toLowerCase();
}

function matchesAny(text: string, keywords: string[]) {
  return keywords.some(keyword => text.includes(keyword));
}

function matchesCategory(product: ShopifyProduct, searchText: string, category: CategoryKey) {
  if (category === 'all') return true;
  const keywords = CATEGORY_MATCHERS[category];
  if (keywords && matchesAny(searchText, keywords)) return true;
  return matchesAny(product.productType.toLowerCase(), keywords ?? []);
}

function inferColors(searchText: string) {
  return COLOR_SWATCHES
    .filter(({ name }) => matchesAny(searchText, COLOR_MATCHERS[name] ?? []))
    .map(({ name }) => name);
}

function inferMaterials(searchText: string) {
  const materials = MATERIAL_OPTIONS.filter(material => matchesAny(searchText, MATERIAL_MATCHERS[material] ?? []));
  return materials.length > 0 ? [...materials] : [];
}

export function AllProductsPage({
  products,
  status,
  title = 'All Products',
  kicker = 'Riva Valencia Collection',
  breadcrumbLabel = 'All Products',
  metaItems = ['Crafted in Spain', 'Full-Grain Leather'],
  embedded = false,
  categoryTabs = [...DEFAULT_CATEGORY_TABS],
}: Props) {
  const [view, setView] = useState<2 | 3 | 4>(4);
  const [filterOpen, setFilterOpen] = useState(false);
  const [shown, setShown] = useState(BATCH);
  const [scrolled, setScrolled] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [adding, setAdding] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>(categoryTabs[0]?.key ?? 'all');
  const [activePrices, setActivePrices] = useState<string[]>([]);
  const [activeColors, setActiveColors] = useState<string[]>([]);
  const [activeMaterials, setActiveMaterials] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>('featured');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [sections, setSections] = useState({ sort: true, price: true, colour: true, material: true });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = filterOpen ? 'hidden' : '';
    if (!filterOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFilterOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [filterOpen]);

  useEffect(() => {
    const syncWishlist = () => setWishlist(getWishlist().map(item => item.id));
    syncWishlist();
    window.addEventListener(WISHLIST_EVENT, syncWishlist);
    window.addEventListener('storage', syncWishlist);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, syncWishlist);
      window.removeEventListener('storage', syncWishlist);
    };
  }, []);

  useEffect(() => {
    if (!categoryTabs.some(tab => tab.key === activeCategory)) {
      setActiveCategory(categoryTabs[0]?.key ?? 'all');
    }
  }, [activeCategory, categoryTabs]);

  const catalog = useMemo<CatalogItem[]>(
    () => products.map(product => {
      const searchText = normalizeProductText(product);
      return {
        product,
        searchText,
        colors: inferColors(searchText),
        materials: inferMaterials(searchText),
      };
    }),
    [products]
  );

  const getFilterPrice = useCallback((product: ShopifyProduct) => {
    const selectedVariantId = selectedVariants[product.id];
    const selectedVariant = product.variants.edges.find(({ node }) => node.id === selectedVariantId)?.node;
    const amount = selectedVariant?.price.amount ?? product.priceRange.minVariantPrice.amount;
    return parseFloat(amount);
  }, [selectedVariants]);

  const filtered = useMemo(() => {
    const results = catalog.filter(({ product, searchText, colors, materials }) => {
      if (!matchesCategory(product, searchText, activeCategory)) return false;

      if (activePrices.length > 0) {
        const price = getFilterPrice(product);
        const inPriceRange = activePrices.some(range => {
          const [min, max] = range.split('-').map(Number);
          return price >= min && price < max;
        });
        if (!inPriceRange) return false;
      }

      if (activeColors.length > 0 && !activeColors.some(color => colors.includes(color))) return false;
      if (activeMaterials.length > 0 && !activeMaterials.some(material => materials.includes(material))) return false;
      return true;
    });

    if (sortBy === 'price-asc') {
      results.sort((a, b) => getFilterPrice(a.product) - getFilterPrice(b.product));
    } else if (sortBy === 'price-desc') {
      results.sort((a, b) => getFilterPrice(b.product) - getFilterPrice(a.product));
    } else if (sortBy === 'title-asc') {
      results.sort((a, b) => a.product.title.localeCompare(b.product.title));
    } else if (sortBy === 'title-desc') {
      results.sort((a, b) => b.product.title.localeCompare(a.product.title));
    }

    return results.map(({ product }) => product);
  }, [catalog, activeCategory, activePrices, activeColors, activeMaterials, sortBy, getFilterPrice]);

  const visible = filtered.slice(0, shown);
  const hasMore = shown < filtered.length;
  const progress = Math.round((Math.min(shown, filtered.length) / Math.max(filtered.length, 1)) * 100);
  const visibleProductIds = visible.map(product => product.id).join(',');

  useEffect(() => {
    const ro = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        ro.unobserve(entry.target);
      }),
      { threshold: 0.08 }
    );
    const t = setTimeout(() => {
      document.querySelectorAll('.cl-card:not(.in)').forEach(el => ro.observe(el));
    }, 50);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [visibleProductIds]);

  const activeFilterCount =
    (activeCategory === 'all' ? 0 : 1) +
    activePrices.length +
    activeColors.length +
    activeMaterials.length;

  const selectCategory = (category: CategoryKey) => {
    setActiveCategory(category);
    setShown(BATCH);
  };

  const togglePrice = (key: string) => {
    setActivePrices(prev => prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]);
    setShown(BATCH);
  };

  const toggleColor = (name: string) => {
    setActiveColors(prev => prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]);
    setShown(BATCH);
  };

  const toggleMaterial = (name: string) => {
    setActiveMaterials(prev => prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]);
    setShown(BATCH);
  };

  const changeSort = (nextSort: SortKey) => {
    setSortBy(nextSort);
    setShown(BATCH);
  };

  const resetFilters = () => {
    setActiveCategory('all');
    setActivePrices([]);
    setActiveColors([]);
    setActiveMaterials([]);
    setSortBy('featured');
    setShown(BATCH);
  };

  const toggleSection = (key: keyof typeof sections) => setSections(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleWishlist = useCallback((product: ShopifyProduct) => {
    if (isWishlisted(product.id)) {
      const next = removeWishlistItem(product.id);
      setWishlist(next.map(item => item.id));
      return;
    }

    const selectedVariantId = selectedVariants[product.id];
    const next = addWishlistItem(wishlistItemFromProduct(product, selectedVariantId));
    setWishlist(next.map(item => item.id));
  }, [selectedVariants]);

  const selectVariant = (productId: string, variantId: string) => {
    setSelectedVariants(prev => ({ ...prev, [productId]: variantId }));
  };

  const handleAddToCart = useCallback(async (product: ShopifyProduct) => {
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
    setAdding(prev => [...prev, product.handle]);
    try {
      await addToCart(variantGid, 1);
    } catch {
    } finally {
      setTimeout(() => setAdding(prev => prev.filter(item => item !== product.handle)), 1800);
    }
  }, [adding, selectedVariants]);

  return (
    <div className={cn('cl-page', embedded && 'embedded')}>
      {!embedded && (
        <>
          <div className="cl-crumb">
            <a href="/">Home</a>
            <span className="cl-crumb-sep">›</span>
            <span>{breadcrumbLabel}</span>
          </div>

          <div className="cl-page-head">
            <div>
              <span className="cl-page-kicker">{kicker}</span>
              <h1 className="cl-page-title">{title}</h1>
            </div>
            <div className="cl-page-meta">
              <span>{products.length} Pieces</span>
              {metaItems.map((item) => (
                <span key={item} className="cl-page-meta-group">
                  <span className="cl-page-meta-sep" />
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="cl-cat-tabs">
        {categoryTabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={cn('cl-cat-tab', activeCategory === key && 'active')}
            onClick={() => selectCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={cn('cl-bar', scrolled && 'scrolled')}>
        <div className="cl-bar-left">
          <button type="button" className="cl-filter-btn" onClick={() => setFilterOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filter &amp; Sort
          </button>
          <span className="cl-bar-count">{filtered.length} Products</span>
          {activeFilterCount > 0 && <span className="cl-bar-pill">{activeFilterCount} Active</span>}
        </div>

        <div className="cl-bar-right">
          <label className="cl-sort">
            <span className="cl-sort-label">Sort</span>
            <select
              className="cl-sort-select"
              value={sortBy}
              onChange={(e) => changeSort(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </label>

          <div className="cl-view-btns">
            {([2, 3, 4] as const).map(columns => (
              <button
                key={columns}
                type="button"
                className={cn('cl-vb', view === columns && 'active')}
                onClick={() => setView(columns)}
                title={`${columns} columns`}
              >
                <GridIcon cols={columns} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="cl-summary">
          {activeCategory !== 'all' && (
            <button type="button" className="cl-summary-chip" onClick={() => selectCategory('all')}>
              {categoryTabs.find(tab => tab.key === activeCategory)?.label}
            </button>
          )}
          {activePrices.map(range => (
            <button type="button" key={range} className="cl-summary-chip" onClick={() => togglePrice(range)}>
              {PRICE_RANGES.find(price => price.key === range)?.label}
            </button>
          ))}
          {activeColors.map(color => (
            <button type="button" key={color} className="cl-summary-chip" onClick={() => toggleColor(color)}>
              {color}
            </button>
          ))}
          {activeMaterials.map(material => (
            <button type="button" key={material} className="cl-summary-chip" onClick={() => toggleMaterial(material)}>
              {material}
            </button>
          ))}
          <button type="button" className="cl-summary-clear" onClick={resetFilters}>Clear All</button>
        </div>
      )}

      {!status.ok && (
        <div className="cl-status">
          <strong>{status.reason === 'not_configured' ? 'Shopify not connected' : 'API error'}:</strong>{' '}
          {status.message}
        </div>
      )}

      <div className="cl-grid-wrap">
        <div className={cn('cl-grid', view === 2 && 'view-2', view === 3 && 'view-3')}>
          {visible.length > 0 ? visible.map(product => {
            const image = product.images.edges[0]?.node;
            const price = product.priceRange.minVariantPrice;
            const compareAt = product.compareAtPriceRange.minVariantPrice;
            const onSale = isOnSale(price.amount, compareAt.amount);
            const isNew = product.tags.some(tag => ['new', 'new-in'].includes(tag.toLowerCase()));
            const inWishlist = wishlist.includes(product.id);
            const isAdding = adding.includes(product.handle);
            const variants = product.variants.edges;
            const selectedVariantId = selectedVariants[product.id];
            const selectedVariant = variants.find(({ node }) => node.id === selectedVariantId)?.node;
            const needsVariant = variants.length > 1 && !selectedVariantId;
            const displayPrice = selectedVariant?.price ?? price;

            return (
              <a key={product.id} className="cl-card" href={`/products/${product.handle}`}>
                <div className="cl-card-inner">
                  <div className="cl-card-img-wrap">
                    {image
                      ? <img src={image.url} alt={image.altText ?? product.title} loading="lazy" />
                      : <div className="cl-card-img-ph" />
                    }

                    {isNew && <span className="cl-card-badge new">New In</span>}
                    {onSale && !isNew && <span className="cl-card-badge sale">Sale</span>}
                    {!product.availableForSale && <span className="cl-card-badge">Sold Out</span>}

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
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                            : `Quick Add — ${formatPrice(displayPrice.amount, displayPrice.currencyCode)}`
                        }
                      </button>
                    )}
                  </div>

                  <div className="cl-card-info">
                    <span className="cl-card-cat">{product.vendor || product.productType || 'Leather Goods'}</span>
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
                            className={cn('cl-card-variant', selectedVariantId === variant.id && 'selected')}
                            disabled={!variant.availableForSale}
                            title={variant.availableForSale ? variant.title : `${variant.title} (Sold Out)`}
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
          }) : (
            <div className="cl-empty" style={{ gridColumn: '1 / -1' }}>
              <h3>No Products Found</h3>
              <p>
                {!status.ok
                  ? 'Connect your Shopify store to display products.'
                  : 'Try a different category or clear a few filters.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {filtered.length > BATCH && (
        <div className="cl-loadmore">
          <div className="cl-lm-prog">
            <div className="cl-lm-prog-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="cl-lm-label">Showing {Math.min(shown, filtered.length)} of {filtered.length} products</span>
          {hasMore && (
            <button type="button" className="cl-lm-btn" onClick={() => setShown(current => current + BATCH)}>
              Load More
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div className={cn('rv-mask', filterOpen && 'open')} style={{ zIndex: 950 }} onClick={() => setFilterOpen(false)} />

      <div className={cn('cl-fd', filterOpen && 'open')}>
        <div className="cl-fd-top">
          <div>
            <span className="cl-fd-title">Filter &amp; Sort</span>
            <p className="cl-fd-meta">{filtered.length} matching products</p>
          </div>
          <button type="button" className="cl-fd-x" onClick={() => setFilterOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="cl-fd-body">
          <div className="cl-fd-section">
            <button type="button" className={cn('cl-fd-sec-btn', sections.sort && 'open')} onClick={() => toggleSection('sort')}>
              Sort By
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className={cn('cl-fd-sec-content', sections.sort && 'open')}>
              <div className="cl-fd-chips">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.key}
                    type="button"
                    className={cn('cl-fd-chip', sortBy === option.key && 'active')}
                    onClick={() => changeSort(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="cl-fd-section">
            <button type="button" className={cn('cl-fd-sec-btn', sections.price && 'open')} onClick={() => toggleSection('price')}>
              Price Range
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className={cn('cl-fd-sec-content', sections.price && 'open')}>
              <div className="cl-fd-chips">
                {PRICE_RANGES.map(({ label, key }) => (
                  <button
                    key={key}
                    type="button"
                    className={cn('cl-fd-chip', activePrices.includes(key) && 'active')}
                    onClick={() => togglePrice(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="cl-fd-section">
            <button type="button" className={cn('cl-fd-sec-btn', sections.colour && 'open')} onClick={() => toggleSection('colour')}>
              Colour
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className={cn('cl-fd-sec-content', sections.colour && 'open')}>
              <div className="cl-fd-color-grid">
                {COLOR_SWATCHES.map(({ color, name }) => (
                  <button
                    key={name}
                    type="button"
                    className={cn('cl-fd-swatch', activeColors.includes(name) && 'active')}
                    style={{ background: color }}
                    title={name}
                    aria-label={name}
                    onClick={() => toggleColor(name)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="cl-fd-section">
            <button type="button" className={cn('cl-fd-sec-btn', sections.material && 'open')} onClick={() => toggleSection('material')}>
              Material
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className={cn('cl-fd-sec-content', sections.material && 'open')}>
              <div className="cl-fd-chips">
                {MATERIAL_OPTIONS.map(material => (
                  <button
                    key={material}
                    type="button"
                    className={cn('cl-fd-chip', activeMaterials.includes(material) && 'active')}
                    onClick={() => toggleMaterial(material)}
                  >
                    {material}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="cl-fd-foot">
          <button type="button" className="cl-fd-reset" onClick={resetFilters}>Reset</button>
          <button type="button" className="cl-fd-apply" onClick={() => setFilterOpen(false)}>
            View {filtered.length} Results
          </button>
        </div>
      </div>
    </div>
  );
}

function GridIcon({ cols }: { cols: 2 | 3 | 4 }) {
  const rects: [number, number, number, number][] =
    cols === 2 ? [[1, 1, 6, 14], [9, 1, 6, 14]]
    : cols === 3 ? [[1, 1, 3.5, 14], [6.25, 1, 3.5, 14], [11.5, 1, 3.5, 14]]
    : [[1, 1, 2.5, 14], [4.8, 1, 2.5, 14], [8.6, 1, 2.5, 14], [12.4, 1, 2.5, 14]];

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      {rects.map(([x, y, width, height], index) => (
        <rect key={index} x={x} y={y} width={width} height={height} rx="0.5" />
      ))}
    </svg>
  );
}
