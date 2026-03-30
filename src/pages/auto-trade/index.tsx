import { useCallback, useEffect, useRef, useState } from 'react';
import './auto-trade.scss';

type SymbolKey =
    | 'R_10' | 'R_25' | 'R_50' | 'R_75' | 'R_100'
    | '1HZ10V' | '1HZ25V' | '1HZ50V' | '1HZ75V' | '1HZ100V';

type BotType = 'riseFall' | 'evenOdd' | 'matchesDiffers' | 'overUnder';

interface TickData { symbol: SymbolKey; quote: number; epoch: number; }

interface MarketStats {
    rise: number; fall: number;
    even: number; odd: number;
    matches: number; differs: number;
    over5: number; under5: number;
    lastDigits: number[];
    lastTicks: number[];
    currentStreak: { count: number; type: string };
    lastQuote: number;
    change: number;
}

interface BotPanel {
    id: number;
    type: BotType;
    symbol: SymbolKey;
    stake: number;
    ticks: number;
    martingale: number;
    condition: number;
    matchDigit: number;
    overUnderDigit: number;
    overUnderDir: 'over' | 'under';
    isRunning: boolean;
}

interface AIRecommendation {
    market: string; symbol: SymbolKey;
    trade: string; confidence: number;
    reason: string; icon: string;
}

const SYMBOLS: { key: SymbolKey; name: string; shortName: string; group: string }[] = [
    { key: 'R_10',    name: 'Volatility 10 Index',       shortName: 'V10',      group: 'Standard' },
    { key: 'R_25',    name: 'Volatility 25 Index',       shortName: 'V25',      group: 'Standard' },
    { key: 'R_50',    name: 'Volatility 50 Index',       shortName: 'V50',      group: 'Standard' },
    { key: 'R_75',    name: 'Volatility 75 Index',       shortName: 'V75',      group: 'Standard' },
    { key: 'R_100',   name: 'Volatility 100 Index',      shortName: 'V100',     group: 'Standard' },
    { key: '1HZ10V',  name: 'Volatility 10 (1s) Index',  shortName: 'V10(1s)',  group: '1-Second' },
    { key: '1HZ25V',  name: 'Volatility 25 (1s) Index',  shortName: 'V25(1s)',  group: '1-Second' },
    { key: '1HZ50V',  name: 'Volatility 50 (1s) Index',  shortName: 'V50(1s)',  group: '1-Second' },
    { key: '1HZ75V',  name: 'Volatility 75 (1s) Index',  shortName: 'V75(1s)',  group: '1-Second' },
    { key: '1HZ100V', name: 'Volatility 100 (1s) Index', shortName: 'V100(1s)', group: '1-Second' },
];

const INITIAL_STATS: MarketStats = {
    rise: 50, fall: 50, even: 50, odd: 50,
    matches: 50, differs: 50, over5: 50, under5: 50,
    lastDigits: [], lastTicks: [],
    currentStreak: { count: 0, type: 'Rise' },
    lastQuote: 0, change: 0,
};

const BOT_TYPES: { type: BotType; label: string; icon: string; color: string }[] = [
    { type: 'riseFall',       label: 'Rise / Fall',        icon: '↑↓', color: '#00d4ff' },
    { type: 'evenOdd',        label: 'Even / Odd',          icon: '⊞⊟', color: '#a78bfa' },
    { type: 'matchesDiffers', label: 'Matches / Differs',   icon: '≡≠', color: '#34d399' },
    { type: 'overUnder',      label: 'Over / Under',        icon: '▲▼', color: '#fb923c' },
];

let nextId = 1;
const makePanel = (type: BotType, symbol: SymbolKey): BotPanel => ({
    id: nextId++, type, symbol,
    stake: 1, ticks: 1, martingale: 1.5, condition: 60,
    matchDigit: 5, overUnderDigit: 5, overUnderDir: 'over', isRunning: false,
});

const DEFAULT_PANELS: BotPanel[] = [
    makePanel('riseFall',       'R_10'),
    makePanel('evenOdd',        'R_25'),
    makePanel('matchesDiffers', 'R_50'),
    makePanel('overUnder',      'R_75'),
];

function computeStats(ticks: number[], prev: MarketStats): MarketStats {
    if (ticks.length < 2) return prev;
    const last = ticks[ticks.length - 1];
    const p2   = ticks[ticks.length - 2];
    const change = ((last - p2) / (p2 || 1)) * 100;

    const riseCount = ticks.slice(1).filter((t, i) => t > ticks[i]).length;
    const rise = Math.round((riseCount / Math.max(ticks.length - 1, 1)) * 100);
    const fall = 100 - rise;

    const digits = ticks.map(t => {
        const s = t.toFixed(2).replace('.', '');
        return parseInt(s[s.length - 1], 10);
    });
    const lastDigits = digits.slice(-10);
    const even = Math.round((digits.filter(d => d % 2 === 0).length / Math.max(digits.length, 1)) * 100);
    const odd = 100 - even;
    const matches = Math.round((digits.filter(d => d === 5).length / Math.max(digits.length, 1)) * 100);
    const differs = 100 - matches;
    const over5 = Math.round((digits.filter(d => d > 5).length / Math.max(digits.length, 1)) * 100);
    const under5 = 100 - over5;

    let streakCount = 1;
    let streakType = ticks[ticks.length - 1] > ticks[ticks.length - 2] ? 'Rise' : 'Fall';
    for (let i = ticks.length - 1; i > 0; i--) {
        const cur = ticks[i] > ticks[i - 1];
        const first = ticks[ticks.length - 1] > ticks[ticks.length - 2];
        if (cur === first) streakCount++; else break;
    }

    return {
        rise, fall, even, odd, matches, differs, over5, under5,
        lastDigits, lastTicks: ticks.slice(-50),
        currentStreak: { count: streakCount, type: streakType },
        lastQuote: last, change,
    };
}

function getAIRecommendations(marketStats: Record<SymbolKey, MarketStats>): AIRecommendation[] {
    const recs: AIRecommendation[] = [];

    SYMBOLS.forEach(sym => {
        const s = marketStats[sym.key];
        if (s.lastQuote === 0) return;

        const best: { trade: string; confidence: number; reason: string; icon: string }[] = [
            { trade: s.rise > s.fall ? 'Rise' : 'Fall',       confidence: Math.max(s.rise, s.fall),    reason: `${Math.max(s.rise, s.fall)}% probability`,       icon: s.rise > s.fall ? '↑' : '↓' },
            { trade: s.even > s.odd ? 'Even' : 'Odd',         confidence: Math.max(s.even, s.odd),     reason: `Digit pattern ${Math.max(s.even, s.odd)}% bias`,  icon: s.even > s.odd ? '⊞' : '⊟' },
            { trade: s.over5 > s.under5 ? 'Over 5' : 'Under 5', confidence: Math.max(s.over5, s.under5), reason: `${Math.max(s.over5, s.under5)}% over/under bias`, icon: s.over5 > s.under5 ? '▲' : '▼' },
        ];

        const top = best.reduce((a, b) => a.confidence > b.confidence ? a : b);
        if (top.confidence >= 55) {
            recs.push({ market: sym.shortName, symbol: sym.key, ...top });
        }
    });

    return recs.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

const emptyStats = () => {
    const out: Record<string, MarketStats> = {};
    SYMBOLS.forEach(s => { out[s.key] = { ...INITIAL_STATS }; });
    return out as Record<SymbolKey, MarketStats>;
};

const AutoTrade = () => {
    const [activeSymbol, setActiveSymbol] = useState<SymbolKey>('R_10');
    const [marketStats, setMarketStats] = useState<Record<SymbolKey, MarketStats>>(emptyStats);
    const [panels, setPanels] = useState<BotPanel[]>(DEFAULT_PANELS);
    const [wsConnected, setWsConnected] = useState(false);
    const [showMarketPicker, setShowMarketPicker] = useState(false);
    const [aiRecs, setAiRecs] = useState<AIRecommendation[]>([]);
    const [starPositions] = useState(() =>
        Array.from({ length: 100 }, () => ({
            x: Math.random() * 100, y: Math.random() * 100,
            size: Math.random() * 2 + 0.5,
            delay: Math.random() * 4, duration: Math.random() * 3 + 2,
        }))
    );

    const wsRef  = useRef<WebSocket | null>(null);
    const ticksRef = useRef<Record<SymbolKey, number[]>>({} as Record<SymbolKey, number[]>);
    SYMBOLS.forEach(s => { ticksRef.current[s.key] = ticksRef.current[s.key] || []; });

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;
        const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
        wsRef.current = ws;

        ws.onopen = () => {
            setWsConnected(true);
            SYMBOLS.forEach(({ key }) => {
                ws.send(JSON.stringify({ ticks_history: key, count: 100, end: 'latest', style: 'ticks', subscribe: 1 }));
            });
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.error) return;
                if (data.msg_type === 'history' && data.history) {
                    const sym = data.echo_req.ticks_history as SymbolKey;
                    const prices = data.history.prices.map(Number);
                    ticksRef.current[sym] = prices;
                    setMarketStats(prev => {
                        const next = { ...prev, [sym]: computeStats(prices, prev[sym]) };
                        setAiRecs(getAIRecommendations(next));
                        return next;
                    });
                }
                if (data.msg_type === 'tick' && data.tick) {
                    const tick = data.tick as TickData;
                    const sym = tick.symbol;
                    ticksRef.current[sym] = [...(ticksRef.current[sym] || []), tick.quote].slice(-200);
                    const ticks = ticksRef.current[sym];
                    setMarketStats(prev => {
                        const next = { ...prev, [sym]: computeStats(ticks, prev[sym]) };
                        setAiRecs(getAIRecommendations(next));
                        return next;
                    });
                }
            } catch { /* ignore */ }
        };

        ws.onclose = () => { setWsConnected(false); setTimeout(connect, 3000); };
        ws.onerror = () => ws.close();
    }, []);

    useEffect(() => {
        connect();
        return () => wsRef.current?.close();
    }, [connect]);

    const togglePanel = (id: number) =>
        setPanels(prev => prev.map(p => p.id === id ? { ...p, isRunning: !p.isRunning } : p));

    const updatePanel = (id: number, field: keyof BotPanel, value: unknown) =>
        setPanels(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

    const removePanel = (id: number) =>
        setPanels(prev => prev.filter(p => p.id !== id));

    const addPanel = (type: BotType) =>
        setPanels(prev => [...prev, makePanel(type, activeSymbol)]);

    const stats = marketStats[activeSymbol];
    const activeSym = SYMBOLS.find(s => s.key === activeSymbol)!;

    const getBotStats = (panel: BotPanel) => {
        const s = marketStats[panel.symbol];
        switch (panel.type) {
            case 'riseFall':       return { a: s.rise,    b: s.fall,    aLabel: 'Rise',    bLabel: 'Fall',    color: '#00d4ff' };
            case 'evenOdd':        return { a: s.even,    b: s.odd,     aLabel: 'Even',    bLabel: 'Odd',     color: '#a78bfa' };
            case 'matchesDiffers': return { a: s.matches, b: s.differs, aLabel: 'Matches', bLabel: 'Differs', color: '#34d399' };
            case 'overUnder':      return { a: s.over5,   b: s.under5,  aLabel: 'Over 5',  bLabel: 'Under 5', color: '#fb923c' };
        }
    };

    const standardSymbols = SYMBOLS.filter(s => s.group === 'Standard');
    const oneSecSymbols   = SYMBOLS.filter(s => s.group === '1-Second');

    return (
        <div className='autotrade'>
            {starPositions.map((star, i) => (
                <div key={i} className='autotrade__star' style={{
                    left: `${star.x}%`, top: `${star.y}%`,
                    width: `${star.size}px`, height: `${star.size}px`,
                    animationDelay: `${star.delay}s`, animationDuration: `${star.duration}s`,
                }} />
            ))}
            <div className='autotrade__nebula autotrade__nebula--1' />
            <div className='autotrade__nebula autotrade__nebula--2' />
            <div className='autotrade__nebula autotrade__nebula--3' />

            <div className='autotrade__content'>

                {/* ── Header ── */}
                <div className='autotrade__header'>
                    <div className='autotrade__header-left'>
                        <div className='autotrade__header-badge'><span className='autotrade__header-badge-dot' />LIVE</div>
                        <h1 className='autotrade__title'><span className='autotrade__title-accent'>AUTO</span>TRADE</h1>
                        <p className='autotrade__subtitle'>AHMEDSYNTRADER · Real-Time Market Intelligence</p>
                    </div>
                    <div className='autotrade__header-right'>
                        <div className={`autotrade__ws-status ${wsConnected ? 'autotrade__ws-status--connected' : 'autotrade__ws-status--disconnected'}`}>
                            <span className='autotrade__ws-dot' />
                            {wsConnected ? 'CONNECTED' : 'CONNECTING...'}
                        </div>
                        <button className='autotrade__market-btn' onClick={() => setShowMarketPicker(v => !v)}>
                            <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'><path d='M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z'/></svg>
                            Change Market
                        </button>
                    </div>
                </div>

                {/* ── Market Picker Modal ── */}
                {showMarketPicker && (
                    <div className='autotrade__market-modal' onClick={() => setShowMarketPicker(false)}>
                        <div className='autotrade__market-modal-inner' onClick={e => e.stopPropagation()}>
                            <div className='autotrade__market-modal-title'>
                                Select Market
                                <button className='autotrade__market-modal-close' onClick={() => setShowMarketPicker(false)}>✕</button>
                            </div>
                            <div className='autotrade__market-group-label'>Standard Volatility</div>
                            <div className='autotrade__market-grid'>
                                {standardSymbols.map(sym => (
                                    <button
                                        key={sym.key}
                                        className={`autotrade__market-option ${activeSymbol === sym.key ? 'autotrade__market-option--active' : ''}`}
                                        onClick={() => { setActiveSymbol(sym.key); setShowMarketPicker(false); }}
                                    >
                                        <span className='autotrade__market-option-short'>{sym.shortName}</span>
                                        <span className='autotrade__market-option-name'>{sym.name}</span>
                                        {marketStats[sym.key].lastQuote > 0 && (
                                            <span className='autotrade__market-option-price'>{marketStats[sym.key].lastQuote.toFixed(2)}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className='autotrade__market-group-label'>1-Second Volatility</div>
                            <div className='autotrade__market-grid'>
                                {oneSecSymbols.map(sym => (
                                    <button
                                        key={sym.key}
                                        className={`autotrade__market-option ${activeSymbol === sym.key ? 'autotrade__market-option--active' : ''}`}
                                        onClick={() => { setActiveSymbol(sym.key); setShowMarketPicker(false); }}
                                    >
                                        <span className='autotrade__market-option-short'>{sym.shortName}</span>
                                        <span className='autotrade__market-option-name'>{sym.name}</span>
                                        {marketStats[sym.key].lastQuote > 0 && (
                                            <span className='autotrade__market-option-price'>{marketStats[sym.key].lastQuote.toFixed(2)}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Symbol Tab Bar ── */}
                <div className='autotrade__symbol-bar'>
                    {SYMBOLS.filter(s => s.group === 'Standard').map(sym => {
                        const s = marketStats[sym.key];
                        return (
                            <button key={sym.key} className={`autotrade__symbol-btn ${activeSymbol === sym.key ? 'autotrade__symbol-btn--active' : ''}`} onClick={() => setActiveSymbol(sym.key)}>
                                <span className='autotrade__symbol-name'>{sym.shortName}</span>
                                {s.lastQuote > 0 && (
                                    <>
                                        <span className='autotrade__symbol-price'>{s.lastQuote.toFixed(2)}</span>
                                        <span className={`autotrade__symbol-change ${s.change >= 0 ? 'autotrade__symbol-change--up' : 'autotrade__symbol-change--down'}`}>
                                            {s.change >= 0 ? '▲' : '▼'} {Math.abs(s.change).toFixed(3)}%
                                        </span>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── Market Overview ── */}
                <div className='autotrade__market-overview'>
                    <div className='autotrade__overview-card'>
                        <div className='autotrade__overview-header'>
                            <span className='autotrade__overview-symbol'>{activeSym.name}</span>
                            <span className='autotrade__overview-quote'>{stats.lastQuote > 0 ? stats.lastQuote.toFixed(4) : '—'}</span>
                        </div>
                        <div className='autotrade__overview-body'>
                            {[
                                { label: 'Rise',    val: stats.rise,    cls: 'rise' },
                                { label: 'Fall',    val: stats.fall,    cls: 'fall' },
                                { label: 'Even',    val: stats.even,    cls: 'even' },
                                { label: 'Odd',     val: stats.odd,     cls: 'odd' },
                                { label: 'Matches', val: stats.matches, cls: 'matches' },
                                { label: 'Differs', val: stats.differs, cls: 'differs' },
                                { label: 'Over 5',  val: stats.over5,   cls: 'over' },
                                { label: 'Under 5', val: stats.under5,  cls: 'under' },
                            ].map(row => (
                                <div key={row.label} className='autotrade__stat-row'>
                                    <span className='autotrade__stat-label'>{row.label}</span>
                                    <div className='autotrade__stat-bar'>
                                        <div className={`autotrade__stat-bar-fill autotrade__stat-bar-fill--${row.cls}`} style={{ width: `${row.val}%` }}>
                                            <span className='autotrade__stat-bar-pct'>{row.val}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className='autotrade__digits-section'>
                            <span className='autotrade__digits-label'>Last Digit Pattern</span>
                            <div className='autotrade__digits-row'>
                                {stats.lastDigits.length > 0
                                    ? stats.lastDigits.map((d, i) => (
                                        <span key={i} className={`autotrade__digit ${d % 2 === 0 ? 'autotrade__digit--even' : 'autotrade__digit--odd'} ${d > 5 ? 'autotrade__digit--over' : ''}`}>{d}</span>
                                    ))
                                    : Array.from({ length: 10 }, (_, i) => <span key={i} className='autotrade__digit autotrade__digit--empty'>—</span>)
                                }
                            </div>
                            {stats.currentStreak.count > 1 && (
                                <span className='autotrade__streak'>Streak: <strong>{stats.currentStreak.count}× {stats.currentStreak.type}</strong></span>
                            )}
                        </div>
                        {stats.lastTicks.length > 2 && (
                            <div className='autotrade__tick-chart'>
                                <svg viewBox='0 0 400 60' preserveAspectRatio='none' width='100%' height='60'>
                                    <defs>
                                        <linearGradient id='chartGrad' x1='0' y1='0' x2='0' y2='1'>
                                            <stop offset='0%' stopColor='#00f5ff' stopOpacity='0.4' />
                                            <stop offset='100%' stopColor='#00f5ff' stopOpacity='0' />
                                        </linearGradient>
                                    </defs>
                                    {(() => {
                                        const t = stats.lastTicks;
                                        const mn = Math.min(...t); const mx = Math.max(...t);
                                        const rng = mx - mn || 1;
                                        const pts = t.map((v, i) => `${(i / (t.length - 1)) * 400},${55 - ((v - mn) / rng) * 50}`);
                                        const poly = pts.join(' ');
                                        return (
                                            <>
                                                <polygon points={`0,60 ${poly} 400,60`} fill='url(#chartGrad)' />
                                                <polyline points={poly} fill='none' stroke='#00f5ff' strokeWidth='1.5' />
                                            </>
                                        );
                                    })()}
                                </svg>
                            </div>
                        )}
                    </div>

                    <div className='autotrade__mini-stats'>
                        {SYMBOLS.filter(s => s.group === 'Standard').map(sym => {
                            const s = marketStats[sym.key];
                            return (
                                <div key={sym.key} className={`autotrade__mini-card ${activeSymbol === sym.key ? 'autotrade__mini-card--active' : ''}`} onClick={() => setActiveSymbol(sym.key)}>
                                    <div className='autotrade__mini-card-title'>{sym.shortName}</div>
                                    <div className='autotrade__mini-row'>
                                        <span className='autotrade__mini-rise'>{s.rise}%</span>
                                        <span className='autotrade__mini-sep'>/</span>
                                        <span className='autotrade__mini-fall'>{s.fall}%</span>
                                    </div>
                                    <div className='autotrade__mini-bar'><div className='autotrade__mini-bar-rise' style={{ width: `${s.rise}%` }} /></div>
                                    <div className='autotrade__mini-eo'>
                                        <span className='autotrade__mini-even'>E:{s.even}%</span>
                                        <span className='autotrade__mini-odd'>O:{s.odd}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Add Bot Buttons ── */}
                <div className='autotrade__add-bots'>
                    <span className='autotrade__add-bots-label'>Add Trading Bot:</span>
                    {BOT_TYPES.map(bt => (
                        <button key={bt.type} className='autotrade__add-bot-btn' style={{ '--bot-color': bt.color } as React.CSSProperties} onClick={() => addPanel(bt.type)}>
                            <span className='autotrade__add-bot-icon'>{bt.icon}</span>
                            {bt.label}
                        </button>
                    ))}
                </div>

                {/* ── Bot Panels ── */}
                <div className='autotrade__panels'>
                    {panels.map(panel => {
                        const bs   = getBotStats(panel);
                        const rec  = bs.a >= bs.b ? bs.aLabel : bs.bLabel;
                        const recPct = Math.max(bs.a, bs.b);
                        const botMeta = BOT_TYPES.find(b => b.type === panel.type)!;
                        const symInfo  = SYMBOLS.find(s => s.key === panel.symbol)!;

                        return (
                            <div key={panel.id} className={`autotrade__panel autotrade__panel--${panel.type} ${panel.isRunning ? 'autotrade__panel--running' : ''}`} style={{ '--panel-color': bs.color } as React.CSSProperties}>
                                <div className='autotrade__panel-header'>
                                    <span className='autotrade__panel-icon'>{botMeta.icon}</span>
                                    <span className='autotrade__panel-title'>{botMeta.label}</span>
                                    <div className={`autotrade__panel-status ${panel.isRunning ? 'autotrade__panel-status--on' : ''}`} />
                                    <button className='autotrade__panel-remove' onClick={() => removePanel(panel.id)}>✕</button>
                                </div>

                                <div className='autotrade__panel-market-row'>
                                    <span className='autotrade__panel-market-label'>Market:</span>
                                    <select
                                        className='autotrade__panel-select autotrade__panel-select--market'
                                        value={panel.symbol}
                                        onChange={e => updatePanel(panel.id, 'symbol', e.target.value as SymbolKey)}
                                    >
                                        {SYMBOLS.map(s => <option key={s.key} value={s.key}>{s.shortName} — {s.name}</option>)}
                                    </select>
                                </div>

                                <div className='autotrade__panel-rec'>
                                    <span>Recommendation:</span>
                                    <strong className='autotrade__panel-rec-val'>{rec}</strong>
                                    <span className={`autotrade__panel-rec-pct ${recPct >= 65 ? 'autotrade__panel-rec-pct--strong' : ''}`}>{recPct}%</span>
                                </div>

                                <div className='autotrade__panel-bars'>
                                    {[{ label: bs.aLabel, val: bs.a, cls: 'rise' }, { label: bs.bLabel, val: bs.b, cls: 'fall' }].map(row => (
                                        <div key={row.label} className='autotrade__panel-bar-row'>
                                            <span className='autotrade__panel-bar-label'>{row.label}</span>
                                            <div className='autotrade__panel-bar'>
                                                <div className={`autotrade__panel-bar-fill autotrade__panel-bar-fill--${row.cls}`} style={{ width: `${row.val}%` }}>
                                                    <span>{row.val}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {panel.type === 'matchesDiffers' && (
                                    <div className='autotrade__panel-extra'>
                                        <label>Match Digit</label>
                                        <input type='number' min='0' max='9' className='autotrade__panel-input' value={panel.matchDigit}
                                            onChange={e => updatePanel(panel.id, 'matchDigit', parseInt(e.target.value))} />
                                    </div>
                                )}
                                {panel.type === 'overUnder' && (
                                    <div className='autotrade__panel-extra'>
                                        <label>Barrier Digit</label>
                                        <input type='number' min='0' max='9' className='autotrade__panel-input' value={panel.overUnderDigit}
                                            onChange={e => updatePanel(panel.id, 'overUnderDigit', parseInt(e.target.value))} />
                                        <select className='autotrade__panel-select' value={panel.overUnderDir}
                                            onChange={e => updatePanel(panel.id, 'overUnderDir', e.target.value)}>
                                            <option value='over'>Over</option>
                                            <option value='under'>Under</option>
                                        </select>
                                    </div>
                                )}

                                <div className='autotrade__panel-params'>
                                    <div className='autotrade__panel-param'>
                                        <label>Stake ($)</label>
                                        <input type='number' min='0.35' step='0.5' className='autotrade__panel-input' value={panel.stake}
                                            onChange={e => updatePanel(panel.id, 'stake', parseFloat(e.target.value))} />
                                    </div>
                                    <div className='autotrade__panel-param'>
                                        <label>Ticks</label>
                                        <input type='number' min='1' max='10' className='autotrade__panel-input' value={panel.ticks}
                                            onChange={e => updatePanel(panel.id, 'ticks', parseInt(e.target.value))} />
                                    </div>
                                    <div className='autotrade__panel-param'>
                                        <label>Martingale</label>
                                        <input type='number' min='1' max='5' step='0.1' className='autotrade__panel-input' value={panel.martingale}
                                            onChange={e => updatePanel(panel.id, 'martingale', parseFloat(e.target.value))} />
                                    </div>
                                    <div className='autotrade__panel-param'>
                                        <label>Min %</label>
                                        <input type='number' min='50' max='100' className='autotrade__panel-input' value={panel.condition}
                                            onChange={e => updatePanel(panel.id, 'condition', parseInt(e.target.value))} />
                                    </div>
                                </div>

                                <button className={`autotrade__panel-btn ${panel.isRunning ? 'autotrade__panel-btn--stop' : 'autotrade__panel-btn--start'}`} onClick={() => togglePanel(panel.id)}>
                                    {panel.isRunning
                                        ? <><span className='autotrade__panel-btn-dot' />Stop Bot</>
                                        : <><svg width='12' height='12' viewBox='0 0 24 24' fill='currentColor'><path d='M8 5v14l11-7z' /></svg>Start Bot</>
                                    }
                                </button>
                            </div>
                        );
                    })}

                    {panels.length === 0 && (
                        <div className='autotrade__panels-empty'>
                            <span>No bots added yet.</span>
                            <span>Click "Add Trading Bot" above to get started.</span>
                        </div>
                    )}
                </div>

                {/* ── AI Super Analyser ── */}
                <div className='autotrade__ai'>
                    <div className='autotrade__ai-header'>
                        <div className='autotrade__ai-badge'>
                            <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/></svg>
                            AI
                        </div>
                        <h2 className='autotrade__ai-title'>SUPER ANALYSER</h2>
                        <p className='autotrade__ai-subtitle'>Neural market intelligence · Real-time signal analysis</p>
                    </div>

                    {aiRecs.length > 0 ? (
                        <div className='autotrade__ai-grid'>
                            {aiRecs.map((rec, i) => (
                                <div key={i} className={`autotrade__ai-card ${i === 0 ? 'autotrade__ai-card--top' : ''}`}>
                                    {i === 0 && <div className='autotrade__ai-card-crown'>👑 BEST SIGNAL</div>}
                                    <div className='autotrade__ai-card-top'>
                                        <span className='autotrade__ai-card-icon'>{rec.icon}</span>
                                        <div className='autotrade__ai-card-info'>
                                            <span className='autotrade__ai-card-market'>{rec.market}</span>
                                            <span className='autotrade__ai-card-trade'>{rec.trade}</span>
                                        </div>
                                        <div className='autotrade__ai-card-conf'>
                                            <span className='autotrade__ai-card-conf-num'>{rec.confidence}%</span>
                                            <div className='autotrade__ai-conf-bar'>
                                                <div className='autotrade__ai-conf-fill' style={{ width: `${Math.min((rec.confidence - 50) * 2, 100)}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                    <p className='autotrade__ai-card-reason'>{rec.reason}</p>
                                    <button
                                        className='autotrade__ai-apply-btn'
                                        onClick={() => {
                                            const type: BotType = rec.trade.toLowerCase().includes('rise') || rec.trade.toLowerCase().includes('fall') ? 'riseFall' :
                                                rec.trade.toLowerCase().includes('even') || rec.trade.toLowerCase().includes('odd') ? 'evenOdd' :
                                                rec.trade.toLowerCase().includes('over') || rec.trade.toLowerCase().includes('under') ? 'overUnder' : 'matchesDiffers';
                                            setPanels(prev => [...prev, makePanel(type, rec.symbol)]);
                                        }}
                                    >
                                        + Apply Signal
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='autotrade__ai-loading'>
                            <div className='autotrade__ai-spinner' />
                            <span>Analysing market data across all indices...</span>
                        </div>
                    )}

                    <div className='autotrade__ai-summary'>
                        <div className='autotrade__ai-summary-row'>
                            {SYMBOLS.filter(s => s.group === 'Standard').map(sym => {
                                const s = marketStats[sym.key];
                                const best = Math.max(s.rise, s.fall, s.even, s.odd, s.over5, s.under5);
                                const signal = best >= 65 ? 'STRONG' : best >= 58 ? 'MODERATE' : 'WEAK';
                                return (
                                    <div key={sym.key} className={`autotrade__ai-market-chip autotrade__ai-market-chip--${signal.toLowerCase()}`}>
                                        <span>{sym.shortName}</span>
                                        <span className='autotrade__ai-chip-signal'>{signal}</span>
                                        <span className='autotrade__ai-chip-pct'>{best}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className='autotrade__disclaimer'>
                    <span>⚠</span>
                    <p>AutoTrade is for educational purposes only. Live data via Deriv API. AI signals are statistical estimates only. Always use a demo account first. Trading involves significant risk of loss.</p>
                </div>
            </div>
        </div>
    );
};

export default AutoTrade;
