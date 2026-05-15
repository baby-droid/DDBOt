import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { crypto_currencies_display_order, fiat_currencies_display_order } from '@/components/shared';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import { observer as globalObserver } from '@/external/bot-skeleton/utils/observer';
import useTMB from '@/hooks/useTMB';
import { clearAuthData } from '@/utils/auth-utils';
import { handlePKCECallback, hasPendingPKCE } from '@/utils/deriv-oauth';
import { Callback } from '@deriv-com/auth-client';
import { Button, Loader } from '@deriv-com/ui';

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

async function processTokensAndRedirect(tokens: Record<string, string>, state: any) {
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
    window.location.replace(window.location.origin + `/?account=${selected_currency}`);
}

const PKCECallbackHandler = () => {
    const [status, setStatus] = useState<'processing' | 'error'>('processing');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const tokens = await handlePKCECallback();
                if (!tokens) {
                    setStatus('error');
                    setErrorMsg('Authentication failed — invalid or expired session. Please try logging in again.');
                    return;
                }
                await processTokensAndRedirect(tokens, null);
            } catch (err) {
                console.error('PKCE callback error:', err);
                setStatus('error');
                setErrorMsg('An unexpected error occurred during login. Please try again.');
            }
        })();
    }, []);

    if (status === 'processing') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
                <Loader />
                <p style={{ color: '#ffffff', fontSize: '1rem' }}>Completing login with Deriv...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1.5rem' }}>
            <p style={{ color: '#ff4444', fontSize: '1rem', textAlign: 'center', maxWidth: '400px' }}>{errorMsg}</p>
            <Button onClick={() => { window.location.href = '/'; }}>Return to AHMEDSYNTRADER</Button>
        </div>
    );
};

const CallbackPage = () => {
    if (hasPendingPKCE()) {
        return <PKCECallbackHandler />;
    }

    return (
        <Callback
            onSignInSuccess={async (tokens: Record<string, string>, rawState: unknown) => {
                const state = rawState as { account?: string } | null;
                await processTokensAndRedirect(tokens, state);
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
