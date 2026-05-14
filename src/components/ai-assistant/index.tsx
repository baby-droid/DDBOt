import React, { useState, useRef, useEffect } from 'react';
import { analyzeDigits, getKnowledgeResponse, type DigitFreq, type TradeRecommendation } from './ahmed-brain';
import './ai-assistant.scss';

type Message = {
    role: 'user' | 'ai';
    text: string;
    time: string;
    recommendations?: TradeRecommendation[];
};

const now = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const QUICK_PROMPTS = [
    '🔬 Analyze Market',
    'Over 6 rules?',
    'Over 7 entry?',
    'How many ticks?',
    'Best market?',
    'Psychology tips',
];

const DEFAULT_FREQ: DigitFreq = { 0: 10, 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10, 9: 10 };

const RecommendationCard: React.FC<{ rec: TradeRecommendation }> = ({ rec }) => {
    const [expanded, setExpanded] = useState(false);
    const color = rec.confidence === 'HIGH' ? '#00d4aa' : rec.confidence === 'MEDIUM' ? '#f5a623' : '#e74c3c';

    return (
        <div className='ai-rec-card' style={{ borderColor: color }}>
            <div className='ai-rec-card__header' onClick={() => setExpanded(e => !e)}>
                <div>
                    <span className='ai-rec-card__trade'>{rec.trade}</span>
                    <span className='ai-rec-card__conf' style={{ background: color }}>{rec.confidence}</span>
                </div>
                <div className='ai-rec-card__meta'>
                    <span>⏱ {rec.ticks} tick{rec.ticks > 1 ? 's' : ''}</span>
                    <span>📊 {rec.market.replace('Volatility ', 'Vol ').replace(' Index', '')}</span>
                    <span>{expanded ? '▲' : '▼'}</span>
                </div>
            </div>
            <div className='ai-rec-card__entry'>
                Entry digits: {rec.entryDigits.map(d => (
                    <span key={d} className='ai-rec-card__digit'>{d}</span>
                ))}
            </div>
            {expanded && (
                <div className='ai-rec-card__detail'>
                    <p className='ai-rec-card__reason'>{rec.reason}</p>
                    <div className='ai-rec-card__conditions'>
                        {rec.conditions.map((c, i) => <div key={i} className='ai-rec-card__cond'>{c}</div>)}
                        {rec.warnings.map((w, i) => <div key={i} className='ai-rec-card__warn'>{w}</div>)}
                    </div>
                </div>
            )}
        </div>
    );
};

const MarketAnalyzer: React.FC<{ onResult: (recs: TradeRecommendation[], freq: DigitFreq) => void; onClose: () => void }> = ({ onResult, onClose }) => {
    const [freq, setFreq] = useState<DigitFreq>({ ...DEFAULT_FREQ });
    const total = Object.values(freq).reduce((a, b) => a + b, 0);

    const setDigit = (d: number, val: number) => {
        setFreq(prev => ({ ...prev, [d]: Math.max(0, Math.min(100, val)) }));
    };

    const handleAnalyze = () => {
        const recs = analyzeDigits(freq);
        onResult(recs, freq);
        onClose();
    };

    const GREEN_BAR = Object.entries(freq).reduce((a, b) => +b[1] > +freq[+a[0]] ? b : a)[0];
    const RED_BAR = Object.entries(freq).sort((a, b) => +b[1] - +a[1])[1]?.[0];

    return (
        <div className='ai-analyzer'>
            <div className='ai-analyzer__header'>
                <span>🔬 Market Analyzer</span>
                <button onClick={onClose}>×</button>
            </div>
            <p className='ai-analyzer__hint'>Enter digit % from your Analysis Tool (last 1000 ticks)</p>
            <div className='ai-analyzer__grid'>
                {Array.from({ length: 10 }, (_, d) => {
                    const val = freq[d] ?? 10;
                    const isGreen = String(d) === String(GREEN_BAR);
                    const isRed = String(d) === String(RED_BAR);
                    return (
                        <div key={d} className={`ai-analyzer__digit ${isGreen ? 'ai-analyzer__digit--green' : ''} ${isRed ? 'ai-analyzer__digit--red' : ''}`}>
                            <div className='ai-analyzer__digit-label'>
                                <span>{d}</span>
                                {isGreen && <span className='ai-analyzer__bar-tag'>G</span>}
                                {isRed && <span className='ai-analyzer__bar-tag ai-analyzer__bar-tag--red'>R</span>}
                            </div>
                            <input
                                type='number'
                                className='ai-analyzer__input'
                                value={val}
                                min={0}
                                max={100}
                                step={0.1}
                                onChange={e => setDigit(d, parseFloat(e.target.value) || 0)}
                            />
                            <span className='ai-analyzer__pct'>%</span>
                            <div className='ai-analyzer__bar-wrap'>
                                <div className='ai-analyzer__bar' style={{
                                    height: `${Math.min(val * 3, 60)}px`,
                                    background: isGreen ? '#00d4aa' : isRed ? '#e74c3c' : '#4a6fa5',
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className='ai-analyzer__total' style={{ color: Math.abs(total - 100) > 2 ? '#e74c3c' : '#00d4aa' }}>
                Total: {total.toFixed(1)}% {Math.abs(total - 100) > 2 ? '⚠️ should be ~100%' : '✅'}
            </div>
            <button className='ai-analyzer__btn' onClick={handleAnalyze}>
                Analyze & Get Trade Signal →
            </button>
        </div>
    );
};

const AiAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showAnalyzer, setShowAnalyzer] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'ai',
            text: `👋 Welcome to **AHMED AI** — trained on Ahmed The Trader's digit psychology methodology!\n\nI can analyse digit distributions, recommend Over/Under trades, entry digits, and tick counts.\n\nClick **🔬 Analyze Market** to input live digit % and get an instant trade signal!`,
            time: now(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, showAnalyzer]);

    const addAiMessage = (text: string, recommendations?: TradeRecommendation[]) => {
        const aiMsg: Message = { role: 'ai', text, time: now(), recommendations };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
    };

    const sendMessage = (override?: string) => {
        const text = (override ?? input).trim();
        if (!text) return;

        if (text === '🔬 Analyze Market') {
            setShowAnalyzer(true);
            setInput('');
            return;
        }

        const userMsg: Message = { role: 'user', text, time: now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            addAiMessage(getKnowledgeResponse(text));
        }, 600 + Math.random() * 500);
    };

    const handleAnalyzerResult = (recs: TradeRecommendation[], freq: DigitFreq) => {
        const userMsg: Message = {
            role: 'user',
            text: `Digit frequencies: ${Object.entries(freq).map(([d, v]) => `${d}:${v}%`).join(', ')}`,
            time: now(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        setTimeout(() => {
            if (recs.length === 0) {
                addAiMessage(`⚠️ No valid trade signal found for the current digit distribution.\n\n**Possible reasons:**\n• Green/red bars are at the wrong digits for any valid strategy\n• Not enough cold digits (below 10%) for the target trade\n• Market conditions are mixed\n\n**Ahmed's advice:** Do not trade if no clear signal. Observe 50 more ticks and re-analyse. Patience is your edge.`);
            } else {
                const top = recs[0];
                addAiMessage(
                    `✅ **${recs.length} valid trade signal${recs.length > 1 ? 's' : ''} found!**\n\nTop pick: **${top.trade}** — Entry digit(s): ${top.entryDigits.join(' or ')} — **${top.ticks} tick${top.ticks > 1 ? 's' : ''}**\n\n${top.reason}\n\n${recs.length > 1 ? `📋 ${recs.length - 1} additional signal${recs.length > 2 ? 's' : ''} also available — expand cards below.` : ''}`,
                    recs
                );
            }
        }, 800);
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const formatText = (text: string) => {
        return text.split('\n').map((line, i) => {
            const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return <p key={i} dangerouslySetInnerHTML={{ __html: bold || '&nbsp;' }} />;
        });
    };

    return (
        <div className='ai-assistant'>
            <button
                className={`ai-assistant__bubble ${isOpen ? 'ai-assistant__bubble--open' : ''}`}
                onClick={() => setIsOpen(o => !o)}
                title='Ahmed AI Trading Assistant'
            >
                <span className='ai-assistant__bubble-icon'>🤖</span>
                <span className='ai-assistant__bubble-label'>AI</span>
                <span className='ai-assistant__bubble-dot' />
            </button>

            {isOpen && (
                <div className='ai-assistant__panel'>
                    <div className='ai-assistant__panel-header'>
                        <div className='ai-assistant__panel-avatar'>🤖</div>
                        <div>
                            <div className='ai-assistant__panel-name'>AHMED AI</div>
                            <div className='ai-assistant__panel-status'>● Digit Psychology Engine Active</div>
                        </div>
                        <button className='ai-assistant__panel-close' onClick={() => setIsOpen(false)}>×</button>
                    </div>

                    {showAnalyzer ? (
                        <MarketAnalyzer
                            onResult={handleAnalyzerResult}
                            onClose={() => setShowAnalyzer(false)}
                        />
                    ) : (
                        <>
                            <div className='ai-assistant__messages'>
                                {messages.map((m, i) => (
                                    <div key={i} className={`ai-assistant__msg ai-assistant__msg--${m.role}`}>
                                        <div className='ai-assistant__msg-bubble'>
                                            {formatText(m.text)}
                                        </div>
                                        {m.recommendations && m.recommendations.length > 0 && (
                                            <div className='ai-assistant__recs'>
                                                {m.recommendations.map((rec, ri) => (
                                                    <RecommendationCard key={ri} rec={rec} />
                                                ))}
                                            </div>
                                        )}
                                        <div className='ai-assistant__msg-time'>{m.time}</div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className='ai-assistant__msg ai-assistant__msg--ai'>
                                        <div className='ai-assistant__typing'>
                                            <span /><span /><span />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className='ai-assistant__quick-prompts'>
                                {QUICK_PROMPTS.map(p => (
                                    <button
                                        key={p}
                                        className={`ai-assistant__quick-btn ${p.includes('Analyze') ? 'ai-assistant__quick-btn--highlight' : ''}`}
                                        onClick={() => sendMessage(p)}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            <div className='ai-assistant__input-row'>
                                <textarea
                                    className='ai-assistant__input'
                                    placeholder='Ask: "Over 7 rules?" or "How many ticks?"'
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKey}
                                    rows={1}
                                />
                                <button
                                    className='ai-assistant__send-btn'
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim()}
                                >
                                    ➤
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default AiAssistant;
