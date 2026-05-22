const AFFILIATE_SIDI = 'F1A9AB8D-CA1F-415F-BA96-CCF934966B5A';
const AFFILIATE_UTM_CAMPAIGN = 'dynamicworks';
const AFFILIATE_UTM_MEDIUM = 'affiliate';
const AFFILIATE_UTM_SOURCE = 'CU304029';
const TURNOVER_SIDC = '2CC4E950-37B6-44E9-80CC-BA2E60E6E630';

const APP_CLIENT_ID = '113192';

async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string; state: string }> {
    const array = crypto.getRandomValues(new Uint8Array(64));
    const codeVerifier = Array.from(array)
        .map(v => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[v % 66])
        .join('');

    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    return { codeVerifier, codeChallenge, state };
}

export async function loginWithPKCE() {
    const { codeChallenge, state } = await generatePKCE();
    const redirectUri = window.location.origin + '/callback';

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: APP_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'trade account_manage',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        app_id: APP_CLIENT_ID,
    });

    window.location.href = `https://auth.deriv.com/oauth2/auth?${params.toString()}`;
}

export async function signUpWithPKCE() {
    const { codeChallenge, state } = await generatePKCE();
    const redirectUri = window.location.origin + '/callback';

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: APP_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'trade account_manage',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        app_id: APP_CLIENT_ID,
        prompt: 'registration',
        sidi: AFFILIATE_SIDI,
        utm_campaign: AFFILIATE_UTM_CAMPAIGN,
        utm_medium: AFFILIATE_UTM_MEDIUM,
        utm_source: AFFILIATE_UTM_SOURCE,
    });

    window.location.href = `https://auth.deriv.com/oauth2/auth?${params.toString()}`;
}

export function openTurnoverLink() {
    window.open(
        `https://deriv.partners/rx?sidc=${TURNOVER_SIDC}&utm_campaign=${AFFILIATE_UTM_CAMPAIGN}&utm_medium=${AFFILIATE_UTM_MEDIUM}&utm_source=${AFFILIATE_UTM_SOURCE}`,
        '_blank'
    );
}

export { AFFILIATE_SIDI, TURNOVER_SIDC };
