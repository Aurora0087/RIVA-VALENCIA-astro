import { useEffect, useState } from 'react';
import {
  clearCustomerAuthState,
  exchangeCustomerAccountCode,
  getCustomerAccountFetchErrorMessage,
  getCustomerAuthReturnTo,
} from '@/lib/customerApi';

export function CustomerAccountCallback() {
  const [message, setMessage] = useState('Completing secure sign in...');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const oauthError = params.get('error_description') || params.get('error');

    if (oauthError) {
      clearCustomerAuthState();
      setError(oauthError);
      setMessage('');
      return;
    }

    if (!code || !state) {
      clearCustomerAuthState();
      setError('The customer account callback was missing a code. Please try signing in again.');
      setMessage('');
      return;
    }

    const returnTo = getCustomerAuthReturnTo();

    exchangeCustomerAccountCode(code, state)
      .then(() => {
        setMessage('Signed in. Redirecting...');
        window.location.replace(returnTo || '/account');
      })
      .catch((err) => {
        clearCustomerAuthState();
        setError(getCustomerAccountFetchErrorMessage(err));
        setMessage('');
      });
  }, []);

  return (
    <div className="ac-loading">
      {!error && <div className="ac-loading-spin" />}
      {message && <p>{message}</p>}
      {error && (
        <>
          <p>{error}</p>
          <a href="/account/login" className="ac-empty-cta">Back to Sign In</a>
        </>
      )}
    </div>
  );
}
