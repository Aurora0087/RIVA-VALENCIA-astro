import { getAllProducts, isOnSale } from '@/lib/shopify';
import { wishlistItemFromProduct } from '@/lib/wishlist';

export const prerender = true;

export async function GET() {
  const { products, status } = await getAllProducts(100);

  const items = products.map((product) => {
    const firstVariant =
      product.variants.edges.find(({ node }) => node.availableForSale)?.node ??
      product.variants.edges[0]?.node;
    const image = product.images.edges[0]?.node;
    const price = firstVariant?.price ?? product.priceRange.minVariantPrice;
    const compareAt = product.compareAtPriceRange.minVariantPrice;

    return {
      id: product.id,
      handle: product.handle,
      title: product.title,
      description: product.description,
      vendor: product.vendor,
      productType: product.productType || 'Leather Goods',
      tags: product.tags,
      url: `/products/${product.handle}`,
      image: image?.url ?? '',
      imageAlt: image?.altText ?? product.title,
      availableForSale: product.availableForSale && firstVariant?.availableForSale !== false,
      variantId: firstVariant?.id ?? '',
      priceAmount: price.amount,
      compareAtAmount: compareAt.amount,
      currencyCode: price.currencyCode,
      onSale: isOnSale(product),
      wishlistItem: wishlistItemFromProduct(product, firstVariant?.id),
      searchText: [
        product.title,
        product.handle,
        product.description,
        product.vendor,
        product.productType,
        ...product.tags,
      ].join(' ').toLowerCase(),
    };
  });

  return new Response(JSON.stringify({ items, status }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
