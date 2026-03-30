import { useEffect, useRef, useState, useCallback } from 'react';
import './auto-trade.scss';

type SymbolKey = 'R_10' | 'R_25' | 'R_50' | 'R_75' | 'R_100';

interface TickData {
    symbol: SymbolKey;
    quote: number;
    epoch: number;
}

interface MarketStats {
    rise: number;
    fall: number;
    even: number;
    odd: number;
    lastDigits: number[];
    lastTicks: number[];
    currentStreak: { count: number; type: 'Rise' | 'Fall' | 'Even' | 'Odd' };
    lastQuote: number;
    change: number;
}

interface PanelConfig {
    symbol: SymbolKey;
    label: string;
    mode: 'riseFall' | 'evenOdd';
    stake: number;
    ticks: number;
    martingale: number;
    condition: number;
    isRunning: boolean;
}

const SYMBOLS: { key: SymbolKey; name: string; shortName: string }[] = [
    { key: 'R_10', name: 'Volatility 10 Index', shortName: 'V10' },
    { key: 'R_25', name: 'Volatility 25 Index', shortName: 'V25' },
    { key: 'R_50', name: 'Volatility 50 Index', shortName: 'V50' },
    { key: 'R_75', name: 'Volatility 75 Index', shortName: 'V75' },
    { key: 'R_100', name: 'Volatility 100 Index', shortName: 'V100' },
];

const INITIAL_STATS: MarketStats = {
    rise: 50,
    fall: 50,
    even: 50,
    odd: 50,
    lastDigits: [],
    lastTicks: [],
    currentStreak: { count: 0, type: 'Rise' },
    lastQuote: 0,
    change: 0,
};

const DEFAULT_PANELS: PanelConfig[] = [
    { symbol: 'R_10', label: 'Rise / Fall', mode: 'riseFall', stake: 5, ticks: 1, martingale: 1, condition: 65, isRunning: false },
    { symbol: 'R_25', label: 'Even / Odd', mode: 'evenOdd', stake: 5, ticks: 1, martingale: 1, condition: 60, isRunning: false },
    { symbol: 'R_50', label: 'Digit Over', mode: 'evenOdd', stake: 5, ticks: 1, martingale: 1, condition: 55, isRunning: false },
];

function computeStats(ticks: number[], prevStats: MarketStats): MarketStats {
    if (ticks.length < 2) return prevStats;

    const last = ticks[ticks.length - 1];
    const prev = ticks[ticks.length - 2];
    const change = ((last - prev) / prev) * 100;

    const totalTicks = ticks.length;
    const riseCount = ticks.slice(1).filter((t, i) => t > ticks[i]).length;
    const rise = Math.round((riseCount / Math.max(totalTicks - 1, 1)) * 100);
    const fall = 100 - rise;

    const digits = ticks.map(t => {
        const str = t.toFixed(2).replace('.', '');
        return parseInt(str[str.length - 1], 10);
    });

    const lastDigits = digits.slice(-8);
    const evenCount = digits.filter(d => d % 2 === 0).length;
    const even = Math.round((evenCount / Math.max(digits.length, 1)) * 100);
    const odd = 100 - even;

    let streakCount = 1;
    let streakType: 'Rise' | 'Fall' | 'Even' | 'Odd' = 'Rise';
    for (let i = ticks.length - 1; i > 0; i--) {
        const isRise = ticks[i] > ticks[i - 1];
        const firstIsRise = ticks[ticks.length - 1] > ticks[ticks.length - 2];
        if (isRise === firstIsRise) {
            streakCount++;
            streakType = isRise ? 'Rise' : 'Fall';
        } else break;
    }

    return {
        rise,
        fall,
        even,
        odd,
        lastDigits,
        lastTicks: ticks.slice(-40),
        currentStreak: { count: streakCount, type: streakType },
        lastQuote: last,
        change,
    };
}

const AutoTrade = () => {
    const [activeSymbol, setActiveSymbol] = useState<SymbolKey>('R_10');
    const [marketStats, setMarketStats] = useState<Record<SymbolKey, MarketStats>>({
        R_10: { ...INITIAL_STATS },
        R_25: { ...INITIAL_STATS },
        R_50: { ...INITIAL_STATS },
        R_75: { ...INITIAL_STATS },
        R_100: { ...INITIAL_STATS },
    });
    const [panels, setPanels] = useState<PanelConfig[]>(DEFAULT_PANELS);
    const [wsConnected, setWsConnected] = useState(false);
    const [starPositions] = useState(() =>
        Array.from({ length: 120 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 0.5,
            delay: Math.random() * 4,
            duration: Math.random() * 3 + 2,
        }))
    );

    const wsRef = useRef<WebSocket | null>(null);
    const ticksRef = useRef<Record<SymbolKey, number[]>>({
        R_10: [], R_25: [], R_50: [], R_75: [], R_100: [],
    });

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
        wsRef.current = ws;

        ws.onopen = () => {
            setWsConnected(true);
            SYMBOLS.forEach(({ key }) => {
                ws.send(JSON.stringify({ ticks_history: key, count: 60, end: 'latest', style: 'ticks', subscribe: 1 }));
            });
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.error) return;

                if (data.msg_type === 'history' && data.history) {
                    const symbol = data.echo_req.ticks_history as SymbolKey;
                    const prices = data.history.prices.map(Number);
                    ticksRef.current[symbol] = prices;
                    setMarketStats(prev => ({
                        ...prev,
                        [symbol]: computeStats(prices, prev[symbol]),
                    }));
                }

                if (data.msg_type === 'tick' && data.tick) {
                    const tick = data.tick as TickData;
                    const symbol = tick.symbol;
                    ticksRef.current[symbol] = [...ticksRef.current[symbol], tick.quote].slice(-200);
                    const ticks = ticksRef.current[symbol];
                    setMarketStats(prev => ({
                        ...prev,
                        [symbol]: computeStats(ticks, prev[symbol]),
                    }));
                }
            } catch {}
        };

        ws.onclose = () => {
            setWsConnected(false);
            setTimeout(connect, 3000);
        };

        ws.onerror = () => {
            ws.close();
        };
    }, []);

    useEffect(() => {
        connect();
        return () => {
            wsRef.current?.close();
        };
    }, [connect]);

    const togglePanel = (index: number) => {
        setPanels(prev => prev.map((p, i) => i === index ? { ...p, isRunning: !p.isRunning } : p));
    };

    const updatePanel = (index: number, field: keyof PanelConfig, value: string | number | boolean | SymbolKey) => {
        setPanels(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
    };

    const stats = marketStats[activeSymbol];
    const activeSymbolInfo = SYMBOLS.find(s => s.key === activeSymbol)!;

    return (
        <div className='autotrade'>
            {/* Stars */}
            <div className='autotrade__stars'>
                {starPositions.map((star, i) => (
                    <div
                        key={i}
                        className='autotrade__star'
                        style={{
                            left: `${star.x}%`,
                            top: `${star.y}%`,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            animationDelay: `${star.delay}s`,
                            animationDuration: `${star.duration}s`,
                        }}
                    />
                ))}
            </div>

            {/* Nebula glow effects */}
            <div className='autotrade__nebula autotrade__nebula--1' />
            <div className='autotrade__nebula autotrade__nebula--2' />
            <div className='autotrade__nebula autotrade__nebula--3' />

            <div className='autotrade__content'>
                {/* Header */}
                <div className='autotrade__header'>
                    <div className='autotrade__header-left'>
                        <div className='autotrade__header-badge'>
                            <span className='autotrade__header-badge-dot' />
                            LIVE
                        </div>
                        <h1 className='autotrade__title'>
                            <span className='autotrade__title-accent'>AUTO</span>TRADE
                        </h1>
                        <p className='autotrade__subtitle'>Real-Time Market Intelligence</p>
                    </div>
                    <div className='autotrade__header-right'>
                        <div className={`autotrade__ws-status ${wsConnected ? 'autotrade__ws-status--connected' : 'autotrade__ws-status--disconnected'}`}>
                            <span className='autotrade__ws-dot' />
                            {wsConnected ? 'CONNECTED' : 'CONNECTING...'}
                        </div>
                    </div>
                </div>

                {/* Symbol selector */}
                <div className='autotrade__symbol-bar'>
                    {SYMBOLS.map(sym => {
                        const s = marketStats[sym.key];
                        const isUp = s.change >= 0;
                        return (
                            <button
                                key={sym.key}
                                className={`autotrade__symbol-btn ${activeSymbol === sym.key ? 'autotrade__symbol-btn--active' : ''}`}
                                onClick={() => setActiveSymbol(sym.key)}
                            >
                                <span className='autotrade__symbol-name'>{sym.shortName}</span>
                                {s.lastQuote > 0 && (
                                    <>
                                        <span className='autotrade__symbol-price'>{s.lastQuote.toFixed(2)}</span>
                                        <span className={`autotrade__symbol-change ${isUp ? 'autotrade__symbol-change--up' : 'autotrade__symbol-change--down'}`}>
                                            {isUp ? '▲' : '▼'} {Math.abs(s.change).toFixed(3)}%
                                        </span>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Main market stats */}
                <div className='autotrade__market-overview'>
                    <div className='autotrade__overview-card'>
                        <div className='autotrade__overview-header'>
                            <span className='autotrade__overview-symbol'>{activeSymbolInfo.name}</span>
                            <span className='autotrade__overview-quote'>{stats.lastQuote > 0 ? stats.lastQuote.toFixed(4) : '—'}</span>
                        </div>

                        <div className='autotrade__overview-body'>
                            <div className='autotrade__stat-row'>
                                <span className='autotrade__stat-label'>Rise</span>
                                <div className='autotrade__stat-bar'>
                                    <div className='autotrade__stat-bar-fill autotrade__stat-bar-fill--rise' style={{ width: `${stats.rise}%` }}>
                                        <span className='autotrade__stat-bar-pct'>{stats.rise}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className='autotrade__stat-row'>
                                <span className='autotrade__stat-label'>Fall</span>
                                <div className='autotrade__stat-bar'>
                                    <div className='autotrade__stat-bar-fill autotrade__stat-bar-fill--fall' style={{ width: `${stats.fall}%` }}>
                                        <span className='autotrade__stat-bar-pct'>{stats.fall}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className='autotrade__stat-row'>
                                <span className='autotrade__stat-label'>Even</span>
                                <div className='autotrade__stat-bar'>
                                    <div className='autotrade__stat-bar-fill autotrade__stat-bar-fill--even' style={{ width: `${stats.even}%` }}>
                                        <span className='autotrade__stat-bar-pct'>{stats.even}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className='autotrade__stat-row'>
                                <span className='autotrade__stat-label'>Odd</span>
                                <div className='autotrade__stat-bar'>
                                    <div className='autotrade__stat-bar-fill autotrade__stat-bar-fill--odd' style={{ width: `${stats.odd}%` }}>
                                        <span className='autotrade__stat-bar-pct'>{stats.odd}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='autotrade__digits-section'>
                            <span className='autotrade__digits-label'>Last Digits Pattern</span>
                            <div className='autotrade__digits-row'>
                                {stats.lastDigits.length > 0 ? stats.lastDigits.map((d, i) => (
                                    <span key={i} className={`autotrade__digit ${d % 2 === 0 ? 'autotrade__digit--even' : 'autotrade__digit--odd'}`}>{d}</span>
                                )) : Array.from({ length: 8 }, (_, i) => (
                                    <span key={i} className='autotrade__digit autotrade__digit--empty'>—</span>
                                ))}
                            </div>
                            {stats.currentStreak.count > 0 && (
                                <span className='autotrade__streak'>Current streak: <strong>{stats.currentStreak.count} {stats.currentStreak.type}</strong></span>
                            )}
                        </div>

                        {/* Mini tick chart */}
                        {stats.lastTicks.length > 2 && (
                            <div className='autotrade__tick-chart'>
                                <svg viewBox={`0 0 400 60`} preserveAspectRatio='none' width='100%' height='60'>
                                    <defs>
                                        <linearGradient id='chartGrad' x1='0' y1='0' x2='0' y2='1'>
                                            <stop offset='0%' stopColor='#00f5ff' stopOpacity='0.4' />
                                            <stop offset='100%' stopColor='#00f5ff' stopOpacity='0' />
                                        </linearGradient>
                                    </defs>
                                    {(() => {
                                        const ticks = stats.lastTicks;
                                        const min = Math.min(...ticks);
                                        const max = Math.max(...ticks);
                                        const range = max - min || 1;
                                        const pts = ticks.map((t, i) => {
                                            const x = (i / (ticks.length - 1)) * 400;
                                            const y = 55 - ((t - min) / range) * 50;
                                            return `${x},${y}`;
                                        });
                                        const polyline = pts.join(' ');
                                        const area = `0,60 ${polyline} 400,60`;
                                        return (
                                            <>
                                                <polygon points={area} fill='url(#chartGrad)' />
                                                <polyline points={polyline} fill='none' stroke='#00f5ff' strokeWidth='1.5' />
                                            </>
                                        );
                                    })()}
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* All symbols mini stats */}
                    <div className='autotrade__mini-stats'>
                        {SYMBOLS.map(sym => {
                            const s = marketStats[sym.key];
                            return (
                                <div
                                    key={sym.key}
                                    className={`autotrade__mini-card ${activeSymbol === sym.key ? 'autotrade__mini-card--active' : ''}`}
                                    onClick={() => setActiveSymbol(sym.key)}
                                >
                                    <div className='autotrade__mini-card-title'>{sym.shortName}</div>
                                    <div className='autotrade__mini-row'>
                                        <span className='autotrade__mini-rise'>{s.rise}%</span>
                                        <span className='autotrade__mini-sep'>/</span>
                                        <span className='autotrade__mini-fall'>{s.fall}%</span>
                                    </div>
                                    <div className='autotrade__mini-bar'>
                                        <div className='autotrade__mini-bar-rise' style={{ width: `${s.rise}%` }} />
                                    </div>
                                    <div className='autotrade__mini-eo'>
                                        <span className='autotrade__mini-even'>E: {s.even}%</span>
                                        <span className='autotrade__mini-odd'>O: {s.odd}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Trading Panels */}
                <div className='autotrade__panels'>
                    {panels.map((panel, index) => {
                        const pStats = marketStats[panel.symbol];
                        const riseVal = panel.mode === 'riseFall' ? pStats.rise : pStats.even;
                        const fallVal = panel.mode === 'riseFall' ? pStats.fall : pStats.odd;
                        const riseLabel = panel.mode === 'riseFall' ? 'Rise' : 'Even';
                        const fallLabel = panel.mode === 'riseFall' ? 'Fall' : 'Odd';
                        const recommendation = riseVal >= fallVal ? riseLabel : fallLabel;

                        return (
                            <div key={index} className={`autotrade__panel ${panel.isRunning ? 'autotrade__panel--running' : ''}`}>
                                <div className='autotrade__panel-header'>
                                    <span className='autotrade__panel-title'>{panel.label}</span>
                                    <div className={`autotrade__panel-status ${panel.isRunning ? 'autotrade__panel-status--on' : ''}`} />
                                </div>

                                <div className='autotrade__panel-rec'>
                                    Recommendation: <strong className='autotrade__panel-rec-val'>{recommendation}</strong>
                                    <span className='autotrade__panel-rec-pct'>{Math.max(riseVal, fallVal)}%</span>
                                </div>

                                <div className='autotrade__panel-bars'>
                                    <div className='autotrade__panel-bar-row'>
                                        <span className='autotrade__panel-bar-label'>{riseLabel}</span>
                                        <div className='autotrade__panel-bar'>
                                            <div
                                                className='autotrade__panel-bar-fill autotrade__panel-bar-fill--rise'
                                                style={{ width: `${riseVal}%` }}
                                            >
                                                <span>{riseVal}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='autotrade__panel-bar-row'>
                                        <span className='autotrade__panel-bar-label'>{fallLabel}</span>
                                        <div className='autotrade__panel-bar'>
                                            <div
                                                className='autotrade__panel-bar-fill autotrade__panel-bar-fill--fall'
                                                style={{ width: `${fallVal}%` }}
                                            >
                                                <span>{fallVal}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='autotrade__panel-section'>
                                    <span className='autotrade__panel-section-label'>Trading Condition</span>
                                    <div className='autotrade__panel-condition'>
                                        <span>If</span>
                                        <select className='autotrade__panel-select' defaultValue={panel.mode === 'riseFall' ? 'Rise Prob' : 'Even Prob'}>
                                            <option>{panel.mode === 'riseFall' ? 'Rise Prob' : 'Even Prob'}</option>
                                            <option>{panel.mode === 'riseFall' ? 'Fall Prob' : 'Odd Prob'}</option>
                                        </select>
                                        <span>&gt;</span>
                                        <input
                                            type='number'
                                            className='autotrade__panel-input'
                                            value={panel.condition}
                                            onChange={e => updatePanel(index, 'condition', parseInt(e.target.value))}
                                        />
                                        <span>%</span>
                                    </div>
                                    <div className='autotrade__panel-then'>
                                        <span>Then</span>
                                        <select className='autotrade__panel-select autotrade__panel-select--wide' defaultValue={`Buy ${riseLabel}`}>
                                            <option>Buy {riseLabel}</option>
                                            <option>Buy {fallLabel}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className='autotrade__panel-params'>
                                    <div className='autotrade__panel-param'>
                                        <label>Stake</label>
                                        <input
                                            type='number'
                                            className='autotrade__panel-input'
                                            value={panel.stake}
                                            onChange={e => updatePanel(index, 'stake', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className='autotrade__panel-param'>
                                        <label>Ticks</label>
                                        <input
                                            type='number'
                                            className='autotrade__panel-input'
                                            value={panel.ticks}
                                            onChange={e => updatePanel(index, 'ticks', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className='autotrade__panel-param'>
                                        <label>Martingale</label>
                                        <input
                                            type='number'
                                            className='autotrade__panel-input'
                                            value={panel.martingale}
                                            onChange={e => updatePanel(index, 'martingale', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <button
                                    className={`autotrade__panel-btn ${panel.isRunning ? 'autotrade__panel-btn--stop' : 'autotrade__panel-btn--start'}`}
                                    onClick={() => togglePanel(index)}
                                >
                                    {panel.isRunning ? (
                                        <>
                                            <span className='autotrade__panel-btn-dot' />
                                            Stop Auto Trading
                                        </>
                                    ) : (
                                        <>
                                            <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
                                                <path d='M8 5v14l11-7z' />
                                            </svg>
                                            Start Auto Trading
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Footer disclaimer */}
                <div className='autotrade__disclaimer'>
                    <span>⚠</span>
                    <p>AutoTrade is for educational purposes only. Market data is live. Always test with a demo account. Trading involves risk.</p>
                </div>
            </div>
        </div>
    );
};

export default AutoTrade;
