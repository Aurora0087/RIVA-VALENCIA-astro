import { createStorefrontApiClient } from '@shopify/storefront-api-client';

const SHOPIFY_DOMAIN = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN as string | undefined;
const SHOPIFY_TOKEN = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN as string | undefined;

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface ShopifySelectedOption {
  name: string;
  value: string;
}

export interface ShopifyProductOption {
  name: string;
  values: string[];
}

export interface ShopifyCollectionRef {
  handle: string;
  title: string;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  sku?: string | null;
  availableForSale: boolean;
  price: ShopifyMoney;
  compareAtPrice?: ShopifyMoney | null;
  image?: ShopifyImage | null;
  selectedOptions?: ShopifySelectedOption[];
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  availableForSale: boolean;
  vendor: string;
  productType: string;
  tags: string[];
  options?: ShopifyProductOption[];
  collections?: { edges: { node: ShopifyCollectionRef }[] };
  priceRange: { minVariantPrice: ShopifyMoney };
  compareAtPriceRange: { minVariantPrice: ShopifyMoney };
  images: { edges: { node: ShopifyImage }[] };
  variants: { edges: { node: ShopifyVariant }[] };
}

export interface ShopifyCollection {
  id: string;
  title: string;
  description: string;
  image: { url: string; altText: string | null } | null;
  products: { edges: { node: ShopifyProduct }[] };
}

export type ShopifyConnectionStatus =
  | { ok: true; domain: string }
  | { ok: false; reason: 'not_configured' | 'api_error'; message: string };

function createClient() {
  return createStorefrontApiClient({
    storeDomain: SHOPIFY_DOMAIN!,
    apiVersion: '2026-04',
    publicAccessToken: SHOPIFY_TOKEN!,
  });
}

const PRODUCT_BASE_FIELDS = `
  id
  title
  handle
  description
  availableForSale
  vendor
  productType
  tags
  priceRange { minVariantPrice { amount currencyCode } }
  compareAtPriceRange { minVariantPrice { amount currencyCode } }
`;

const PRODUCT_LIST_FIELDS = `
  ${PRODUCT_BASE_FIELDS}
  images(first: 1) {
    edges {
      node {
        url
        altText
        width
        height
      }
    }
  }
  variants(first: 5) {
    edges {
      node {
        id
        title
        availableForSale
        price { amount currencyCode }
      }
    }
  }
`;

const PRODUCT_DETAIL_FIELDS = `
  ${PRODUCT_BASE_FIELDS}
  options { name values }
  collections(first: 1) {
    edges {
      node {
        handle
        title
      }
    }
  }
  images(first: 8) {
    edges {
      node {
        url
        altText
        width
        height
      }
    }
  }
  variants(first: 20) {
    edges {
      node {
        id
        title
        sku
        availableForSale
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
        image {
          url
          altText
          width
          height
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
`;

const COLLECTION_QUERY = `#graphql
  query GetCollection($handle: String!) {
    collection(handle: $handle) {
      id
      title
      description
      image { url altText }
      products(first: 50) {
        edges {
          node {
            ${PRODUCT_LIST_FIELDS}
          }
        }
      }
    }
  }
`;

export async function getCollectionByHandle(
  handle: string
): Promise<{ collection: ShopifyCollection | null; status: ShopifyConnectionStatus }> {
  if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) {
    return {
      collection: null,
      status: {
        ok: false,
        reason: 'not_configured',
        message:
          'PUBLIC_SHOPIFY_STORE_DOMAIN and PUBLIC_SHOPIFY_STOREFRONT_TOKEN are not set in .env',
      },
    };
  }

  try {
    const client = createClient();
    const { data, errors } = await client.request<{
      collection: ShopifyCollection | null;
    }>(COLLECTION_QUERY, { variables: { handle } });
    

    if (errors) {
      throw new Error(errors.message ?? JSON.stringify(errors.graphQLErrors));
    }

    return {
      collection: data?.collection ?? null,
      status: { ok: true, domain: SHOPIFY_DOMAIN },
    };
  } catch (err) {
    return {
      collection: null,
      status: {
        ok: false,
        reason: 'api_error',
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

export interface CollectionStub {
  handle: string;
  title: string;
  productsCount: number;
}

export async function getAllCollections(): Promise<CollectionStub[]> {
  if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) return [];

  try {
    const client = createClient();
    const { data } = await client.request<{
      collections: { edges: { node: { handle: string; title: string; products: { edges: unknown[] } } }[] };
    }>(`#graphql
      query ListCollections {
        collections(first: 50) {
          edges {
            node {
              handle
              title
              products(first: 1) { edges { node { id } } }
            }
          }
        }
      }
    `);

    return (
      data?.collections.edges.map((e) => ({
        handle: e.node.handle,
        title: e.node.title,
        productsCount: e.node.products.edges.length,
      })) ?? []
    );
  } catch {
    return [];
  }
}

export async function getAllProducts(
  first: number = 50
): Promise<{ products: ShopifyProduct[]; status: ShopifyConnectionStatus }> {
  if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) {
    return {
      products: [],
      status: { ok: false, reason: 'not_configured', message: 'PUBLIC_SHOPIFY_STORE_DOMAIN and PUBLIC_SHOPIFY_STOREFRONT_TOKEN are not set in .env' },
    };
  }
  try {
    const client = createClient();
    const { data, errors } = await client.request<{
      products: { edges: { node: ShopifyProduct }[] };
    }>(`#graphql
      query GetAllProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              ${PRODUCT_LIST_FIELDS}
            }
          }
        }
      }
    `, { variables: { first } });
    if (errors) throw new Error(errors.message ?? JSON.stringify(errors.graphQLErrors));
    return {
      products: data?.products.edges.map((e) => e.node) ?? [],
      status: { ok: true, domain: SHOPIFY_DOMAIN },
    };
  } catch (err) {
    return {
      products: [],
      status: { ok: false, reason: 'api_error', message: err instanceof Error ? err.message : String(err) },
    };
  }
}

const PRODUCT_DETAIL_QUERY = `#graphql
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      ${PRODUCT_DETAIL_FIELDS}
    }
  }
`;

export async function getProductByHandle(
  handle: string
): Promise<{ product: ShopifyProduct | null; status: ShopifyConnectionStatus }> {
  if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) {
    return {
      product: null,
      status: {
        ok: false,
        reason: 'not_configured',
        message: 'PUBLIC_SHOPIFY_STORE_DOMAIN and PUBLIC_SHOPIFY_STOREFRONT_TOKEN are not set in .env',
      },
    };
  }

  try {
    const client = createClient();
    const { data, errors } = await client.request<{
      product: ShopifyProduct | null;
    }>(PRODUCT_DETAIL_QUERY, { variables: { handle } });

    if (errors) throw new Error(errors.message ?? JSON.stringify(errors.graphQLErrors));

    return {
      product: data?.product ?? null,
      status: { ok: true, domain: SHOPIFY_DOMAIN },
    };
  } catch (err) {
    return {
      product: null,
      status: {
        ok: false,
        reason: 'api_error',
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

const PRODUCT_RECOMMENDATIONS_QUERY = `#graphql
  query GetProductRecommendations($productId: ID!) {
    productRecommendations(productId: $productId) {
      ${PRODUCT_LIST_FIELDS}
    }
  }
`;

export async function getProductRecommendations(
  productId: string
): Promise<ShopifyProduct[]> {
  if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) return [];

  try {
    const client = createClient();
    const { data, errors } = await client.request<{
      productRecommendations: ShopifyProduct[];
    }>(PRODUCT_RECOMMENDATIONS_QUERY, { variables: { productId } });

    if (errors) throw new Error(errors.message ?? JSON.stringify(errors.graphQLErrors));

    return data?.productRecommendations ?? [];
  } catch {
    return [];
  }
}

export function formatPrice(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}

export function isOnSale(product: ShopifyProduct): boolean {
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const compareAt = parseFloat(product.compareAtPriceRange.minVariantPrice.amount);
  return compareAt > 0 && compareAt > price;
}
