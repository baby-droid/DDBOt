import React, { useState } from 'react';
import './dtrader.scss';

type FilterType = 'All' | 'Multipliers' | 'Options' | 'Accumulators';
type TradeCategory = 'Multipliers' | 'Rise/Fall' | 'Higher/Lower' | 'Touch/No Touch' | 'Matches/Differs' | 'Even/Odd' | 'Over/Under';

const markets = [
    'Volatility 100 (1s) Index',
    'Volatility 75 (1s) Index',
    'Volatility 50 (1s) Index',
    'Volatility 25 (1s) Index',
    'Volatility 10 (1s) Index',
    'Volatility 100 Index',
    'Volatility 75 Index',
    'Volatility 50 Index',
    'Volatility 25 Index',
    'Volatility 10 Index',
    'Boom 1000 Index',
    'Boom 500 Index',
    'Boom 300 Index',
    'Crash 1000 Index',
    'Crash 500 Index',
    'Crash 300 Index',
    'Jump 100 Index',
    'Jump 75 Index',
    'Jump 50 Index',
    'Jump 25 Index',
    'Jump 10 Index',
];

const marketPrices: Record<string, { price: string; change: string; positive: boolean }> = {
    'Volatility 100 (1s) Index': { price: '1162.69', change: '-0.00 (0.00%)', positive: false },
    'Volatility 75 (1s) Index': { price: '487.32', change: '+0.12 (0.02%)', positive: true },
    'Volatility 50 (1s) Index': { price: '312.54', change: '-0.08 (0.03%)', positive: false },
    'Volatility 25 (1s) Index': { price: '156.21', change: '+0.05 (0.03%)', positive: true },
    'Volatility 10 (1s) Index': { price: '78.44', change: '-0.02 (0.03%)', positive: false },
};

const getMarketData = (name: string) =>
    marketPrices[name] ?? { price: '---', change: '0.00 (0.00%)', positive: true };

const TICKS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const OVER_PAYOUT: Record<number, { over: string; under: string; overPct: string; underPct: string }> = {
    0: { over: '1.09 USD', under: '22.60 USD', overPct: '10.90%', underPct: '226.0%' },
    1: { over: '2.23 USD', under: '20.40 USD', overPct: '22.30%', underPct: '204.0%' },
    2: { over: '3.47 USD', under: '18.90 USD', overPct: '34.70%', underPct: '189.0%' },
    3: { over: '5.10 USD', under: '16.80 USD', overPct: '51.00%', underPct: '168.0%' },
    4: { over: '7.22 USD', under: '14.55 USD', overPct: '72.20%', underPct: '145.5%' },
    5: { over: '10.22 USD', under: '10.33 USD', overPct: '102.20%', underPct: '103.3%' },
    6: { over: '14.55 USD', under: '7.22 USD', overPct: '145.5%', underPct: '72.20%' },
    7: { over: '18.90 USD', under: '5.10 USD', overPct: '189.0%', underPct: '51.00%' },
    8: { over: '20.40 USD', under: '3.47 USD', overPct: '204.0%', underPct: '34.70%' },
    9: { over: '22.60 USD', under: '1.09 USD', overPct: '226.0%', underPct: '10.90%' },
};

const DTrader: React.FC = () => {
    const [selectedMarket, setSelectedMarket] = useState('Volatility 100 (1s) Index');
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
    const [selectedTrade, setSelectedTrade] = useState<TradeCategory>('Over/Under');
    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const [searchTrade, setSearchTrade] = useState('');
    const [ticks, setTicks] = useState(5);
    const [selectedDigit, setSelectedDigit] = useState(5);
    const [stake, setStake] = useState(10);
    const [stakeInput, setStakeInput] = useState('10');
    const [multiplier, setMultiplier] = useState(100);
    const [growthRate, setGrowthRate] = useState(3);
    const [barrier, setBarrier] = useState('+0.01');

    const filters: FilterType[] = ['All', 'Multipliers', 'Options', 'Accumulators'];
    const mktData = getMarketData(selectedMarket);
    const payoutData = OVER_PAYOUT[selectedDigit] ?? OVER_PAYOUT[5];

    const tradeGroups = [
        {
            filter: ['All', 'Multipliers'] as FilterType[],
            label: null,
            items: [{ label: 'Multipliers', icon: '✖', badge: null }],
        },
        {
            filter: ['All', 'Options'] as FilterType[],
            label: 'Ups & Downs',
            items: [
                { label: 'Rise/Fall', icon: '↗', badge: null },
                { label: 'Higher/Lower', icon: '↕', badge: null },
            ],
        },
        {
            filter: ['All', 'Options'] as FilterType[],
            label: 'Touch & No Touch',
            items: [{ label: 'Touch/No Touch', icon: '◎', badge: null }],
        },
        {
            filter: ['All', 'Options'] as FilterType[],
            label: 'Digits',
            items: [
                { label: 'Matches/Differs', icon: '⁕', badge: null },
                { label: 'Even/Odd', icon: '⊞', badge: null },
                { label: 'Over/Under', icon: '⇅', badge: null },
            ],
        },
    ];

    const visibleGroups = tradeGroups.filter(
        g =>
            g.filter.includes(selectedFilter) &&
            (searchTrade === '' || g.items.some(i => i.label.toLowerCase().includes(searchTrade.toLowerCase())))
    );

    const handleStakeChange = (val: string) => {
        setStakeInput(val);
        const n = parseFloat(val);
        if (!isNaN(n) && n > 0) setStake(n);
    };

    return (
        <div className='dtrader'>
            <div className='dtrader__market-bar'>
                <div className='dtrader__market-header' onClick={() => setIsMarketOpen(o => !o)}>
                    <div className='dtrader__market-spark'>
                        <svg width='36' height='24' viewBox='0 0 36 24'>
                            <polyline
                                points='0,18 4,14 8,16 12,8 16,12 20,5 24,10 28,4 32,8 36,6'
                                fill='none' stroke={mktData.positive ? '#27ae60' : '#e74c3c'} strokeWidth='1.5'
                            />
                        </svg>
                    </div>
                    <div className='dtrader__market-info'>
                        <span className='dtrader__market-name'>{selectedMarket}</span>
                        <span className='dtrader__market-price'>
                            {mktData.price}
                            <span className={`dtrader__market-delta ${mktData.positive ? 'pos' : 'neg'}`}>
                                {' '}{mktData.change}
                            </span>
                        </span>
                    </div>
                    <span className='dtrader__chevron'>{isMarketOpen ? '▲' : '▼'}</span>
                </div>
                {isMarketOpen && (
                    <div className='dtrader__market-dropdown'>
                        {markets.map(m => (
                            <div
                                key={m}
                                className={`dtrader__market-item ${m === selectedMarket ? 'dtrader__market-item--active' : ''}`}
                                onClick={() => { setSelectedMarket(m); setIsMarketOpen(false); }}
                            >
                                {m}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className='dtrader__body'>
                <div className='dtrader__chart-wrap'>
                    <div className='dtrader__chart-tools'>
                        {['1T', '📊', '🕯', '📈', '✏️', '💾'].map((t, i) => (
                            <button key={i} className='dtrader__tool-btn' title={t}>{t}</button>
                        ))}
                    </div>
                    <iframe
                        className='dtrader__chart-frame'
                        src={`https://charts.deriv.com/deriv`}
                        title='DTrader Chart'
                        allow='fullscreen'
                    />
                    <div className='dtrader__chart-footer'>
                        <span className='dtrader__risk-badge'>Risk Disclaimer</span>
                        <span className='dtrader__chart-time'>
                            {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })}{' '}
                            {new Date().toLocaleTimeString('en-GB')} GMT
                        </span>
                    </div>
                </div>

                <div className='dtrader__types-panel'>
                    <div className='dtrader__types-header'>
                        <span className='dtrader__types-title'>Trade types</span>
                    </div>
                    <div className='dtrader__search-row'>
                        <span className='dtrader__search-icon'>🔍</span>
                        <input
                            className='dtrader__search'
                            placeholder='Search'
                            value={searchTrade}
                            onChange={e => setSearchTrade(e.target.value)}
                        />
                    </div>
                    <div className='dtrader__filters'>
                        {filters.map(f => (
                            <button
                                key={f}
                                className={`dtrader__filter-btn ${selectedFilter === f ? 'dtrader__filter-btn--active' : ''}`}
                                onClick={() => setSelectedFilter(f)}
                            >
                                {f}
                                {(f === 'Options' || f === 'Accumulators') && (
                                    <span className='dtrader__new-badge'>NEW</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className='dtrader__learn-row'>
                        <a className='dtrader__learn-link' href='https://deriv.com/trade-types' target='_blank' rel='noreferrer'>
                            Learn more about trade types <span>›</span>
                        </a>
                    </div>
                    <div className='dtrader__trade-list'>
                        {visibleGroups.map((g, gi) => (
                            <React.Fragment key={gi}>
                                {g.label && (
                                    <div className='dtrader__trade-group'>{g.label}</div>
                                )}
                                {g.items
                                    .filter(i => searchTrade === '' || i.label.toLowerCase().includes(searchTrade.toLowerCase()))
                                    .map(item => (
                                        <div
                                            key={item.label}
                                            className={`dtrader__trade-item ${selectedTrade === item.label ? 'dtrader__trade-item--active' : ''}`}
                                            onClick={() => setSelectedTrade(item.label as TradeCategory)}
                                        >
                                            <span className='dtrader__trade-icon'>{item.icon}</span>
                                            <span>{item.label}</span>
                                        </div>
                                    ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className='dtrader__config-panel'>
                    <div className='dtrader__config-header'>
                        <a href='https://deriv.com/trade-types' target='_blank' rel='noreferrer' className='dtrader__config-learn'>
                            Learn about this trade type
                        </a>
                        <div className='dtrader__config-trade-label'>
                            <span className='dtrader__config-icon'>⇅</span>
                            <span className='dtrader__config-name'>{selectedTrade}</span>
                        </div>
                    </div>

                    <div className='dtrader__config-body'>
                        {selectedTrade === 'Over/Under' && (
                            <>
                                <div className='dtrader__field'>
                                    <label>Ticks</label>
                                    <div className='dtrader__ticks-slider'>
                                        <input
                                            type='range'
                                            min={1} max={10} step={1}
                                            value={ticks}
                                            onChange={e => setTicks(+e.target.value)}
                                        />
                                        <div className='dtrader__ticks-dots'>
                                            {TICKS_OPTIONS.map(t => (
                                                <span
                                                    key={t}
                                                    className={`dtrader__ticks-dot ${t <= ticks ? 'dtrader__ticks-dot--fill' : ''}`}
                                                />
                                            ))}
                                        </div>
                                        <span className='dtrader__ticks-val'>{ticks} Ticks</span>
                                    </div>
                                </div>

                                <div className='dtrader__field'>
                                    <label>Last Digit Prediction</label>
                                    <div className='dtrader__digit-grid'>
                                        {Array.from({ length: 10 }, (_, d) => (
                                            <button
                                                key={d}
                                                className={`dtrader__digit-btn ${selectedDigit === d ? 'dtrader__digit-btn--active' : ''}`}
                                                onClick={() => setSelectedDigit(d)}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className='dtrader__field dtrader__stake-field'>
                                    <label>Stake</label>
                                    <label className='dtrader__payout-label'>Payout</label>
                                </div>
                                <div className='dtrader__stake-row'>
                                    <button className='dtrader__stake-btn' onClick={() => { const v = Math.max(1, stake - 1); setStake(v); setStakeInput(String(v)); }}>−</button>
                                    <input
                                        className='dtrader__stake-input'
                                        value={stakeInput}
                                        onChange={e => handleStakeChange(e.target.value)}
                                        onBlur={() => setStakeInput(String(stake))}
                                    />
                                    <span className='dtrader__stake-currency'>USD</span>
                                    <button className='dtrader__stake-btn' onClick={() => { const v = stake + 1; setStake(v); setStakeInput(String(v)); }}>+</button>
                                </div>

                                <div className='dtrader__payout-over'>
                                    <div className='dtrader__payout-info'>
                                        Payout <strong>{(stake * (parseFloat(payoutData.overPct) / 100)).toFixed(2)} USD</strong>
                                        <span className='dtrader__info-icon'>ⓘ</span>
                                    </div>
                                    <button className='dtrader__over-btn'>
                                        <span>↗ Over</span>
                                        <span className='dtrader__pct'>{payoutData.overPct}</span>
                                    </button>
                                </div>

                                <div className='dtrader__payout-under'>
                                    <div className='dtrader__payout-info'>
                                        Payout <strong>{(stake * (parseFloat(payoutData.underPct) / 100)).toFixed(2)} USD</strong>
                                        <span className='dtrader__info-icon'>ⓘ</span>
                                    </div>
                                    <button className='dtrader__under-btn'>
                                        <span>↙ Under</span>
                                        <span className='dtrader__pct'>{payoutData.underPct}</span>
                                    </button>
                                </div>
                            </>
                        )}

                        {selectedTrade === 'Multipliers' && (
                            <>
                                <div className='dtrader__field'>
                                    <label>Multiplier</label>
                                    <div className='dtrader__multiplier-btns'>
                                        {[10, 20, 50, 100, 200, 500].map(m => (
                                            <button
                                                key={m}
                                                className={`dtrader__mult-btn ${multiplier === m ? 'dtrader__mult-btn--active' : ''}`}
                                                onClick={() => setMultiplier(m)}
                                            >x{m}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className='dtrader__field dtrader__stake-field'>
                                    <label>Stake</label>
                                </div>
                                <div className='dtrader__stake-row'>
                                    <button className='dtrader__stake-btn' onClick={() => { const v = Math.max(1, stake - 1); setStake(v); setStakeInput(String(v)); }}>−</button>
                                    <input className='dtrader__stake-input' value={stakeInput} onChange={e => handleStakeChange(e.target.value)} />
                                    <span className='dtrader__stake-currency'>USD</span>
                                    <button className='dtrader__stake-btn' onClick={() => { const v = stake + 1; setStake(v); setStakeInput(String(v)); }}>+</button>
                                </div>
                                <button className='dtrader__over-btn' style={{ marginTop: '1rem' }}>↑ Buy Up</button>
                                <button className='dtrader__under-btn' style={{ marginTop: '0.5rem' }}>↓ Buy Down</button>
                            </>
                        )}

                        {(selectedTrade === 'Rise/Fall' || selectedTrade === 'Higher/Lower') && (
                            <>
                                <div className='dtrader__field'>
                                    <label>Duration — {ticks} ticks</label>
                                    <input type='range' min={1} max={10} step={1} value={ticks} onChange={e => setTicks(+e.target.value)} className='dtrader__range' />
                                </div>
                                <div className='dtrader__field dtrader__stake-field'>
                                    <label>Stake</label>
                                </div>
                                <div className='dtrader__stake-row'>
                                    <button className='dtrader__stake-btn' onClick={() => { const v = Math.max(1, stake - 1); setStake(v); setStakeInput(String(v)); }}>−</button>
                                    <input className='dtrader__stake-input' value={stakeInput} onChange={e => handleStakeChange(e.target.value)} />
                                    <span className='dtrader__stake-currency'>USD</span>
                                    <button className='dtrader__stake-btn' onClick={() => { const v = stake + 1; setStake(v); setStakeInput(String(v)); }}>+</button>
                                </div>
                                <button className='dtrader__over-btn' style={{ marginTop: '1rem' }}>↑ Rise</button>
                                <button className='dtrader__under-btn' style={{ marginTop: '0.5rem' }}>↓ Fall</button>
                            </>
                        )}

                        {selectedTrade === 'Accumulators' && (
                            <>
                                <div className='dtrader__field'>
                                    <label>Growth rate</label>
                                    <div className='dtrader__rate-btns'>
                                        {[1, 2, 3, 4, 5].map(r => (
                                            <button key={r} className={`dtrader__rate-btn ${growthRate === r ? 'dtrader__rate-btn--active' : ''}`} onClick={() => setGrowthRate(r)}>{r}%</button>
                                        ))}
                                    </div>
                                </div>
                                <div className='dtrader__field dtrader__stake-field'><label>Stake</label></div>
                                <div className='dtrader__stake-row'>
                                    <button className='dtrader__stake-btn' onClick={() => { const v = Math.max(1, stake - 1); setStake(v); setStakeInput(String(v)); }}>−</button>
                                    <input className='dtrader__stake-input' value={stakeInput} onChange={e => handleStakeChange(e.target.value)} />
                                    <span className='dtrader__stake-currency'>USD</span>
                                    <button className='dtrader__stake-btn' onClick={() => { const v = stake + 1; setStake(v); setStakeInput(String(v)); }}>+</button>
                                </div>
                                <div className='dtrader__meta'>
                                    <div><span>Max. payout</span><span>6,000.00 USD</span></div>
                                    <div><span>Max. ticks</span><span>85 ticks</span></div>
                                </div>
                                <button className='dtrader__over-btn' style={{ marginTop: 'auto' }}>Buy</button>
                            </>
                        )}

                        {(selectedTrade === 'Matches/Differs' || selectedTrade === 'Even/Odd') && (
                            <>
                                <div className='dtrader__field'>
                                    <label>Ticks</label>
                                    <div className='dtrader__ticks-slider'>
                                        <input type='range' min={1} max={10} step={1} value={ticks} onChange={e => setTicks(+e.target.value)} />
                                        <span className='dtrader__ticks-val'>{ticks} Ticks</span>
                                    </div>
                                </div>
                                {selectedTrade === 'Matches/Differs' && (
                                    <div className='dtrader__field'>
                                        <label>Last Digit Prediction</label>
                                        <div className='dtrader__digit-grid'>
                                            {Array.from({ length: 10 }, (_, d) => (
                                                <button key={d} className={`dtrader__digit-btn ${selectedDigit === d ? 'dtrader__digit-btn--active' : ''}`} onClick={() => setSelectedDigit(d)}>{d}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className='dtrader__field dtrader__stake-field'><label>Stake</label></div>
                                <div className='dtrader__stake-row'>
                                    <button className='dtrader__stake-btn' onClick={() => { const v = Math.max(1, stake - 1); setStake(v); setStakeInput(String(v)); }}>−</button>
                                    <input className='dtrader__stake-input' value={stakeInput} onChange={e => handleStakeChange(e.target.value)} />
                                    <span className='dtrader__stake-currency'>USD</span>
                                    <button className='dtrader__stake-btn' onClick={() => { const v = stake + 1; setStake(v); setStakeInput(String(v)); }}>+</button>
                                </div>
                                <button className='dtrader__over-btn' style={{ marginTop: '1rem' }}>
                                    {selectedTrade === 'Even/Odd' ? '= Even' : `= Matches ${selectedDigit}`}
                                </button>
                                <button className='dtrader__under-btn' style={{ marginTop: '0.5rem' }}>
                                    {selectedTrade === 'Even/Odd' ? '≠ Odd' : `≠ Differs`}
                                </button>
                            </>
                        )}

                        {selectedTrade === 'Touch/No Touch' && (
                            <>
                                <div className='dtrader__field'>
                                    <label>Duration — {ticks} ticks</label>
                                    <input type='range' min={1} max={10} step={1} value={ticks} onChange={e => setTicks(+e.target.value)} className='dtrader__range' />
                                </div>
                                <div className='dtrader__field'>
                                    <label>Barrier</label>
                                    <div className='dtrader__stake-row'>
                                        <input className='dtrader__stake-input' style={{ flex: 1 }} value={barrier} onChange={e => setBarrier(e.target.value)} />
                                    </div>
                                </div>
                                <div className='dtrader__field dtrader__stake-field'><label>Stake</label></div>
                                <div className='dtrader__stake-row'>
                                    <button className='dtrader__stake-btn' onClick={() => { const v = Math.max(1, stake - 1); setStake(v); setStakeInput(String(v)); }}>−</button>
                                    <input className='dtrader__stake-input' value={stakeInput} onChange={e => handleStakeChange(e.target.value)} />
                                    <span className='dtrader__stake-currency'>USD</span>
                                    <button className='dtrader__stake-btn' onClick={() => { const v = stake + 1; setStake(v); setStakeInput(String(v)); }}>+</button>
                                </div>
                                <button className='dtrader__over-btn' style={{ marginTop: '1rem' }}>◎ Touch</button>
                                <button className='dtrader__under-btn' style={{ marginTop: '0.5rem' }}>⊘ No Touch</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DTrader;
