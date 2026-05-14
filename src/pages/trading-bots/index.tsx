import React, { useState } from 'react';
import './trading-bots.scss';

type BotCard = {
    id: number;
    name: string;
    description: string;
    icon: string;
    category: string;
    winRate: number;
    speed: string;
    status: 'ready' | 'running' | 'stopped';
};

const AI_BOTS: BotCard[] = [
    { id: 1, name: 'Digit AI Pro', description: 'AI-powered digit prediction using neural pattern analysis', icon: '🤖', category: 'AI Trading', winRate: 68, speed: '0.3s', status: 'ready' },
    { id: 2, name: 'Even/Odd Quantum', description: 'Quantum-speed even/odd classifier with adaptive martingale', icon: '⚡', category: 'Speed Trading', winRate: 62, speed: '0.1s', status: 'ready' },
    { id: 3, name: 'Pattern Hawk', description: 'Advanced tick pattern recognition with deep-learning signals', icon: '🦅', category: 'Pattern Analysis', winRate: 71, speed: '0.5s', status: 'ready' },
    { id: 4, name: 'Over/Under Sniper', description: 'High-precision over/under trader with recovery engine', icon: '🎯', category: 'AI Trading', winRate: 65, speed: '0.2s', status: 'ready' },
    { id: 5, name: 'Volatility Surfer', description: 'Rides volatility spikes across 1s indices with smart sizing', icon: '🌊', category: 'Volatility', winRate: 59, speed: '0.2s', status: 'ready' },
    { id: 6, name: 'Accumulator AI', description: 'AI-driven accumulator strategy with dynamic growth rates', icon: '📈', category: 'AI Trading', winRate: 74, speed: '0.8s', status: 'ready' },
    { id: 7, name: 'Crash Defender', description: 'Specialized Crash/Boom index trader with spike detection', icon: '💥', category: 'Crash/Boom', winRate: 63, speed: '0.1s', status: 'ready' },
    { id: 8, name: 'Multiplier Turbo', description: 'Auto-scaling multiplier bot with risk-adjusted positioning', icon: '✖️', category: 'Multipliers', winRate: 60, speed: '0.3s', status: 'ready' },
    { id: 9, name: 'Neural Tick Trader', description: 'Deep neural network trained on 10M+ tick data points', icon: '🧠', category: 'AI Trading', winRate: 77, speed: '0.4s', status: 'ready' },
    { id: 10, name: 'Jump Index Rider', description: 'Optimised for Jump indices with entry/exit precision', icon: '🚀', category: 'Speed Trading', winRate: 67, speed: '0.1s', status: 'ready' },
    { id: 11, name: 'Smart Recovery Bot', description: 'Self-healing loss recovery with layered Martingale logic', icon: '♻️', category: 'Recovery', winRate: 58, speed: '0.2s', status: 'ready' },
    { id: 12, name: 'Sentinel AI Guard', description: 'Trade guardian that auto-pauses on unusual market conditions', icon: '🛡️', category: 'AI Trading', winRate: 69, speed: '0.5s', status: 'ready' },
];

const CATEGORIES = ['All', 'AI Trading', 'Speed Trading', 'Pattern Analysis', 'Volatility', 'Crash/Boom', 'Multipliers', 'Recovery'];

const TradingBots: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [runningBots, setRunningBots] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = AI_BOTS.filter(bot => {
        const matchesCategory = activeCategory === 'All' || bot.category === activeCategory;
        const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bot.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const toggleBot = (id: number) => {
        setRunningBots(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    return (
        <div className='trading-bots'>
            <div className='trading-bots__header'>
                <div>
                    <h2 className='trading-bots__title'>🤖 AI Trading Bots</h2>
                    <p className='trading-bots__subtitle'>Ultra-fast automated bots powered by machine learning</p>
                </div>
                <div className='trading-bots__search'>
                    <input
                        placeholder='Search bots...'
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className='trading-bots__search-input'
                    />
                </div>
            </div>

            <div className='trading-bots__categories'>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        className={`trading-bots__cat-btn ${activeCategory === cat ? 'trading-bots__cat-btn--active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className='trading-bots__stats-bar'>
                <div className='trading-bots__stat'>
                    <span className='trading-bots__stat-val'>{runningBots.size}</span>
                    <span className='trading-bots__stat-label'>Running</span>
                </div>
                <div className='trading-bots__stat'>
                    <span className='trading-bots__stat-val'>{AI_BOTS.length - runningBots.size}</span>
                    <span className='trading-bots__stat-label'>Standby</span>
                </div>
                <div className='trading-bots__stat'>
                    <span className='trading-bots__stat-val'>~0.3s</span>
                    <span className='trading-bots__stat-label'>Avg Speed</span>
                </div>
            </div>

            <div className='trading-bots__grid'>
                {filtered.map(bot => {
                    const isRunning = runningBots.has(bot.id);
                    return (
                        <div key={bot.id} className={`trading-bots__card ${isRunning ? 'trading-bots__card--running' : ''}`}>
                            <div className='trading-bots__card-header'>
                                <span className='trading-bots__card-icon'>{bot.icon}</span>
                                <span className={`trading-bots__card-status ${isRunning ? 'trading-bots__card-status--on' : ''}`}>
                                    {isRunning ? '● LIVE' : '○ Ready'}
                                </span>
                            </div>
                            <h4 className='trading-bots__card-name'>{bot.name}</h4>
                            <p className='trading-bots__card-desc'>{bot.description}</p>
                            <div className='trading-bots__card-meta'>
                                <span className='trading-bots__card-badge'>{bot.category}</span>
                                <span className='trading-bots__card-speed'>⚡ {bot.speed}</span>
                                <span className='trading-bots__card-winrate'>🎯 {bot.winRate}%</span>
                            </div>
                            <button
                                className={`trading-bots__card-btn ${isRunning ? 'trading-bots__card-btn--stop' : ''}`}
                                onClick={() => toggleBot(bot.id)}
                            >
                                {isRunning ? '⏹ Stop Bot' : '▶ Launch Bot'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className='trading-bots__empty'>
                    <p>No bots found for "{searchTerm}" in {activeCategory}</p>
                </div>
            )}
        </div>
    );
};

export default TradingBots;
