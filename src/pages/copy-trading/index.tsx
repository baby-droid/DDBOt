import React, { useState } from 'react';
import './copy-trading.scss';

const CopyTrading: React.FC = () => {
    const [token, setToken] = useState('');
    const [clients, setClients] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(true);

    const handleAdd = () => {
        if (token.trim()) {
            setClients(prev => [...prev, token.trim()]);
            setToken('');
        }
    };

    const handleSync = () => {
        setClients([]);
    };

    return (
        <div className='copy-trading'>
            <div className='copy-trading__header'>
                <button
                    className={`copy-trading__mode-btn ${isDemoMode ? 'copy-trading__mode-btn--active' : ''}`}
                    onClick={() => setIsDemoMode(true)}
                >
                    Demo Mode
                </button>
                <button
                    className={`copy-trading__mode-btn ${!isDemoMode ? 'copy-trading__mode-btn--active' : ''}`}
                    onClick={() => setIsDemoMode(false)}
                >
                    Start Demo to Real Copy Trading
                </button>
                <button className='copy-trading__tutorial-btn'>Tutorial</button>
            </div>

            <div className='copy-trading__id-bar'>
                <span className='copy-trading__id-label'>CR: CR10468162</span>
                <span className='copy-trading__balance'>0 USD</span>
            </div>

            <div className='copy-trading__section'>
                <h3 className='copy-trading__section-title'>Add tokens to Replicator</h3>
                <div className='copy-trading__token-row'>
                    <input
                        className='copy-trading__token-input'
                        placeholder='Enter Client token'
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                    <button className='copy-trading__add-btn' onClick={handleAdd}>Add</button>
                    <button className='copy-trading__sync-btn' onClick={handleSync}>Sync ↑</button>
                </div>

                <button
                    className={`copy-trading__start-btn ${isRunning ? 'copy-trading__start-btn--running' : ''}`}
                    onClick={() => setIsRunning(r => !r)}
                >
                    {isRunning ? '⏹ Stop Copy Trading' : '▶ Start Copy Trading'}
                </button>

                <div className='copy-trading__stats'>
                    <p>Total Clients added: {clients.length}</p>
                    {clients.map((c, i) => (
                        <div key={i} className='copy-trading__client-chip'>
                            <span>{c}</span>
                            <button onClick={() => setClients(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                        </div>
                    ))}
                </div>
            </div>

            <div className='copy-trading__info'>
                <div className='copy-trading__info-card'>
                    <h4>How Copy Trading Works</h4>
                    <ol>
                        <li>Add client API tokens to replicate their trades</li>
                        <li>Set your stake multiplier and risk limits</li>
                        <li>Click Start — trades execute automatically</li>
                        <li>Monitor performance in real-time</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default CopyTrading;
