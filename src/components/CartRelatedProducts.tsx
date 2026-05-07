import { useEffect, useState } from 'react';
import { ProductGrid } from '@/components/ProductGrid';
import type { ShopifyProduct } from '@/lib/shopify';
import { CART_EVENT, type StorefrontCart } from '@/lib/storefrontCart';

interface Props {
  products: ShopifyProduct[];
}

interface CartApi {
  getCart: (createIfMissing?: boolean) => Promise<StorefrontCart | null>;
}

export function CartRelatedProducts({ products }: Props) {
  const [relatedProducts, setRelatedProducts] = useState<ShopifyProduct[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const syncRelatedProducts = async () => {
      const cartWindow = window as typeof window & {
        RivaCart?: CartApi;
        RivaCartReady?: Promise<CartApi>;
      };

      try {
        const cartApi = cartWindow.RivaCart || await cartWindow.RivaCartReady;
        const cart = await cartApi?.getCart(false);
        if (!cart?.totalQuantity) {
          if (!cancelled) {
            setRelatedProducts([]);
            setReady(true);
          }
          return;
        }

        const cartHandles = new Set(
          cart?.lines.edges.map((edge) => edge.node.merchandise.product.handle) ?? []
        );
        const nextProducts = products
          .filter((product) => !cartHandles.has(product.handle))
          .slice(0, 8);

        if (!cancelled) {
          setRelatedProducts(nextProducts);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setRelatedProducts([]);
          setReady(true);
        }
      }
    };

    const onCartChange = () => {
      void syncRelatedProducts();
    };

    void syncRelatedProducts();
    window.addEventListener(CART_EVENT, onCartChange);
    window.addEventListener('storage', onCartChange);

    return () => {
      cancelled = true;
      window.removeEventListener(CART_EVENT, onCartChange);
      window.removeEventListener('storage', onCartChange);
    };
  }, [products]);

  if (!ready || relatedProducts.length === 0) return null;

  return (
    <section className="rv-cart-related">
      <div className="rv-sh rv-reveal">
        <h2>Complete the Look</h2>
        <p>Pieces that pair beautifully with your selection</p>
      </div>
      <ProductGrid products={relatedProducts} />
    </section>
  );
}
