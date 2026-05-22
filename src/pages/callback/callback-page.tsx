import { useEffect, useState } from 'react';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import { storeMCPToken } from '@/utils/mcp-api';
import { Callback } from '@deriv-com/auth-client';
import { Button } from '@deriv-com/ui';

/* ─────────────────────────────────────────────────────────────────────────────
 * Shared spinner used by every handler
 * ───────────────────────────────────────────────────────────────────────────── */
const Spinner = ({ label = 'Completing sign in…' }: { label?: string }) => (
    <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        background: '#07111f', color: '#a8d4f5', gap: '18px', padding: '32px',
    }}>
        <div style={{
            width: 52, height: 52,
            border: '3px solid rgba(0,212,255,0.25)',
            borderTopColor: '#00d4ff',
            borderRadius: '50%',
            animation: 'cbSpin 0.75s linear infinite',
        }} />
        <p style={{ margin: 0, fontSize: '0.95rem', letterSpacing: '0.03em' }}>{label}</p>
        <style>{`@keyframes cbSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

const ErrorScreen = ({ msg, onRetry }: { msg: string; onRetry?: () => void }) => (
    <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        background: '#07111f', color: '#a8d4f5', gap: '16px', padding: '32px',
    }}>
        <div style={{ fontSize: '2.5rem' }}>⚠️</div>
        <h2 style={{
            color: '#ff7b7b', margin: 0, fontSize: '1.1rem',
            background: 'none', padding: 0, borderRadius: 0,
        }}>Login Failed</h2>
        <p style={{ margin: 0, textAlign: 'center', maxWidth: 420, fontSize: '0.88rem', color: 'rgba(168,212,245,0.75)' }}>{msg}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {onRetry && (
                <Button onClick={onRetry}>Try Again</Button>
            )}
            <Button onClick={() => { window.location.href = '/'; }}>
                Return to AHMEDSYNTRADER
            </Button>
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
 * Handler 1 – Legacy Deriv OAuth  (?token1=…&acct1=…&cur1=…)
 * This is what oauth.deriv.com sends back after login with app_id=113192
 * ───────────────────────────────────────────────────────────────────────────── */
const LegacyOAuthHandler = () => {
    const [error, setError] = useState('');

    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const accountsList: Record<string, string> = {};
            const clientAccounts: Record<string, { loginid: string; token: string; currency: string }> = {};

            let i = 1;
            while (params.has(`token${i}`) && params.has(`acct${i}`)) {
                const token = params.get(`token${i}`) ?? '';
                const acct = params.get(`acct${i}`) ?? '';
                const cur = params.get(`cur${i}`) ?? '';
                if (token && acct) {
                    accountsList[acct] = token;
                    clientAccounts[acct] = { loginid: acct, token, currency: cur };
                }
                i++;
            }

            const firstToken = params.get('token1') ?? '';
            const firstAcct = params.get('acct1') ?? '';
            const firstCur = params.get('cur1') ?? 'USD';

            if (!firstToken || !firstAcct) {
                setError('No valid tokens found in the OAuth response. Please try logging in again.');
                return;
            }

            localStorage.setItem('accountsList', JSON.stringify(accountsList));
            localStorage.setItem('clientAccounts', JSON.stringify(clientAccounts));
            localStorage.setItem('authToken', firstToken);
            localStorage.setItem('active_loginid', firstAcct);
            localStorage.setItem('callback_token', firstToken);
            storeMCPToken(firstToken);

            const isDemo = firstAcct.startsWith('VR') || firstAcct.startsWith('VRW');
            const account = isDemo ? 'demo' : firstCur;

            window.history.replaceState({}, '', '/');
            window.location.replace(`/?account=${account}`);
        } catch (err: any) {
            setError(err?.message ?? 'Unexpected error during login. Please try again.');
        }
    }, []);

    if (error) return <ErrorScreen msg={error} onRetry={() => { window.location.href = '/'; }} />;
    return <Spinner label='Signing you in via Deriv…' />;
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Handler 2 – PKCE / auth.deriv.com  (?code=…&state=…)
 * ───────────────────────────────────────────────────────────────────────────── */
const PKCECallbackHandler = () => {
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const returnedState = params.get('state');
            const errorParam = params.get('error');

            if (errorParam) {
                setError(`Authentication failed: ${params.get('error_description') || errorParam}`);
                return;
            }
            if (!code) {
                setError('No authorization code received.');
                return;
            }
            const storedState = sessionStorage.getItem('oauth_state');
            const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
            if (!storedState || storedState !== returnedState) {
                setError('State mismatch — possible CSRF. Please try logging in again.');
                return;
            }
            if (!codeVerifier) {
                setError('Missing code verifier. Please try logging in again.');
                return;
            }
            try {
                const body = new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: '113192',
                    code,
                    code_verifier: codeVerifier,
                    redirect_uri: window.location.origin + '/callback',
                });
                const res = await fetch('https://auth.deriv.com/oauth2/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: body.toString(),
                });
                sessionStorage.removeItem('pkce_code_verifier');
                sessionStorage.removeItem('oauth_state');
                if (!res.ok) {
                    const d = await res.json().catch(() => ({}));
                    throw new Error(d.error_description || `Token exchange failed (${res.status})`);
                }
                const data = await res.json();
                const accessToken: string = data.access_token;
                storeMCPToken(accessToken);
                const api = generateDerivApiInstance();
                const { authorize, error: authErr } = await api.authorize(accessToken);
                api.disconnect();
                if (!authErr && authorize?.account_list?.length) {
                    const first = authorize.account_list[0];
                    localStorage.setItem('authToken', accessToken);
                    localStorage.setItem('active_loginid', first.loginid);
                    const acctList: Record<string, string> = {};
                    authorize.account_list.forEach((a: any) => { acctList[a.loginid] = accessToken; });
                    localStorage.setItem('accountsList', JSON.stringify(acctList));
                    const isDemo = first.loginid?.startsWith('VR');
                    window.location.replace(`/?account=${isDemo ? 'demo' : (first.currency || 'USD')}`);
                    return;
                }
                localStorage.setItem('authToken', accessToken);
                window.location.replace('/');
            } catch (err: any) {
                setError(err?.message || 'Authentication failed. Please try again.');
            }
        })();
    }, []);

    if (error) return <ErrorScreen msg={error} onRetry={() => { window.location.href = '/'; }} />;
    return <Spinner label='Exchanging authorization code…' />;
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Handler 3 – OIDC / @deriv-com/auth-client Callback
 * ───────────────────────────────────────────────────────────────────────────── */
const OIDCCallbackHandler = () => (
    <Callback
        onSignInSuccess={async (tokens: Record<string, string>) => {
            const accountsList: Record<string, string> = {};
            const clientAccounts: Record<string, { loginid: string; token: string; currency: string }> = {};

            for (const [key, value] of Object.entries(tokens)) {
                if (key.startsWith('acct')) {
                    const tokenKey = key.replace('acct', 'token');
                    if (tokens[tokenKey]) {
                        accountsList[value] = tokens[tokenKey];
                        clientAccounts[value] = { loginid: value, token: tokens[tokenKey], currency: '' };
                    }
                } else if (key.startsWith('cur')) {
                    const accKey = key.replace('cur', 'acct');
                    if (tokens[accKey] && clientAccounts[tokens[accKey]]) {
                        clientAccounts[tokens[accKey]].currency = value;
                    }
                }
            }

            localStorage.setItem('accountsList', JSON.stringify(accountsList));
            localStorage.setItem('clientAccounts', JSON.stringify(clientAccounts));
            localStorage.setItem('authToken', tokens.token1 ?? '');
            localStorage.setItem('active_loginid', tokens.acct1 ?? '');

            const isDemo = tokens.acct1?.startsWith('VR');
            const cur = tokens.cur1 || 'USD';
            window.location.replace(`/?account=${isDemo ? 'demo' : cur}`);
        }}
        renderReturnButton={() => (
            <Button onClick={() => { window.location.href = '/'; }}>
                Return to AHMEDSYNTRADER
            </Button>
        )}
    />
);

/* ─────────────────────────────────────────────────────────────────────────────
 * Router — detects which flow to use
 * ───────────────────────────────────────────────────────────────────────────── */
const CallbackPage = () => {
    const params = new URLSearchParams(window.location.search);

    // Legacy Deriv OAuth: token1 + acct1 in URL
    if (params.has('token1') && params.has('acct1')) {
        return <LegacyOAuthHandler />;
    }

    // PKCE: code in URL + verifier in sessionStorage
    if (params.has('code') && sessionStorage.getItem('pkce_code_verifier')) {
        return <PKCECallbackHandler />;
    }

    // OIDC / default
    return <OIDCCallbackHandler />;
};

export default CallbackPage;
