const AFFILIATE_SIDI = 'F1A9AB8D-CA1F-415F-BA96-CCF934966B5A';
const AFFILIATE_UTM_CAMPAIGN = 'dynamicworks';
const AFFILIATE_UTM_MEDIUM = 'affiliate';
const AFFILIATE_UTM_SOURCE = 'CU304029';
const TURNOVER_SIDC = '2CC4E950-37B6-44E9-80CC-BA2E60E6E630';

const LEGACY_APP_ID = '113192';

/**
 * Login — legacy oauth.deriv.com with app_id=113192.
 * Scopes: read (account info), trade (buy/sell contracts), trading_information (P&L, history).
 * After login Deriv redirects back with token1/acct1/cur1 query params.
 */
export function loginWithPKCE() {
    const params = new URLSearchParams({
        app_id: LEGACY_APP_ID,
        l: 'EN',
        brand: 'deriv',
        scope: 'read trade trading_information',
    });
    window.location.href = `https://oauth.deriv.com/oauth2/authorize?${params.toString()}`;
}

/**
 * Sign Up — opens the partner affiliate registration page.
 */
export function signUpWithPKCE() {
    window.open(
        `https://deriv.com/signup/?sidi=${AFFILIATE_SIDI}&utm_campaign=${AFFILIATE_UTM_CAMPAIGN}&utm_medium=${AFFILIATE_UTM_MEDIUM}&utm_source=${AFFILIATE_UTM_SOURCE}`,
        '_blank'
    );
}

export function openTurnoverLink() {
    window.open(
        `https://deriv.partners/rx?sidc=${TURNOVER_SIDC}&utm_campaign=${AFFILIATE_UTM_CAMPAIGN}&utm_medium=${AFFILIATE_UTM_MEDIUM}&utm_source=${AFFILIATE_UTM_SOURCE}`,
        '_blank'
    );
}

export { AFFILIATE_SIDI, TURNOVER_SIDC };
