import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  beginCustomerAccountAuthorization,
  getCustomerAccountFetchErrorMessage,
  getCustomerAccountSetupIssue,
  hasCustomerAccountApiConfig,
} from '@/lib/customerApi';

type Tab = 'login' | 'register' | 'forgot';

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [regEmail, setRegEmail] = useState('');

  // forgot
  const [forgotEmail, setForgotEmail] = useState('');

  const switchTab = (next: Tab) => {
    setTab(next);
    setError('');
    setSuccess('');
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!hasCustomerAccountApiConfig()) {
      setError('Customer Account API is not configured. Add your Customer Account API client ID and callback URL.');
      return;
    }
    const setupIssue = getCustomerAccountSetupIssue();
    if (setupIssue) {
      setError(setupIssue);
      return;
    }
    setLoading(true);
    try {
      await beginCustomerAccountAuthorization({ loginHint: loginEmail || undefined, returnTo: '/account' });
    } catch (err) {
      setError(getCustomerAccountFetchErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!hasCustomerAccountApiConfig()) {
      setError('Customer Account API is not configured. Add your Customer Account API client ID and callback URL.');
      return;
    }
    const setupIssue = getCustomerAccountSetupIssue();
    if (setupIssue) {
      setError(setupIssue);
      return;
    }
    setLoading(true);
    try {
      await beginCustomerAccountAuthorization({ loginHint: regEmail || undefined, returnTo: '/account' });
    } catch (err) {
      setError(getCustomerAccountFetchErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!hasCustomerAccountApiConfig()) {
      setError('Customer Account API is not configured. Add your Customer Account API client ID and callback URL.');
      return;
    }
    const setupIssue = getCustomerAccountSetupIssue();
    if (setupIssue) {
      setError(setupIssue);
      return;
    }
    setLoading(true);
    try {
      await beginCustomerAccountAuthorization({ loginHint: forgotEmail || undefined, returnTo: '/account' });
    } catch (err) {
      setError(getCustomerAccountFetchErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lg-page">
      <div className="lg-card">
        <div className="lg-visual">
          <img
            className="lg-visual-img"
            src="https://cdn.shopify.com/s/files/1/0812/7738/7010/files/Gemini_Generated_Image_n17qn0n17qn0n17q.png?v=1776004987"
            alt="Riva Valencia leather goods"
          />
          <div className="lg-visual-overlay" />
          <div className="lg-visual-copy">
            <span className="lg-visual-kicker">Customer Account</span>
            <h1>Riva Valencia</h1>
            <p>Orders, wishlist, and saved details.</p>
          </div>
        </div>

        <div className="lg-panel">
          <div className="lg-head">
            <span className="lg-head-kicker">Customer Account</span>
            <h2>
              {tab === 'login' && 'Sign in.'}
              {tab === 'register' && 'Create account.'}
              {tab === 'forgot' && 'Recover access.'}
            </h2>
            <p>
              {tab === 'login' && 'View your orders and wishlist.'}
              {tab === 'register' && 'Create an account for faster checkout.'}
              {tab === 'forgot' && 'Continue to Shopify to recover access.'}
            </p>
          </div>

          <div className="lg-tabs">
            <button
              type="button"
              className={cn('lg-tab', tab === 'login' && 'active')}
              onClick={() => switchTab('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={cn('lg-tab', tab === 'register' && 'active')}
              onClick={() => switchTab('register')}
            >
              Create Account
            </button>
          </div>

          {error && <div className="lg-msg lg-msg-err">{error}</div>}
          {success && <div className="lg-msg lg-msg-ok">{success}</div>}

          {tab === 'login' && (
            <form className="lg-form" onSubmit={handleLogin} noValidate>
              <div className="lg-field">
                <label className="lg-label" htmlFor="lg-email">Email Address Optional</label>
                <input
                  id="lg-email"
                  type="email"
                  className="lg-input"
                  placeholder="your@email.com"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="lg-btn" disabled={loading}>
                {loading ? 'Opening Shopify…' : 'Continue'}
              </button>

              <p className="lg-note">Secure sign in is completed on Shopify.</p>

              <p className="lg-switch">
                Need a new account?{' '}
                <button type="button" className="lg-switch-link" onClick={() => switchTab('register')}>
                  Create one
                </button>
                <span className="lg-switch-sep">·</span>
                <button type="button" className="lg-switch-link" onClick={() => switchTab('forgot')}>
                  Get help
                </button>
              </p>
            </form>
          )}

          {tab === 'register' && (
            <form className="lg-form" onSubmit={handleRegister} noValidate>
              <div className="lg-field">
                <label className="lg-label" htmlFor="lg-reg-email">Email Address Optional</label>
                <input
                  id="lg-reg-email"
                  type="email"
                  className="lg-input"
                  placeholder="your@email.com"
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <p className="lg-terms">
                By creating an account you agree to our{' '}
                <a href="/pages/privacy" className="lg-terms-link">Privacy Policy</a>
                {' '}and{' '}
                <a href="/pages/terms" className="lg-terms-link">Terms and Conditions</a>.
              </p>

              <button type="submit" className="lg-btn" disabled={loading}>
                {loading ? 'Opening Shopify…' : 'Create Account'}
              </button>

              <p className="lg-note">Account creation and verification are handled on Shopify.</p>

              <p className="lg-switch">
                Already have an account?{' '}
                <button type="button" className="lg-switch-link" onClick={() => switchTab('login')}>
                  Sign in
                </button>
              </p>
            </form>
          )}

          {tab === 'forgot' && (
            <form className="lg-form" onSubmit={handleForgot} noValidate>
              <div className="lg-field">
                <label className="lg-label" htmlFor="lg-forgot-email">Email Address Optional</label>
                <input
                  id="lg-forgot-email"
                  type="email"
                  className="lg-input"
                  placeholder="your@email.com"
                  autoComplete="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="lg-btn" disabled={loading}>
                {loading ? 'Opening Shopify…' : 'Continue'}
              </button>

              <p className="lg-note">Recovery and verification are handled on Shopify.</p>

              <p className="lg-switch">
                <button type="button" className="lg-switch-link" onClick={() => switchTab('login')}>
                  Back to sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
