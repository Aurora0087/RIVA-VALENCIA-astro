/** Shopify Customer Account API OAuth + legacy Storefront customer helpers. */

const DOMAIN  = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN  as string | undefined;
const TOKEN   = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN as string | undefined;
const VERSION = '2026-04';
const CUSTOMER_ACCOUNT_CLIENT_ID = (
  import.meta.env.PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID
  ?? import.meta.env.CUSTOMER_ACCOUNT_API_CLIENT_ID
) as string | undefined;
const CUSTOMER_ACCOUNT_SCOPE = (
  import.meta.env.PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_SCOPE
  ?? 'openid email customer-account-api:full'
) as string;
const CUSTOMER_ACCOUNT_AUTHORIZATION_ENDPOINT = import.meta.env.PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_AUTHORIZATION_ENDPOINT as string | undefined;
const CUSTOMER_ACCOUNT_TOKEN_ENDPOINT = import.meta.env.PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_TOKEN_ENDPOINT as string | undefined;
const CUSTOMER_ACCOUNT_LOGOUT_ENDPOINT = import.meta.env.PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_LOGOUT_ENDPOINT as string | undefined;
const CUSTOMER_ACCOUNT_GRAPHQL_ENDPOINT = import.meta.env.PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_GRAPHQL_ENDPOINT as string | undefined;

export const CUSTOMER_TOKEN_KEY = 'rv_customer_token';
export const CUSTOMER_CACHE_KEY = 'rv_customer_data';
export const CUSTOMER_ACCOUNT_TOKEN_KEY = 'rv_customer_account_token';

const CUSTOMER_AUTH_VERIFIER_KEY = 'rv_customer_code_verifier';
const CUSTOMER_AUTH_STATE_KEY = 'rv_customer_auth_state';
const CUSTOMER_AUTH_NONCE_KEY = 'rv_customer_auth_nonce';
const CUSTOMER_AUTH_RETURN_TO_KEY = 'rv_customer_auth_return_to';

export interface CustomerAddress {
  id: string;
  firstName: string | null;
  lastName: string | null;
  address1: string | null;
  city: string | null;
  country: string | null;
  countryCode?: string | null;
  provinceCode?: string | null;
  zip: string | null;
}

export interface CustomerOrder {
  id: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: { amount: string; currencyCode: string };
  lineItems: {
    edges: {
      node: { title: string; quantity: number; variant?: { image?: { url: string; altText: string | null } | null } | null };
    }[];
  };
}

export interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  defaultAddress: CustomerAddress | null;
  orders: { edges: { node: CustomerOrder }[] };
}

export interface CustomerUserError {
  code: string;
  field: string[] | null;
  message: string;
}

export interface CustomerAccountTokenResponse {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
}

interface CustomerAccountStoredToken extends CustomerAccountTokenResponse {
  expires_at: number;
}

interface CustomerAccountAuthConfig {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
}

interface CustomerAccountApiConfig {
  graphql_api: string;
}

async function storefrontFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  if (!DOMAIN || !TOKEN) throw new Error('Shopify not configured');
  const res = await fetch(
    `https://${DOMAIN}/api/${VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  if (!res.ok) throw new Error(`Shopify API error: ${res.status}`);
  const json = await res.json() as { data: T; errors?: unknown[] };
  if (json.errors?.length) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

function getCustomerRedirectUri(): string {
  if (typeof window !== 'undefined') return `${window.location.origin}/account/callback`;
  return '/account/callback';
}

function getSessionValue(key: string): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(key);
}

function setSessionValue(key: string, value: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(key, value);
}

function removeSessionValue(key: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(key);
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomBase64Url(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64Url(new Uint8Array(hash));
}

async function getCustomerAccountAuthConfig(): Promise<CustomerAccountAuthConfig> {
  if (CUSTOMER_ACCOUNT_AUTHORIZATION_ENDPOINT && CUSTOMER_ACCOUNT_TOKEN_ENDPOINT) {
    return {
      authorization_endpoint: CUSTOMER_ACCOUNT_AUTHORIZATION_ENDPOINT,
      token_endpoint: CUSTOMER_ACCOUNT_TOKEN_ENDPOINT,
      end_session_endpoint: CUSTOMER_ACCOUNT_LOGOUT_ENDPOINT,
    };
  }

  if (!DOMAIN) throw new Error('PUBLIC_SHOPIFY_STORE_DOMAIN is not configured.');
  const res = await fetch(`https://${DOMAIN}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error(`Unable to load Customer Account auth config: ${res.status}`);
  return res.json() as Promise<CustomerAccountAuthConfig>;
}

async function getCustomerAccountApiConfig(): Promise<CustomerAccountApiConfig> {
  if (CUSTOMER_ACCOUNT_GRAPHQL_ENDPOINT) return { graphql_api: CUSTOMER_ACCOUNT_GRAPHQL_ENDPOINT };

  if (!DOMAIN) throw new Error('PUBLIC_SHOPIFY_STORE_DOMAIN is not configured.');
  const res = await fetch(`https://${DOMAIN}/.well-known/customer-account-api`);
  if (!res.ok) throw new Error(`Unable to load Customer Account API config: ${res.status}`);
  return res.json() as Promise<CustomerAccountApiConfig>;
}

export function hasCustomerAccountApiConfig(): boolean {
  return Boolean(DOMAIN && CUSTOMER_ACCOUNT_CLIENT_ID);
}

export function getCustomerAccountSetupIssue(): string | null {
  if (!DOMAIN) return 'PUBLIC_SHOPIFY_STORE_DOMAIN is not configured.';
  if (!CUSTOMER_ACCOUNT_CLIENT_ID) return 'PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID is not configured.';
  if (typeof window === 'undefined') return null;

  const { protocol, origin } = window.location;
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|$)/.test(origin);
  if (protocol !== 'https:' || isLocalhost) {
    return `Shopify Customer Account API requires an HTTPS storefront origin. Open this site through your configured HTTPS domain or tunnel, then add ${origin}/account/callback as a callback URL and ${origin} as a JavaScript origin in Shopify.`;
  }

  return null;
}

export function getCustomerAccountFetchErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || '');
  if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'this storefront origin';
    return `Shopify blocked the customer token request from ${origin}. In Shopify Customer Account API settings, use a public/web client, add ${origin}/account/callback as a callback URL, and add ${origin} as a JavaScript origin. For local development, open the site through an HTTPS tunnel instead of localhost.`;
  }
  return raw || 'Unable to complete sign in. Please try again.';
}

export async function beginCustomerAccountAuthorization(options: {
  loginHint?: string;
  returnTo?: string;
} = {}): Promise<never> {
  if (!CUSTOMER_ACCOUNT_CLIENT_ID) {
    throw new Error('Customer Account API client ID is not configured. Add PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID to .env.');
  }
  if (typeof window === 'undefined') throw new Error('Customer account authorization must run in the browser.');
  const setupIssue = getCustomerAccountSetupIssue();
  if (setupIssue) throw new Error(setupIssue);

  const config = await getCustomerAccountAuthConfig();
  const verifier = randomBase64Url(64);
  const challenge = await createCodeChallenge(verifier);
  const state = randomBase64Url(24);
  const nonce = randomBase64Url(24);
  const returnTo = options.returnTo || '/account';

  setSessionValue(CUSTOMER_AUTH_VERIFIER_KEY, verifier);
  setSessionValue(CUSTOMER_AUTH_STATE_KEY, state);
  setSessionValue(CUSTOMER_AUTH_NONCE_KEY, nonce);
  setSessionValue(CUSTOMER_AUTH_RETURN_TO_KEY, returnTo);

  const url = new URL(config.authorization_endpoint);
  url.searchParams.set('scope', CUSTOMER_ACCOUNT_SCOPE);
  url.searchParams.set('client_id', CUSTOMER_ACCOUNT_CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', getCustomerRedirectUri());
  url.searchParams.set('state', state);
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  if (options.loginHint) url.searchParams.set('login_hint', options.loginHint);

  window.location.href = url.toString();
  return new Promise<never>(() => undefined);
}

export function getCustomerAuthReturnTo(): string {
  return getSessionValue(CUSTOMER_AUTH_RETURN_TO_KEY) || '/account';
}

export function clearCustomerAuthState(): void {
  removeSessionValue(CUSTOMER_AUTH_VERIFIER_KEY);
  removeSessionValue(CUSTOMER_AUTH_STATE_KEY);
  removeSessionValue(CUSTOMER_AUTH_NONCE_KEY);
  removeSessionValue(CUSTOMER_AUTH_RETURN_TO_KEY);
}

export async function exchangeCustomerAccountCode(code: string, state: string): Promise<CustomerAccountTokenResponse> {
  if (!CUSTOMER_ACCOUNT_CLIENT_ID) {
    throw new Error('Customer Account API client ID is not configured. Add PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID to .env.');
  }

  const expectedState = getSessionValue(CUSTOMER_AUTH_STATE_KEY);
  const verifier = getSessionValue(CUSTOMER_AUTH_VERIFIER_KEY);
  if (!expectedState || expectedState !== state) throw new Error('Customer account callback state did not match. Please try again.');
  if (!verifier) throw new Error('Customer account code verifier is missing. Please try again.');

  const config = await getCustomerAccountAuthConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CUSTOMER_ACCOUNT_CLIENT_ID,
    code,
    redirect_uri: getCustomerRedirectUri(),
    code_verifier: verifier,
  });

  let res: Response;
  try {
    res = await fetch(config.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  } catch (error) {
    throw new Error(getCustomerAccountFetchErrorMessage(error));
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Unable to exchange customer account token: ${res.status}`);
  }

  const token = await res.json() as CustomerAccountTokenResponse;
  saveCustomerAccountToken(token);
  clearCustomerAuthState();
  return token;
}

export async function customerLogin(
  email: string,
  password: string
): Promise<{ token: string; expiresAt: string } | { errors: CustomerUserError[] }> {
  const data = await storefrontFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: { accessToken: string; expiresAt: string } | null;
      customerUserErrors: CustomerUserError[];
    };
  }>(
    `mutation Login($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code field message }
      }
    }`,
    { input: { email, password } }
  );

  const { customerAccessToken, customerUserErrors } = data.customerAccessTokenCreate;
  if (customerUserErrors.length) return { errors: customerUserErrors };
  if (!customerAccessToken) return { errors: [{ code: 'UNKNOWN', field: null, message: 'Login failed.' }] };
  return { token: customerAccessToken.accessToken, expiresAt: customerAccessToken.expiresAt };
}

export async function customerRegister(
  firstName: string,
  lastName: string,
  email: string,
  password: string
): Promise<{ customer: Pick<Customer, 'id' | 'email'> } | { errors: CustomerUserError[] }> {
  const data = await storefrontFetch<{
    customerCreate: {
      customer: { id: string; email: string } | null;
      customerUserErrors: CustomerUserError[];
    };
  }>(
    `mutation Register($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id email }
        customerUserErrors { code field message }
      }
    }`,
    { input: { firstName, lastName, email, password } }
  );

  const { customer, customerUserErrors } = data.customerCreate;
  if (customerUserErrors.length) return { errors: customerUserErrors };
  if (!customer) return { errors: [{ code: 'UNKNOWN', field: null, message: 'Registration failed.' }] };
  return { customer };
}

export async function getCustomer(accessToken: string): Promise<Customer | null> {
  const customerAccountCustomer = await getCustomerAccountCustomer(accessToken);
  if (customerAccountCustomer) return customerAccountCustomer;

  try {
    const data = await storefrontFetch<{ customer: Customer | null }>(
      `query GetCustomer($token: String!) {
        customer(customerAccessToken: $token) {
          id firstName lastName email phone
          defaultAddress {
            id
            firstName
            lastName
            address1
            city
            country
            countryCode: countryCodeV2
            provinceCode
            zip
          }
          orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
            edges {
              node {
                id orderNumber processedAt financialStatus fulfillmentStatus
                totalPrice { amount currencyCode }
                lineItems(first: 5) {
                  edges {
                    node {
                      title quantity
                      variant { image { url altText } }
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      { token: accessToken }
    );
    return data.customer;
  } catch {
    return null;
  }
}

async function customerAccountFetch<T>(query: string, accessToken: string, variables: Record<string, unknown> = {}): Promise<T> {
  const config = await getCustomerAccountApiConfig();
  const res = await fetch(config.graphql_api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Customer Account API error: ${res.status}`);
  const json = await res.json() as { data: T; errors?: unknown[] };
  if (json.errors?.length) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function getCustomerAccountCustomer(accessToken: string): Promise<Customer | null> {
  if (!hasCustomerAccountApiConfig()) return null;

  try {
    const data = await customerAccountFetch<{
      customer: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        emailAddress: { emailAddress: string } | null;
        phoneNumber: { phoneNumber: string } | null;
        defaultAddress: CustomerAddress | null;
        orders: {
          edges: {
            node: {
              id: string;
              number: number;
              processedAt: string;
              financialStatus: string;
              fulfillmentStatus: string;
              totalPrice: { amount: string; currencyCode: string };
              lineItems: {
                edges: {
                  node: {
                    name?: string | null;
                    title?: string | null;
                    quantity: number;
                    image?: { url: string; altText: string | null } | null;
                  };
                }[];
              };
            };
          }[];
        };
      };
    }>(
      `query GetCustomerAccount {
        customer {
          id
          firstName
          lastName
          emailAddress { emailAddress }
          phoneNumber { phoneNumber }
          defaultAddress {
            id
            firstName
            lastName
            address1
            city
            country
            countryCode: countryCodeV2
            provinceCode
            zip
          }
          orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
            edges {
              node {
                id
                number
                processedAt
                financialStatus
                fulfillmentStatus
                totalPrice { amount currencyCode }
                lineItems(first: 5) {
                  edges {
                    node {
                      name
                      title
                      quantity
                      image { url altText }
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      accessToken
    );

    const accountCustomer = data.customer;
    if (!accountCustomer) return null;

    return {
      id: accountCustomer.id,
      firstName: accountCustomer.firstName,
      lastName: accountCustomer.lastName,
      email: accountCustomer.emailAddress?.emailAddress || '',
      phone: accountCustomer.phoneNumber?.phoneNumber || null,
      defaultAddress: accountCustomer.defaultAddress,
      orders: {
        edges: accountCustomer.orders.edges.map(({ node }) => ({
          node: {
            id: node.id,
            orderNumber: node.number,
            processedAt: node.processedAt,
            financialStatus: node.financialStatus,
            fulfillmentStatus: node.fulfillmentStatus,
            totalPrice: node.totalPrice,
            lineItems: {
              edges: node.lineItems.edges.map((lineItem) => ({
                node: {
                  title: lineItem.node.title || lineItem.node.name || 'Item',
                  quantity: lineItem.node.quantity,
                  variant: lineItem.node.image ? { image: lineItem.node.image } : null,
                },
              })),
            },
          },
        })),
      },
    };
  } catch {
    return null;
  }
}

export async function customerLogout(accessToken: string): Promise<string | null> {
  const stored = getStoredCustomerAccountToken();
  if (stored?.access_token === accessToken) {
    try {
      const config = await getCustomerAccountAuthConfig();
      if (config.end_session_endpoint) {
        const url = new URL(config.end_session_endpoint);
        if (stored.id_token) url.searchParams.set('id_token_hint', stored.id_token);
        if (typeof window !== 'undefined') url.searchParams.set('post_logout_redirect_uri', window.location.origin);
        return url.toString();
      }
    } catch {
      return null;
    }
    return null;
  }

  try {
    await storefrontFetch(
      `mutation Logout($token: String!) {
        customerAccessTokenDelete(customerAccessToken: $token) { deletedAccessToken }
      }`,
      { token: accessToken }
    );
  } catch {
    // ignore — we clear locally either way
  }
  return null;
}

export async function customerRecover(email: string): Promise<{ ok: boolean; errors: CustomerUserError[] }> {
  const data = await storefrontFetch<{
    customerRecover: { customerUserErrors: CustomerUserError[] };
  }>(
    `mutation Recover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors { code field message }
      }
    }`,
    { email }
  );
  const { customerUserErrors } = data.customerRecover;
  return { ok: customerUserErrors.length === 0, errors: customerUserErrors };
}

export function getSavedToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function saveToken(token: string): void {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  localStorage.removeItem(CUSTOMER_CACHE_KEY);
}

export function saveCustomerAccountToken(token: CustomerAccountTokenResponse): void {
  const stored: CustomerAccountStoredToken = {
    ...token,
    expires_at: Date.now() + Math.max(token.expires_in - 60, 0) * 1000,
  };
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token.access_token);
  localStorage.setItem(CUSTOMER_ACCOUNT_TOKEN_KEY, JSON.stringify(stored));
  localStorage.removeItem(CUSTOMER_CACHE_KEY);
}

function getStoredCustomerAccountToken(): CustomerAccountStoredToken | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(CUSTOMER_ACCOUNT_TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CustomerAccountStoredToken;
  } catch {
    localStorage.removeItem(CUSTOMER_ACCOUNT_TOKEN_KEY);
    return null;
  }
}

export function clearToken(): void {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_ACCOUNT_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_CACHE_KEY);
}
