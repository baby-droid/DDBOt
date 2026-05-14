import React, { useState } from 'react';
import './risk-calculator.scss';

const RiskCalculator: React.FC = () => {
    const [balance, setBalance] = useState(1000);
    const [riskPercent, setRiskPercent] = useState(2);
    const [winRate, setWinRate] = useState(55);
    const [payoutMultiplier, setPayoutMultiplier] = useState(0.85);
    const [numTrades, setNumTrades] = useState(100);
    const [martingale, setMartingale] = useState(false);
    const [martingaleMultiplier, setMartingaleMultiplier] = useState(2);
    const [maxRecovery, setMaxRecovery] = useState(5);

    const stakePerTrade = (balance * riskPercent) / 100;
    const expectedProfit = stakePerTrade * payoutMultiplier * (winRate / 100);
    const expectedLoss = stakePerTrade * (1 - winRate / 100);
    const ev = (expectedProfit - expectedLoss) * numTrades;
    const riskOfRuin = Math.max(0, ((1 - winRate / 100) / (winRate / 100)) * 100);

    const martingaleMax = martingale
        ? stakePerTrade * Math.pow(martingaleMultiplier, maxRecovery - 1)
        : 0;

    return (
        <div className='risk-calc'>
            <div className='risk-calc__header'>
                <h2>Risk Calculator</h2>
                <p>Optimise your trading strategy with data-driven risk management</p>
            </div>

            <div className='risk-calc__body'>
                <div className='risk-calc__inputs'>
                    <div className='risk-calc__group'>
                        <h3>Account Settings</h3>
                        <label>Account Balance (USD)
                            <input type='number' value={balance} onChange={e => setBalance(+e.target.value)} min={1} />
                        </label>
                        <label>Risk per Trade (%)
                            <input type='range' min={0.5} max={20} step={0.5} value={riskPercent}
                                onChange={e => setRiskPercent(+e.target.value)} />
                            <span className='risk-calc__range-val'>{riskPercent}%</span>
                        </label>
                    </div>

                    <div className='risk-calc__group'>
                        <h3>Strategy Parameters</h3>
                        <label>Win Rate (%)
                            <input type='range' min={10} max={90} step={1} value={winRate}
                                onChange={e => setWinRate(+e.target.value)} />
                            <span className='risk-calc__range-val'>{winRate}%</span>
                        </label>
                        <label>Payout Multiplier
                            <input type='number' step={0.05} min={0.1} max={5} value={payoutMultiplier}
                                onChange={e => setPayoutMultiplier(+e.target.value)} />
                        </label>
                        <label>Number of Trades
                            <input type='number' min={1} max={10000} value={numTrades}
                                onChange={e => setNumTrades(+e.target.value)} />
                        </label>
                    </div>

                    <div className='risk-calc__group'>
                        <h3>Martingale Settings</h3>
                        <label className='risk-calc__checkbox-label'>
                            <input type='checkbox' checked={martingale} onChange={e => setMartingale(e.target.checked)} />
                            Enable Martingale
                        </label>
                        {martingale && (
                            <>
                                <label>Multiplier
                                    <input type='number' min={1.5} max={10} step={0.5} value={martingaleMultiplier}
                                        onChange={e => setMartingaleMultiplier(+e.target.value)} />
                                </label>
                                <label>Max Recovery Steps
                                    <input type='number' min={1} max={20} value={maxRecovery}
                                        onChange={e => setMaxRecovery(+e.target.value)} />
                                </label>
                            </>
                        )}
                    </div>
                </div>

                <div className='risk-calc__results'>
                    <h3>Analysis Results</h3>

                    <div className='risk-calc__result-card risk-calc__result-card--blue'>
                        <div className='risk-calc__result-label'>Stake Per Trade</div>
                        <div className='risk-calc__result-value'>${stakePerTrade.toFixed(2)}</div>
                    </div>

                    <div className={`risk-calc__result-card ${ev >= 0 ? 'risk-calc__result-card--green' : 'risk-calc__result-card--red'}`}>
                        <div className='risk-calc__result-label'>Expected Value ({numTrades} trades)</div>
                        <div className='risk-calc__result-value'>{ev >= 0 ? '+' : ''}{ev.toFixed(2)} USD</div>
                    </div>

                    <div className={`risk-calc__result-card ${winRate >= 50 ? 'risk-calc__result-card--green' : 'risk-calc__result-card--red'}`}>
                        <div className='risk-calc__result-label'>Risk of Ruin</div>
                        <div className='risk-calc__result-value'>{Math.min(riskOfRuin, 100).toFixed(1)}%</div>
                    </div>

                    {martingale && (
                        <div className='risk-calc__result-card risk-calc__result-card--orange'>
                            <div className='risk-calc__result-label'>Max Martingale Stake</div>
                            <div className='risk-calc__result-value'>${martingaleMax.toFixed(2)}</div>
                        </div>
                    )}

                    <div className='risk-calc__advice'>
                        {ev >= 0 && winRate >= 50
                            ? '✅ Strategy has positive expected value. Proceed with caution and proper risk management.'
                            : ev < 0
                            ? '⚠️ Negative expected value detected. Adjust win rate or payout multiplier.'
                            : '⚠️ Win rate below 50%. Consider revising your strategy.'}
                    </div>

                    <div className='risk-calc__breakdown'>
                        <h4>Trade Breakdown</h4>
                        <div className='risk-calc__breakdown-row'>
                            <span>Expected wins</span><span>{Math.round(numTrades * winRate / 100)}</span>
                        </div>
                        <div className='risk-calc__breakdown-row'>
                            <span>Expected losses</span><span>{Math.round(numTrades * (1 - winRate / 100))}</span>
                        </div>
                        <div className='risk-calc__breakdown-row'>
                            <span>Profit per win</span><span>${(stakePerTrade * payoutMultiplier).toFixed(2)}</span>
                        </div>
                        <div className='risk-calc__breakdown-row'>
                            <span>Loss per trade</span><span>−${stakePerTrade.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskCalculator;
