import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import {
  getSavedToken,
  getCustomer,
  customerLogout,
  clearToken,
  type Customer,
  type CustomerOrder,
} from '@/lib/customerApi';

type Section = 'orders' | 'profile' | 'addresses';

export function AccountDashboard() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>('orders');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const token = getSavedToken();
    if (!token) {
      window.location.href = '/account/login';
      return;
    }
    getCustomer(token).then((c) => {
      if (!c) {
        clearToken();
        window.location.href = '/account/login';
        return;
      }
      setCustomer(c);
      setLoading(false);
    });
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    const token = getSavedToken();
    const logoutUrl = token ? await customerLogout(token) : null;
    clearToken();
    window.location.href = logoutUrl || '/';
  }

  if (loading) {
    return (
      <div className="ac-loading">
        <div className="ac-loading-spin" />
        <p>Loading your account…</p>
      </div>
    );
  }

  if (!customer) return null;

  const orders = customer.orders.edges.map((e) => e.node);
  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Valued Client';
  const initials = (customer.firstName?.[0] ?? customer.email[0] ?? 'R').toUpperCase();
  const lastOrder = orders[0];

  return (
    <div className="ac-page">
      {/* Header */}
      <div className="ac-head">
        <div className="ac-head-copy">
          <span className="ac-kicker">My Account</span>
          <h1 className="ac-title">Welcome, {customer.firstName || 'there'}</h1>
          <p className="ac-subtitle">Your Riva Valencia account, orders, profile details and saved addresses in one quiet place.</p>
        </div>
        <button
          type="button"
          className="ac-logout"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>

      <div className="ac-overview">
        <div className="ac-client-card">
          <div className="ac-client-avatar">{initials}</div>
          <div>
            <span className="ac-client-label">Signed in as</span>
            <p className="ac-client-name">{fullName}</p>
            <p className="ac-client-email">{customer.email}</p>
          </div>
        </div>
        <div className="ac-metric">
          <span className="ac-metric-value">{orders.length}</span>
          <span className="ac-metric-label">Orders</span>
        </div>
        <div className="ac-metric">
          <span className="ac-metric-value">{customer.defaultAddress ? 'Saved' : 'Add'}</span>
          <span className="ac-metric-label">Address</span>
        </div>
        <div className="ac-metric">
          <span className="ac-metric-value">{lastOrder ? `#${lastOrder.orderNumber}` : 'New'}</span>
          <span className="ac-metric-label">Latest Order</span>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="ac-tabs">
        {(['orders', 'profile', 'addresses'] as Section[]).map((s) => (
          <button
            key={s}
            type="button"
            className={cn('ac-tab', section === s && 'active')}
            onClick={() => setSection(s)}
          >
            {s === 'orders' ? 'Order History' : s === 'profile' ? 'Profile' : 'Addresses'}
          </button>
        ))}
      </div>

      <div className="ac-body">
        {/* ── ORDERS ── */}
        {section === 'orders' && (
          <div className="ac-section">
            <SectionIntro
              kicker="Order History"
              title="Your pieces"
              body="Track purchases, totals and fulfillment details from your customer account."
            />
            {orders.length === 0 ? (
              <div className="ac-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c8c0b5" strokeWidth="1">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                <h3>No orders yet</h3>
                <p>Your order history will appear here once you make a purchase.</p>
                <a href="/collections/all" className="ac-empty-cta">Shop the Collection →</a>
              </div>
            ) : (
              <div className="ac-orders">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE ── */}
        {section === 'profile' && (
          <div className="ac-section">
            <SectionIntro
              kicker="Profile"
              title="Client details"
              body="These details come from your Shopify customer account."
            />
            <div className="ac-profile">
              <div className="ac-profile-avatar">
                {initials}
              </div>
              <div className="ac-profile-info">
                <p className="ac-profile-name">{fullName}</p>
                <p className="ac-profile-email">{customer.email}</p>
                {customer.phone && <p className="ac-profile-phone">{customer.phone}</p>}
              </div>
            </div>

            <div className="ac-info-grid">
              <InfoBlock label="First Name" value={customer.firstName ?? '—'} />
              <InfoBlock label="Last Name" value={customer.lastName ?? '—'} />
              <InfoBlock label="Email" value={customer.email} />
              <InfoBlock label="Phone" value={customer.phone ?? '—'} />
            </div>

            <p className="ac-profile-note">
              To update your profile or change your password, please visit your{' '}
              <a
                href={`https://${(import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN as string | undefined) ?? '#'}/account`}
                target="_blank"
                rel="noopener noreferrer"
                className="ac-ext-link"
              >
                Shopify account page →
              </a>
            </p>
          </div>
        )}

        {/* ── ADDRESSES ── */}
        {section === 'addresses' && (
          <div className="ac-section">
            <SectionIntro
              kicker="Addresses"
              title="Delivery details"
              body="Your default address helps make future checkout faster."
            />
            {customer.defaultAddress ? (
              <div className="ac-addr-card">
                <p className="ac-addr-label">Default Address</p>
                <p className="ac-addr-name">
                  {[customer.defaultAddress.firstName, customer.defaultAddress.lastName].filter(Boolean).join(' ')}
                </p>
                {customer.defaultAddress.address1 && <p>{customer.defaultAddress.address1}</p>}
                {customer.defaultAddress.city && (
                  <p>
                    {customer.defaultAddress.city}
                    {customer.defaultAddress.zip ? `, ${customer.defaultAddress.zip}` : ''}
                  </p>
                )}
                {customer.defaultAddress.country && <p>{customer.defaultAddress.country}</p>}
              </div>
            ) : (
              <div className="ac-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c8c0b5" strokeWidth="1">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <h3>No addresses saved</h3>
                <p>Addresses saved to your account will appear here.</p>
              </div>
            )}
            <p className="ac-profile-note" style={{ marginTop: '24px' }}>
              Manage all your addresses on your{' '}
              <a
                href={`https://${(import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN as string | undefined) ?? '#'}/account/addresses`}
                target="_blank"
                rel="noopener noreferrer"
                className="ac-ext-link"
              >
                Shopify account page →
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="ac-quick">
        <a href="/collections/all" className="ac-quick-link">Shop All →</a>
        <a href="/wishlist" className="ac-quick-link">My Wishlist →</a>
        <a href="/pages/contact" className="ac-quick-link">Contact Us →</a>
        <a href="/cart" className="ac-quick-link">View Cart →</a>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: CustomerOrder }) {
  const [open, setOpen] = useState(false);
  const date = new Date(order.processedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const items = order.lineItems.edges.map((e) => e.node);

  const statusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'fulfilled') return '#4a6741';
    if (s === 'pending' || s === 'in_progress' || s === 'in progress') return '#8b6914';
    if (s === 'refunded' || s === 'cancelled' || s === 'voided') return '#8b3a2a';
    return '#5a4a3a';
  };

  return (
    <div className="ac-order">
      <button type="button" className="ac-order-head" onClick={() => setOpen((v) => !v)}>
        <div className="ac-order-meta">
          <span className="ac-order-num">Order #{order.orderNumber}</span>
          <span className="ac-order-date">{date}</span>
        </div>
        <div className="ac-order-right">
          <span className="ac-order-price">
            {formatPrice(order.totalPrice.amount, order.totalPrice.currencyCode)}
          </span>
          <span
            className="ac-order-status"
            style={{ color: statusColor(order.financialStatus) }}
          >
            {order.financialStatus.replace(/_/g, ' ')}
          </span>
          <span className="ac-order-status" style={{ color: statusColor(order.fulfillmentStatus) }}>
            {order.fulfillmentStatus.replace(/_/g, ' ')}
          </span>
          <svg
            width="14" height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', flexShrink: 0 }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="ac-order-body">
          {items.map((item, i) => (
            <div key={i} className="ac-order-item">
              {item.variant?.image && (
                <img
                  src={item.variant.image.url}
                  alt={item.variant.image.altText ?? item.title}
                  className="ac-order-item-img"
                />
              )}
              <div className="ac-order-item-info">
                <span className="ac-order-item-title">{item.title}</span>
                <span className="ac-order-item-qty">Qty: {item.quantity}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="ac-info-block">
      <span className="ac-info-label">{label}</span>
      <span className="ac-info-value">{value}</span>
    </div>
  );
}

function SectionIntro({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="ac-section-intro">
      <span>{kicker}</span>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}
