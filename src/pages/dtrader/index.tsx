import React, { useState } from 'react';
import './dtrader.scss';

type TradeType = 'Accumulators' | 'Vanillas' | 'Turbos' | 'Multipliers' | 'Options';
type FilterType = 'All' | 'Multipliers' | 'Options' | 'Accumulators';

const markets = [
    'Volatility 10 (1s) Index',
    'Volatility 25 (1s) Index',
    'Volatility 50 (1s) Index',
    'Volatility 75 (1s) Index',
    'Volatility 100 (1s) Index',
    'Volatility 10 Index',
    'Volatility 25 Index',
    'Volatility 50 Index',
    'Volatility 75 Index',
    'Volatility 100 Index',
    'Boom 300 Index',
    'Boom 500 Index',
    'Boom 1000 Index',
    'Crash 300 Index',
    'Crash 500 Index',
    'Crash 1000 Index',
    'Jump 10 Index',
    'Jump 25 Index',
    'Jump 50 Index',
    'Jump 75 Index',
    'Jump 100 Index',
];

const tradeGroups: { filter: FilterType; items: { label: string; subtype?: string }[] }[] = [
    {
        filter: 'Accumulators',
        items: [{ label: 'Accumulators', subtype: 'NEW' }],
    },
    {
        filter: 'Options',
        items: [{ label: 'Call/Put', subtype: 'NEW' }],
    },
    {
        filter: 'Options',
        items: [{ label: 'Turbos', subtype: 'NEW' }],
    },
    {
        filter: 'Multipliers',
        items: [{ label: 'Multipliers' }],
    },
];

const DTrader: React.FC = () => {
    const [selectedMarket, setSelectedMarket] = useState('Volatility 100 (1s) Index');
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
    const [selectedTrade, setSelectedTrade] = useState<TradeType>('Accumulators');
    const [stake, setStake] = useState(10);
    const [growthRate, setGrowthRate] = useState(3);
    const [takeProfitEnabled, setTakeProfitEnabled] = useState(false);
    const [isMarketOpen, setIsMarketOpen] = useState(false);

    const filters: FilterType[] = ['All', 'Multipliers', 'Options', 'Accumulators'];

    return (
        <div className='dtrader'>
            <div className='dtrader__market-selector'>
                <div className='dtrader__market-header' onClick={() => setIsMarketOpen(o => !o)}>
                    <div className='dtrader__market-icon'>
                        <span>📊</span>
                    </div>
                    <div>
                        <div className='dtrader__market-name'>{selectedMarket}</div>
                        <div className='dtrader__market-price'>1172.94 <span className='dtrader__market-change dtrader__market-change--neg'>-0.20 (0.02%)</span></div>
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

            <div className='dtrader__main'>
                <div className='dtrader__chart-area'>
                    <div className='dtrader__chart-placeholder'>
                        <div className='dtrader__chart-line' />
                        <p className='dtrader__chart-label'>Live Chart — {selectedMarket}</p>
                    </div>
                    <div className='dtrader__chart-tools'>
                        {['1T', '📊', '🕯', '📈', '✏️', '💾'].map((t, i) => (
                            <button key={i} className='dtrader__chart-tool-btn'>{t}</button>
                        ))}
                    </div>
                </div>

                <div className='dtrader__trade-panel'>
                    <h3 className='dtrader__panel-title'>Trade types</h3>
                    <div className='dtrader__filters'>
                        {filters.map(f => (
                            <button
                                key={f}
                                className={`dtrader__filter-btn ${selectedFilter === f ? 'dtrader__filter-btn--active' : ''}`}
                                onClick={() => setSelectedFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className='dtrader__trade-list'>
                        <div className='dtrader__trade-group-label'>Accumulators <span className='dtrader__badge'>NEW</span></div>
                        <div
                            className={`dtrader__trade-item ${selectedTrade === 'Accumulators' ? 'dtrader__trade-item--active' : ''}`}
                            onClick={() => setSelectedTrade('Accumulators')}
                        >
                            <span className='dtrader__trade-icon'>📈</span> Accumulators
                        </div>

                        <div className='dtrader__trade-group-label'>Vanillas <span className='dtrader__badge'>NEW</span></div>
                        <div
                            className={`dtrader__trade-item ${selectedTrade === 'Vanillas' ? 'dtrader__trade-item--active' : ''}`}
                            onClick={() => setSelectedTrade('Vanillas')}
                        >
                            <span className='dtrader__trade-icon'>↗</span> Call/Put
                        </div>

                        <div className='dtrader__trade-group-label'>Turbos <span className='dtrader__badge'>NEW</span></div>
                        <div
                            className={`dtrader__trade-item ${selectedTrade === 'Turbos' ? 'dtrader__trade-item--active' : ''}`}
                            onClick={() => setSelectedTrade('Turbos')}
                        >
                            <span className='dtrader__trade-icon'>⚡</span> Turbos
                        </div>

                        <div className='dtrader__trade-group-label'>Multipliers</div>
                        <div
                            className={`dtrader__trade-item ${selectedTrade === 'Multipliers' ? 'dtrader__trade-item--active' : ''}`}
                            onClick={() => setSelectedTrade('Multipliers')}
                        >
                            <span className='dtrader__trade-icon'>✖</span> Multipliers
                        </div>
                    </div>
                </div>

                <div className='dtrader__config-panel'>
                    <h3 className='dtrader__config-title'>
                        {selectedTrade}
                        <a href='#' className='dtrader__learn-link'>Learn about this trade type →</a>
                    </h3>

                    {selectedTrade === 'Accumulators' && (
                        <>
                            <div className='dtrader__config-row'>
                                <label>Growth rate</label>
                                <div className='dtrader__rate-btns'>
                                    {[1, 2, 3, 4, 5].map(r => (
                                        <button
                                            key={r}
                                            className={`dtrader__rate-btn ${growthRate === r ? 'dtrader__rate-btn--active' : ''}`}
                                            onClick={() => setGrowthRate(r)}
                                        >
                                            {r}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className='dtrader__config-row'>
                                <label>Stake</label>
                                <div className='dtrader__stake-row'>
                                    <button onClick={() => setStake(s => Math.max(1, s - 1))}>−</button>
                                    <span className='dtrader__stake-value'>{stake} <small>USD</small></span>
                                    <button onClick={() => setStake(s => s + 1)}>+</button>
                                </div>
                            </div>
                            <div className='dtrader__config-row'>
                                <label>
                                    <input
                                        type='checkbox'
                                        checked={takeProfitEnabled}
                                        onChange={e => setTakeProfitEnabled(e.target.checked)}
                                    />{' '}
                                    Take profit
                                </label>
                            </div>
                            <div className='dtrader__meta'>
                                <div><span>Max. payout</span><span>6,000.00 USD</span></div>
                                <div><span>Max. ticks</span><span>85 ticks</span></div>
                            </div>
                        </>
                    )}

                    {selectedTrade === 'Multipliers' && (
                        <div className='dtrader__config-row'>
                            <label>Multiplier</label>
                            <select className='dtrader__select'>
                                {[10, 20, 50, 100, 200, 500].map(m => (
                                    <option key={m}>x{m}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button className='dtrader__buy-btn'>
                        <span>🛒</span> Buy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DTrader;
