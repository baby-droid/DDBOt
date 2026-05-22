import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { crypto_currencies_display_order, fiat_currencies_display_order } from '@/components/shared';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import { observer as globalObserver } from '@/external/bot-skeleton/utils/observer';
import useTMB from '@/hooks/useTMB';
import { clearAuthData } from '@/utils/auth-utils';
import { storeMCPToken } from '@/utils/mcp-api';
import { Callback } from '@deriv-com/auth-client';
import { Button } from '@deriv-com/ui';

const APP_CLIENT_ID = '113192';

const getSelectedCurrency = (
    tokens: Record<string, string>,
    clientAccounts: Record<string, any>,
    state: any
): string => {
    const getQueryParams = new URLSearchParams(window.location.search);
    const currency =
        (state && state?.account) ||
        getQueryParams.get('account') ||
        sessionStorage.getItem('query_param_currency') ||
        '';
    const firstAccountKey = tokens.acct1;
    const firstAccountCurrency = clientAccounts[firstAccountKey]?.currency;

    const validCurrencies = [...fiat_currencies_display_order, ...crypto_currencies_display_order];
    if (tokens.acct1?.startsWith('VR') || currency === 'demo') return 'demo';
    if (currency && validCurrencies.includes(currency.toUpperCase())) return currency;
    return firstAccountCurrency || 'USD';
};

const PKCECallbackHandler = () => {
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const handlePKCECallback = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const returnedState = params.get('state');
            const errorParam = params.get('error');

            if (errorParam) {
                setStatus('error');
                setErrorMsg(`Authentication failed: ${params.get('error_description') || errorParam}`);
                return;
            }

            if (!code) {
                setStatus('error');
                setErrorMsg('No authorization code received.');
                return;
            }

            const storedState = sessionStorage.getItem('oauth_state');
            const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

            if (!storedState || storedState !== returnedState) {
                setStatus('error');
                setErrorMsg('State mismatch — possible CSRF attack. Please try again.');
                return;
            }

            if (!codeVerifier) {
                setStatus('error');
                setErrorMsg('Missing code verifier. Please try logging in again.');
                return;
            }

            try {
                const redirectUri = window.location.origin + '/callback';
                const body = new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: APP_CLIENT_ID,
                    code,
                    code_verifier: codeVerifier,
                    redirect_uri: redirectUri,
                });

                const tokenResponse = await fetch('https://auth.deriv.com/oauth2/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: body.toString(),
                });

                sessionStorage.removeItem('pkce_code_verifier');
                sessionStorage.removeItem('oauth_state');

                if (!tokenResponse.ok) {
                    const errData = await tokenResponse.json().catch(() => ({}));
                    throw new Error(errData.error_description || `Token exchange failed: ${tokenResponse.status}`);
                }

                const tokenData = await tokenResponse.json();
                const accessToken: string = tokenData.access_token;

                storeMCPToken(accessToken);

                const api = await generateDerivApiInstance();
                if (api) {
                    const { authorize, error } = await api.authorize(accessToken);
                    api.disconnect();

                    if (!error && authorize?.account_list?.length) {
                        const firstAccount = authorize.account_list[0];
                        localStorage.setItem('authToken', accessToken);
                        localStorage.setItem('active_loginid', firstAccount.loginid);
                        localStorage.setItem('callback_token', accessToken);

                        const accountsList: Record<string, string> = {};
                        authorize.account_list.forEach((acc: any) => {
                            accountsList[acc.loginid] = accessToken;
                        });
                        localStorage.setItem('accountsList', JSON.stringify(accountsList));

                        const isDemo = firstAccount.loginid?.startsWith('VR') || firstAccount.loginid?.startsWith('VRW');
                        const currency = isDemo ? 'demo' : (firstAccount.currency || 'USD');
                        window.location.replace(window.location.origin + `/bot/?account=${currency}`);
                        return;
                    }
                }

                localStorage.setItem('authToken', accessToken);
                window.location.replace(window.location.origin + '/bot/');
            } catch (err: any) {
                console.error('PKCE token exchange error:', err);
                setStatus('error');
                setErrorMsg(err.message || 'Authentication failed. Please try again.');
            }
        };

        handlePKCECallback();
    }, []);

    if (status === 'error') {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: '100vh',
                background: '#07111f', color: '#a8d4f5',
                gap: '16px', padding: '32px',
            }}>
                <h2 style={{ color: '#ff6b6b' }}>Login Error</h2>
                <p>{errorMsg}</p>
                <Button onClick={() => { window.location.href = '/'; }}>
                    Return to AHMEDSYNTRADER
                </Button>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '100vh',
            background: '#07111f', color: '#a8d4f5', gap: '16px',
        }}>
            <div style={{
                width: 48, height: 48, border: '3px solid #00d4ff',
                borderTopColor: 'transparent', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <p>Completing sign in…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const CallbackPage = () => {
    const params = new URLSearchParams(window.location.search);
    const isPKCECallback = params.has('code') && sessionStorage.getItem('pkce_code_verifier');

    if (isPKCECallback) {
        return <PKCECallbackHandler />;
    }

    return (
        <Callback
            onSignInSuccess={async (tokens: Record<string, string>, rawState: unknown) => {
                const state = rawState as { account?: string } | null;
                const accountsList: Record<string, string> = {};
                const clientAccounts: Record<string, { loginid: string; token: string; currency: string }> = {};

                for (const [key, value] of Object.entries(tokens)) {
                    if (key.startsWith('acct')) {
                        const tokenKey = key.replace('acct', 'token');
                        if (tokens[tokenKey]) {
                            accountsList[value] = tokens[tokenKey];
                            clientAccounts[value] = {
                                loginid: value,
                                token: tokens[tokenKey],
                                currency: '',
                            };
                        }
                    } else if (key.startsWith('cur')) {
                        const accKey = key.replace('cur', 'acct');
                        if (tokens[accKey]) {
                            clientAccounts[tokens[accKey]].currency = value;
                        }
                    }
                }

                localStorage.setItem('accountsList', JSON.stringify(accountsList));
                localStorage.setItem('clientAccounts', JSON.stringify(clientAccounts));

                let is_token_set = false;

                const api = await generateDerivApiInstance();
                if (api) {
                    const { authorize, error } = await api.authorize(tokens.token1);
                    api.disconnect();
                    if (error) {
                        if (error.code === 'InvalidToken') {
                            is_token_set = true;
                            const { is_tmb_enabled = false } = useTMB();
                            if (Cookies.get('logged_state') === 'true' && !is_tmb_enabled) {
                                globalObserver.emit('InvalidToken', { error });
                            }
                            if (Cookies.get('logged_state') === 'false') {
                                clearAuthData();
                            }
                        }
                    } else {
                        localStorage.setItem('callback_token', authorize.toString());
                        const clientAccountsArray = Object.values(clientAccounts);
                        const firstId = authorize?.account_list[0]?.loginid;
                        const filteredTokens = clientAccountsArray.filter(account => account.loginid === firstId);
                        if (filteredTokens.length) {
                            localStorage.setItem('authToken', filteredTokens[0].token);
                            localStorage.setItem('active_loginid', filteredTokens[0].loginid);
                            is_token_set = true;
                        }
                    }
                }
                if (!is_token_set) {
                    localStorage.setItem('authToken', tokens.token1);
                    localStorage.setItem('active_loginid', tokens.acct1);
                }
                const selected_currency = getSelectedCurrency(tokens, clientAccounts, state);
                window.location.replace(window.location.origin + `bot/?account=${selected_currency}`);
            }}
            renderReturnButton={() => {
                return (
                    <Button
                        className='callback-return-button'
                        onClick={() => {
                            window.location.href = '/';
                        }}
                    >
                        {'Return to AHMEDSYNTRADER'}
                    </Button>
                );
            }}
        />
    );
};

export default CallbackPage;
