/**
 * Deriv OAuth 2.0 with PKCE — based on https://developers.deriv.com/llms.txt
 * Authorization endpoint: https://auth.deriv.com/oauth2/auth
 * Token endpoint: https://auth.deriv.com/oauth2/token
 */

const DERIV_AUTH_ENDPOINT = 'https://auth.deriv.com/oauth2/auth';
export const DERIV_OAUTH_CLIENT_ID = 'deriv-bot';

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
 * Redirects the browser to the Deriv authorization page.
 */
export async function initiateDerivOAuth(scope: 'trade' | 'admin' = 'trade'): Promise<void> {
    const redirectUri = `${window.location.origin}/callback`;
    const { codeVerifier, codeChallenge } = await generatePKCE();
    const state = generateState();

    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_redirect_uri', redirectUri);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: DERIV_OAUTH_CLIENT_ID,
        redirect_uri: redirectUri,
        scope,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });

    window.location.href = `${DERIV_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Initiate Deriv OAuth 2.0 sign-up with PKCE.
 */
export async function initiateDerivSignUp(): Promise<void> {
    const redirectUri = `${window.location.origin}/callback`;
    const { codeVerifier, codeChallenge } = await generatePKCE();
    const state = generateState();

    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_redirect_uri', redirectUri);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: DERIV_OAUTH_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'trade',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'registration',
    });

    window.location.href = `${DERIV_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Handle the OAuth callback — verify state and extract the authorization code.
 * Returns { code, codeVerifier } if successful, or null if state mismatch.
 */
export function handleOAuthCallback(): { code: string; codeVerifier: string } | null {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');
    const storedState = sessionStorage.getItem('oauth_state');
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier') ?? '';

    if (!code || !returnedState || returnedState !== storedState) {
        return null;
    }

    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('pkce_code_verifier');

    return { code, codeVerifier };
}

/**
 * Exchange the authorization code for an access token via the server.
 * NOTE: In production this should be done from a backend to keep client_secret safe.
 * This is a direct client-side call — suitable only for public clients.
 */
export async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<{ access_token: string } | null> {
    const redirectUri = sessionStorage.getItem('oauth_redirect_uri') ?? `${window.location.origin}/callback`;
    sessionStorage.removeItem('oauth_redirect_uri');

    try {
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: DERIV_OAUTH_CLIENT_ID,
            code,
            code_verifier: codeVerifier,
            redirect_uri: redirectUri,
        });

        const res = await fetch('https://auth.deriv.com/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });

        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}
