const AFFILIATE_SIDI = 'F1A9AB8D-CA1F-415F-BA96-CCF934966B5A';
const AFFILIATE_UTM_CAMPAIGN = 'dynamicworks';
const AFFILIATE_UTM_MEDIUM = 'affiliate';
const AFFILIATE_UTM_SOURCE = 'CU304029';
const TURNOVER_SIDC = '2CC4E950-37B6-44E9-80CC-BA2E60E6E630';

const LEGACY_APP_ID = '113192';

/**
 * Login — uses legacy oauth.deriv.com with app_id=113192.
 * After login Deriv redirects back with token1/acct1/cur1 query params.
 */
export function loginWithPKCE() {
    window.location.href = `https://oauth.deriv.com/oauth2/authorize?app_id=${LEGACY_APP_ID}&l=EN&brand=deriv`;
}

/**
 * Sign Up — opens the partner affiliate registration page so the user
 * registers under the AHMEDSYNTRADER affiliate account.
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
