const SHOPIFY_DOMAIN = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN as string | undefined;
const SHOPIFY_TOKEN = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN as string | undefined;
const SHOPIFY_API_VERSION = '2026-04';
const CART_STORAGE_KEY = 'rv-storefront-cart-id';
export const CART_EVENT = 'rv_cart_changed';

export interface StorefrontMoney {
  amount: string;
  currencyCode: string;
}

export interface StorefrontCartDeliveryOption {
  handle: string;
  title?: string | null;
  code?: string | null;
  estimatedCost: StorefrontMoney;
}

export interface StorefrontCartDeliveryGroup {
  id: string;
  selectedDeliveryOption?: StorefrontCartDeliveryOption | null;
  deliveryOptions: StorefrontCartDeliveryOption[];
}

export interface StorefrontCartLine {
  id: string;
  quantity: number;
  cost: {
    totalAmount: StorefrontMoney;
    amountPerQuantity: StorefrontMoney;
    compareAtAmountPerQuantity?: StorefrontMoney | null;
  };
  merchandise: {
    id: string;
    title: string;
    availableForSale: boolean;
    price: StorefrontMoney;
    compareAtPrice?: StorefrontMoney | null;
    selectedOptions: Array<{ name: string; value: string }>;
    image?: {
      url: string;
      altText: string | null;
      width?: number;
      height?: number;
    } | null;
    product: {
      handle: string;
      title: string;
      vendor: string;
      productType: string;
      tags: string[];
      featuredImage?: {
        url: string;
        altText: string | null;
        width?: number;
        height?: number;
      } | null;
    };
  };
}

export interface StorefrontCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  note?: string | null;
  buyerIdentity?: {
    countryCode?: string | null;
  } | null;
  cost: {
    subtotalAmount: StorefrontMoney;
    totalAmount: StorefrontMoney;
    totalTaxAmount?: StorefrontMoney | null;
  };
  deliveryGroups: {
    edges: Array<{ node: StorefrontCartDeliveryGroup }>;
  };
  lines: {
    edges: Array<{ node: StorefrontCartLine }>;
  };
}

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

const MONEY_FIELDS = `
  amount
  currencyCode
`;

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  note
  buyerIdentity {
    countryCode
  }
  cost {
    subtotalAmount { ${MONEY_FIELDS} }
    totalAmount { ${MONEY_FIELDS} }
    totalTaxAmount { ${MONEY_FIELDS} }
  }
  deliveryGroups(first: 10) {
    edges {
      node {
        id
        selectedDeliveryOption {
          handle
          title
          code
          estimatedCost { ${MONEY_FIELDS} }
        }
        deliveryOptions {
          handle
          title
          code
          estimatedCost { ${MONEY_FIELDS} }
        }
      }
    }
  }
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        cost {
          totalAmount { ${MONEY_FIELDS} }
          amountPerQuantity { ${MONEY_FIELDS} }
          compareAtAmountPerQuantity { ${MONEY_FIELDS} }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            price { ${MONEY_FIELDS} }
            compareAtPrice { ${MONEY_FIELDS} }
            selectedOptions {
              name
              value
            }
            image {
              url
              altText
              width
              height
            }
            product {
              handle
              title
              vendor
              productType
              tags
              featuredImage {
                url
                altText
                width
                height
              }
            }
          }
        }
      }
    }
  }
`;

const CART_QUERY = `#graphql
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      ${CART_FIELDS}
    }
  }
`;

const CART_CREATE_MUTATION = `#graphql
  mutation CreateCart($input: CartInput) {
    cartCreate(input: $input) {
      cart {
        ${CART_FIELDS}
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_LINES_ADD_MUTATION = `#graphql
  mutation AddCartLines($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ${CART_FIELDS}
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = `#graphql
  mutation UpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ${CART_FIELDS}
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = `#graphql
  mutation RemoveCartLines($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ${CART_FIELDS}
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_NOTE_UPDATE_MUTATION = `#graphql
  mutation UpdateCartNote($cartId: ID!, $note: String) {
    cartNoteUpdate(cartId: $cartId, note: $note) {
      cart {
        ${CART_FIELDS}
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_BUYER_IDENTITY_UPDATE_MUTATION = `#graphql
  mutation UpdateCartBuyerIdentity($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart {
        ${CART_FIELDS}
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_SELECTED_DELIVERY_OPTIONS_UPDATE_MUTATION = `#graphql
  mutation UpdateCartSelectedDeliveryOptions($cartId: ID!, $selectedDeliveryOptions: [CartSelectedDeliveryOptionInput!]!) {
    cartSelectedDeliveryOptionsUpdate(cartId: $cartId, selectedDeliveryOptions: $selectedDeliveryOptions) {
      cart {
        ${CART_FIELDS}
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function ensureConfig() {
  if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) {
    throw new Error('Shopify Storefront API is not configured.');
  }
}

function getEndpoint() {
  ensureConfig();
  return `https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
}

async function storefrontRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(getEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Storefront request failed with ${response.status}`);
  }

  const payload = await response.json() as GraphQLResponse<T>;
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(', '));
  }

  if (!payload.data) {
    throw new Error('Storefront response was empty.');
  }

  return payload.data;
}

function getStoredCartId() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CART_STORAGE_KEY);
}

function setStoredCartId(cartId: string | null) {
  if (typeof window === 'undefined') return;
  if (cartId) {
    window.localStorage.setItem(CART_STORAGE_KEY, cartId);
  } else {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  }
}

function emitCartChange(cart: StorefrontCart | null) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { cart } }));
}

function readMutationResult<T extends { cart: StorefrontCart | null; userErrors: Array<{ message: string }> }>(
  result: T,
) {
  if (result.userErrors.length) {
    throw new Error(result.userErrors.map((error) => error.message).join(', '));
  }
  if (!result.cart) {
    throw new Error('Cart operation did not return a cart.');
  }
  setStoredCartId(result.cart.id);
  return result.cart;
}

export async function createCart(input?: { lines?: Array<{ merchandiseId: string; quantity: number }>; note?: string }) {
  const data = await storefrontRequest<{
    cartCreate: { cart: StorefrontCart | null; userErrors: Array<{ message: string }> };
  }>(CART_CREATE_MUTATION, { input: input ?? {} });

  const cart = readMutationResult(data.cartCreate);
  emitCartChange(cart);
  return cart;
}

export async function getCart(createIfMissing: boolean = true): Promise<StorefrontCart | null> {
  const cartId = getStoredCartId();
  if (!cartId) {
    return createIfMissing ? createCart() : null;
  }

  try {
    const data = await storefrontRequest<{ cart: StorefrontCart | null }>(CART_QUERY, { cartId });
    if (!data.cart) {
      setStoredCartId(null);
      emitCartChange(null);
      return createIfMissing ? createCart() : null;
    }
    emitCartChange(data.cart);
    return data.cart;
  } catch {
    if (!createIfMissing) return null;
    setStoredCartId(null);
    emitCartChange(null);
    return createCart();
  }
}

export async function addToCart(merchandiseId: string, quantity: number = 1) {
  const existingCart = await getCart(true);
  if (!existingCart) {
    throw new Error('Unable to create cart.');
  }

  const data = await storefrontRequest<{
    cartLinesAdd: { cart: StorefrontCart | null; userErrors: Array<{ message: string }> };
  }>(CART_LINES_ADD_MUTATION, {
    cartId: existingCart.id,
    lines: [{ merchandiseId, quantity }],
  });

  const cart = readMutationResult(data.cartLinesAdd);
  emitCartChange(cart);
  return cart;
}

export async function updateCartLine(lineId: string, quantity: number) {
  const existingCart = await getCart(true);
  if (!existingCart) {
    throw new Error('Unable to load cart.');
  }

  const data = await storefrontRequest<{
    cartLinesUpdate: { cart: StorefrontCart | null; userErrors: Array<{ message: string }> };
  }>(CART_LINES_UPDATE_MUTATION, {
    cartId: existingCart.id,
    lines: [{ id: lineId, quantity }],
  });

  const cart = readMutationResult(data.cartLinesUpdate);
  emitCartChange(cart);
  return cart;
}

export async function removeCartLine(lineId: string) {
  const existingCart = await getCart(true);
  if (!existingCart) {
    throw new Error('Unable to load cart.');
  }

  const data = await storefrontRequest<{
    cartLinesRemove: { cart: StorefrontCart | null; userErrors: Array<{ message: string }> };
  }>(CART_LINES_REMOVE_MUTATION, {
    cartId: existingCart.id,
    lineIds: [lineId],
  });

  const cart = readMutationResult(data.cartLinesRemove);
  emitCartChange(cart);
  return cart;
}

export async function updateCartNote(note: string) {
  const existingCart = await getCart(true);
  if (!existingCart) {
    throw new Error('Unable to load cart.');
  }

  const data = await storefrontRequest<{
    cartNoteUpdate: { cart: StorefrontCart | null; userErrors: Array<{ message: string }> };
  }>(CART_NOTE_UPDATE_MUTATION, {
    cartId: existingCart.id,
    note,
  });

  const cart = readMutationResult(data.cartNoteUpdate);
  emitCartChange(cart);
  return cart;
}

export async function updateCartBuyerIdentity(buyerIdentity: Record<string, unknown>) {
  const existingCart = await getCart(true);
  if (!existingCart) {
    throw new Error('Unable to load cart.');
  }

  const data = await storefrontRequest<{
    cartBuyerIdentityUpdate: { cart: StorefrontCart | null; userErrors: Array<{ message: string }> };
  }>(CART_BUYER_IDENTITY_UPDATE_MUTATION, {
    cartId: existingCart.id,
    buyerIdentity,
  });

  const cart = readMutationResult(data.cartBuyerIdentityUpdate);
  emitCartChange(cart);
  return cart;
}

export async function updateCartSelectedDeliveryOptions(
  selectedDeliveryOptions: Array<{ deliveryGroupId: string; deliveryOptionHandle: string }>
) {
  const existingCart = await getCart(true);
  if (!existingCart) {
    throw new Error('Unable to load cart.');
  }

  const data = await storefrontRequest<{
    cartSelectedDeliveryOptionsUpdate: { cart: StorefrontCart | null; userErrors: Array<{ message: string }> };
  }>(CART_SELECTED_DELIVERY_OPTIONS_UPDATE_MUTATION, {
    cartId: existingCart.id,
    selectedDeliveryOptions,
  });

  const cart = readMutationResult(data.cartSelectedDeliveryOptionsUpdate);
  emitCartChange(cart);
  return cart;
}

export async function clearStoredCart() {
  setStoredCartId(null);
  emitCartChange(null);
}
