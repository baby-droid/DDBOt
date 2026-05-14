import React, { useState } from 'react';
import './strategies.scss';

type Strategy = {
    id: number;
    name: string;
    description: string;
    type: string;
    winRate: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    icon: string;
};

const STRATEGIES: Strategy[] = [
    { id: 1, name: 'Classic Martingale', description: 'Double stake after each loss until a win recovers all losses', type: 'Recovery', winRate: 60, riskLevel: 'High', icon: '📊' },
    { id: 2, name: "D'Alembert", description: "Increase stake by 1 unit after loss, decrease by 1 after win", type: 'Progressive', winRate: 55, riskLevel: 'Medium', icon: '⚖️' },
    { id: 3, name: 'Fibonacci', description: 'Follow the Fibonacci sequence for stake sizing', type: 'Progressive', winRate: 58, riskLevel: 'Medium', icon: '🌀' },
    { id: 4, name: 'Anti-Martingale', description: 'Double stake after each win to maximise winning streaks', type: 'Positive', winRate: 52, riskLevel: 'Medium', icon: '🔄' },
    { id: 5, name: 'Fixed Stake', description: 'Trade with the same stake every time for consistent risk', type: 'Conservative', winRate: 50, riskLevel: 'Low', icon: '📌' },
    { id: 6, name: 'Labouchere', description: 'Cancellation system using a custom number sequence', type: 'Advanced', winRate: 57, riskLevel: 'High', icon: '📝' },
    { id: 7, name: 'Oscar\'s Grind', description: 'Conservative positive progression with 1-unit profit target', type: 'Conservative', winRate: 53, riskLevel: 'Low', icon: '🐢' },
    { id: 8, name: 'Paroli System', description: 'Three-win progression then reset to protect profits', type: 'Positive', winRate: 56, riskLevel: 'Low', icon: '🎯' },
];

const TYPES = ['All', 'Recovery', 'Progressive', 'Positive', 'Conservative', 'Advanced'];

const Strategies: React.FC = () => {
    const [activeType, setActiveType] = useState('All');
    const [expanded, setExpanded] = useState<number | null>(null);

    const filtered = activeType === 'All' ? STRATEGIES : STRATEGIES.filter(s => s.type === activeType);

    const riskColor = (r: Strategy['riskLevel']) =>
        r === 'Low' ? '#00d4aa' : r === 'Medium' ? '#f5a623' : '#e74c3c';

    return (
        <div className='strategies'>
            <div className='strategies__header'>
                <h2>Trading Strategies</h2>
                <p>Choose a proven strategy to power your automated trading bot</p>
            </div>

            <div className='strategies__filters'>
                {TYPES.map(t => (
                    <button
                        key={t}
                        className={`strategies__filter ${activeType === t ? 'strategies__filter--active' : ''}`}
                        onClick={() => setActiveType(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className='strategies__list'>
                {filtered.map(s => (
                    <div
                        key={s.id}
                        className={`strategies__card ${expanded === s.id ? 'strategies__card--expanded' : ''}`}
                        onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                    >
                        <div className='strategies__card-main'>
                            <span className='strategies__card-icon'>{s.icon}</span>
                            <div className='strategies__card-info'>
                                <h4>{s.name}</h4>
                                <p>{s.description}</p>
                            </div>
                            <div className='strategies__card-stats'>
                                <span className='strategies__win-rate'>🎯 {s.winRate}%</span>
                                <span className='strategies__risk' style={{ color: riskColor(s.riskLevel) }}>
                                    ⚠ {s.riskLevel} Risk
                                </span>
                                <span className='strategies__type-badge'>{s.type}</span>
                            </div>
                            <button className='strategies__use-btn'>Use Strategy</button>
                        </div>
                        {expanded === s.id && (
                            <div className='strategies__detail'>
                                <h5>How it works</h5>
                                <p>{s.description}</p>
                                <div className='strategies__detail-stats'>
                                    <div><b>Type:</b> {s.type}</div>
                                    <div><b>Win Rate:</b> {s.winRate}%</div>
                                    <div><b>Risk Level:</b> <span style={{ color: riskColor(s.riskLevel) }}>{s.riskLevel}</span></div>
                                </div>
                                <button className='strategies__load-btn'>Load into Bot Builder</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Strategies;
