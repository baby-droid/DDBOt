/**
 * Deriv OAuth 2.0 with PKCE
 * Authorization endpoint: https://auth.deriv.com/oauth2/auth
 * Token endpoint:         https://auth.deriv.com/oauth2/token
 * Legacy tokens:          https://oauth.deriv.com/oauth2/legacy/tokens
 *
 * client_id = the Deriv app_id (stored in localStorage config.app_id or derived from hostname)
 */

import { getAppId } from '@/components/shared';

const DERIV_AUTH_ENDPOINT = 'https://auth.deriv.com/oauth2/auth';
const DERIV_TOKEN_ENDPOINT = 'https://auth.deriv.com/oauth2/token';
const DERIV_LEGACY_TOKENS_URL = 'https://oauth.deriv.com/oauth2/legacy/tokens';

async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
    const array = crypto.getRandomValues(new Uint8Array(64));
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const codeVerifier = Array.from(array).map(v => CHARS[v % CHARS.length]).join('');
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return { codeVerifier, codeChallenge };
}

function generateState(): string {
    return crypto.getRandomValues(new Uint8Array(16))
        .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
}

/**
 * Initiate Deriv OAuth 2.0 login with PKCE.
 * Redirects the browser to https://auth.deriv.com/oauth2/auth
 */
export async function initiateDerivOAuth(): Promise<void> {
    const redirectUri = `${window.location.origin}/callback`;
    const clientId = String(getAppId());
    const { codeVerifier, codeChallenge } = await generatePKCE();
    const state = generateState();

    sessionStorage.setItem('deriv_pkce_verifier', codeVerifier);
    sessionStorage.setItem('deriv_pkce_state', state);
    sessionStorage.setItem('deriv_pkce_redirect_uri', redirectUri);
    sessionStorage.setItem('deriv_pkce_client_id', clientId);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'openid',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });

    window.location.href = `${DERIV_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Returns true if there is a pending custom PKCE flow in sessionStorage.
 */
export function hasPendingPKCE(): boolean {
    return !!sessionStorage.getItem('deriv_pkce_verifier');
}

/**
 * Handle the custom PKCE callback.
 * Verifies state, exchanges code for access token, then gets Deriv legacy tokens.
 * Returns the legacy token map (acct1, token1, cur1, ...) or null on failure.
 */
export async function handlePKCECallback(): Promise<Record<string, string> | null> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');
    const storedState = sessionStorage.getItem('deriv_pkce_state');
    const codeVerifier = sessionStorage.getItem('deriv_pkce_verifier');
    const redirectUri = sessionStorage.getItem('deriv_pkce_redirect_uri');
    const clientId = sessionStorage.getItem('deriv_pkce_client_id');

    if (!code || !returnedState || returnedState !== storedState || !codeVerifier) {
        return null;
    }

    sessionStorage.removeItem('deriv_pkce_state');
    sessionStorage.removeItem('deriv_pkce_verifier');
    sessionStorage.removeItem('deriv_pkce_redirect_uri');
    sessionStorage.removeItem('deriv_pkce_client_id');

    try {
        // Step 1: Exchange authorization code for OIDC access token
        const tokenBody = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId ?? String(getAppId()),
            code,
            code_verifier: codeVerifier,
            redirect_uri: redirectUri ?? `${window.location.origin}/callback`,
        });

        const tokenRes = await fetch(DERIV_TOKEN_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenBody.toString(),
        });

        if (!tokenRes.ok) {
            console.error('PKCE token exchange failed:', tokenRes.status, await tokenRes.text());
            return null;
        }

        const { access_token } = await tokenRes.json();
        if (!access_token) return null;

        // Step 2: Exchange OIDC access token for Deriv legacy tokens
        const legacyRes = await fetch(DERIV_LEGACY_TOKENS_URL, {
            method: 'POST',
            headers: { Authorization: `Bearer ${access_token}` },
        });

        if (!legacyRes.ok) {
            console.error('Legacy token exchange failed:', legacyRes.status, await legacyRes.text());
            return null;
        }

        const legacyTokens = await legacyRes.json();
        return legacyTokens as Record<string, string>;
    } catch (err) {
        console.error('PKCE callback error:', err);
        return null;
    }
}
