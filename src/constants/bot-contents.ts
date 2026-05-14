type TTabsTitle = {
    [key: string]: string | number;
};

type TDashboardTabIndex = {
    [key: string]: number;
};

export const tabs_title: TTabsTitle = Object.freeze({
    WORKSPACE: 'Workspace',
    CHART: 'Chart',
});

export const DBOT_TABS: TDashboardTabIndex = Object.freeze({
    DASHBOARD: 0,
    BOT_BUILDER: 1,
    CHART: 2,
    TUTORIAL: 3,
    FREE_BOTS: 4,
    ANALYSIS_TOOL: 5,
    TRADING_BOTS: 6,
    STRATEGIES: 7,
    RISK_CALCULATOR: 8,
    COPY_TRADING: 9,
    DTRADER: 10,
    TRADING_VIEW: 11,
});

export const MAX_STRATEGIES = 10;

export const TAB_IDS = [
    'id-dbot-dashboard',
    'id-bot-builder',
    'id-charts',
    'id-tutorials',
    'id-free-bots',
    'id-analysis-tool',
    'id-trading-bots',
    'id-strategies',
    'id-risk-calculator',
    'id-copy-trading',
    'id-dtrader',
    'id-trading-view',
];

export const DEBOUNCE_INTERVAL_TIME = 500;
