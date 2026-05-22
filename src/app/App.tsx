import { initSurvicate } from '../public-path';
import { lazy, Suspense } from 'react';
import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, useRouteError } from 'react-router-dom';
import ChunkLoader from '@/components/loader/chunk-loader';
import RoutePromptDialog from '@/components/route-prompt-dialog';
import { crypto_currencies_display_order, fiat_currencies_display_order } from '@/components/shared';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { StoreProvider } from '@/hooks/useStore';
import CallbackPage from '@/pages/callback';
import Endpoint from '@/pages/endpoint';
import { TAuthData } from '@/types/api-types';
import { initializeI18n, localize, TranslationProvider } from '@deriv-com/translations';
import CoreStoreProvider from './CoreStoreProvider';
import './app-root.scss';

const Layout = lazy(() => import('../components/layout'));
const AppRoot = lazy(() => import('./app-root'));
const FreeBots = lazy(() => import('../pages/free-bots'));
const AutoTrade = lazy(() => import('../pages/auto-trade'));
const AnalysisTool = lazy(() => import('../pages/analysis-tool'));

const { TRANSLATIONS_CDN_URL, R2_PROJECT_NAME, CROWDIN_BRANCH_NAME } = process.env;
const i18nInstance = initializeI18n({
    cdnUrl: `${TRANSLATIONS_CDN_URL}/${R2_PROJECT_NAME}/${CROWDIN_BRANCH_NAME}`,
});

// Simple Suspense wrapper without timeout that causes dark landing page
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => {
    const { isOnline } = useOfflineDetection();

    const getLoadingMessage = () => {
        if (!isOnline) return localize('Loading offline dashboard...');
        return localize('Please wait while we connect to the server...');
    };

    return <Suspense fallback={<ChunkLoader message={getLoadingMessage()} />}>{children}</Suspense>;
};

/* ── Nice error boundary shown instead of React Router's raw dev overlay ── */
const RouteErrorBoundary = () => {
    const err = useRouteError() as any;
    const is404 = err?.status === 404;
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '100vh',
            background: '#07111f', color: '#a8d4f5', gap: '18px', padding: '32px',
            fontFamily: 'Segoe UI, system-ui, sans-serif',
        }}>
            <div style={{ fontSize: '3rem' }}>{is404 ? '🔍' : '⚠️'}</div>
            <h2 style={{
                color: is404 ? '#00d4ff' : '#ff7b7b', margin: 0, fontSize: '1.3rem',
                background: 'none', padding: 0, borderRadius: 0,
            }}>
                {is404 ? 'Page not found' : 'Something went wrong'}
            </h2>
            <p style={{ margin: 0, textAlign: 'center', maxWidth: 380, fontSize: '0.85rem', color: 'rgba(168,212,245,0.65)' }}>
                {is404
                    ? 'This page does not exist. You may have followed an outdated link.'
                    : String(err?.message || err?.statusText || 'An unexpected error occurred.')}
            </p>
            <button
                onClick={() => { window.location.href = '/'; }}
                style={{
                    background: 'linear-gradient(90deg,#0077cc,#00b4d8)', border: 'none',
                    borderRadius: 8, color: '#fff', fontSize: '0.9rem', fontWeight: 600,
                    padding: '12px 28px', cursor: 'pointer',
                }}
            >
                Back to AHMEDSYNTRADER
            </button>
        </div>
    );
};

const AppShell = () => (
    <SuspenseWrapper>
        <TranslationProvider defaultLang='EN' i18nInstance={i18nInstance}>
            <StoreProvider>
                <RoutePromptDialog />
                <CoreStoreProvider>
                    <Layout />
                </CoreStoreProvider>
            </StoreProvider>
        </TranslationProvider>
    </SuspenseWrapper>
);

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path='/' element={<AppShell />} errorElement={<RouteErrorBoundary />}>
            <Route index element={<AppRoot />} />
            <Route path='endpoint' element={<Endpoint />} />
            <Route path='callback' element={<CallbackPage />} />
            <Route path='free-bots' element={<FreeBots />} />
            <Route path='auto-trade' element={<AutoTrade />} />
            <Route path='analysis-tool' element={<AnalysisTool />} />
            {/* bot/ alias — legacy redirect_uri target */}
            <Route path='bot' element={<AppRoot />} />
            {/* catch-all — shows nice 404 instead of dev overlay */}
            <Route path='*' element={<RouteErrorBoundary />} />
        </Route>
    )
);

function App() {
    React.useEffect(() => {
        initSurvicate();
        window?.dataLayer?.push({ event: 'page_load' });
        return () => {
            const survicate_box = document.getElementById('survicate-box');
            if (survicate_box) survicate_box.style.display = 'none';
        };
    }, []);

    React.useEffect(() => {
        /* ── Handle legacy Deriv OAuth tokens arriving at the root URL ──
           oauth.deriv.com sends: /?token1=XXX&acct1=CR123&cur1=USD&token2=…
           If the registered redirect_uri for app_id=113192 points to root,
           we process the tokens here before anything else renders.               */
        const params = new URLSearchParams(window.location.search);
        if (params.has('token1') && params.has('acct1')) {
            const accountsList: Record<string, string> = {};
            const clientAccounts: Record<string, { loginid: string; token: string; currency: string }> = {};
            let i = 1;
            while (params.has(`token${i}`) && params.has(`acct${i}`)) {
                const token = params.get(`token${i}`) ?? '';
                const acct  = params.get(`acct${i}`) ?? '';
                const cur   = params.get(`cur${i}`) ?? '';
                if (token && acct) {
                    accountsList[acct] = token;
                    clientAccounts[acct] = { loginid: acct, token, currency: cur };
                }
                i++;
            }
            const t1 = params.get('token1') ?? '';
            const a1 = params.get('acct1') ?? '';
            const c1 = params.get('cur1') ?? 'USD';
            localStorage.setItem('accountsList',   JSON.stringify(accountsList));
            localStorage.setItem('clientAccounts', JSON.stringify(clientAccounts));
            localStorage.setItem('authToken',       t1);
            localStorage.setItem('active_loginid',  a1);
            localStorage.setItem('callback_token',  t1);
            const isDemo = a1.startsWith('VR');
            window.history.replaceState({}, '', `/?account=${isDemo ? 'demo' : c1}`);
            return;
        }

        /* ── Handle ?account= switching once tokens are already stored ── */
        const accounts_list   = localStorage.getItem('accountsList');
        const client_accounts = localStorage.getItem('clientAccounts');
        const account_currency = params.get('account');
        const validCurrencies  = [...fiat_currencies_display_order, ...crypto_currencies_display_order];
        const is_valid_currency = account_currency && validCurrencies.includes(account_currency.toUpperCase());

        if (!accounts_list || !client_accounts) return;

        try {
            const parsed_accounts       = JSON.parse(accounts_list);
            const parsed_client_accounts = JSON.parse(client_accounts) as TAuthData['account_list'];

            const updateLocalStorage = (token: string, loginid: string) => {
                localStorage.setItem('authToken', token);
                localStorage.setItem('active_loginid', loginid);
            };

            if (account_currency?.toUpperCase() === 'DEMO') {
                const demo = Object.entries(parsed_accounts).find(([key]) => key.startsWith('VR'));
                if (demo) { updateLocalStorage(String(demo[1]), demo[0]); return; }
            }

            if (account_currency?.toUpperCase() !== 'DEMO' && is_valid_currency) {
                const real = Object.entries(parsed_client_accounts).find(
                    ([loginid, account]) =>
                        !loginid.startsWith('VR') &&
                        (account as any).currency.toUpperCase() === account_currency?.toUpperCase()
                );
                if (real) {
                    const [loginid, account] = real;
                    if ('token' in (account as any)) {
                        updateLocalStorage(String((account as any).token), loginid);
                    }
                }
            }
        } catch (e) {
            console.warn('App: account selection error', e); // eslint-disable-line no-console
        }
    }, []);

    return <RouterProvider router={router} />;
}

export default App;
