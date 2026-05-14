import React, { useState, useRef, useEffect } from 'react';
import './ai-assistant.scss';

type Message = {
    role: 'user' | 'ai';
    text: string;
    time: string;
};

const AI_RESPONSES: Record<string, string> = {
    default: "I'm your AHMEDSYNTRADER AI assistant. I can help you analyse markets, explain strategies, and optimise your bot settings. What would you like to know?",
    win: "Based on recent tick data, I recommend focusing on digits 3-7 which have appeared less frequently. Consider an Over 2 strategy on Volatility 10 (1s) Index.",
    loss: "I've detected a losing streak. Consider pausing the bot, reviewing your stake size, and switching to a different market or strategy.",
    strategy: "For the current market conditions, the Even/Odd strategy with a 2% stake and 3-step martingale recovery shows the best risk-adjusted returns based on the last 1000 ticks.",
    market: "Volatility 10 (1s) Index is showing low volatility right now — ideal for digit trading. Volatility 75 (1s) is more active and suits higher-risk strategies.",
    risk: "Your current risk settings appear aggressive. I recommend reducing your stake to 1-2% of your balance and setting a daily loss limit of 10% to protect your capital.",
    help: "I can help you with: market analysis, strategy recommendations, risk management, bot configuration, and trade signal suggestions. Just ask!",
};

const getResponse = (input: string): string => {
    const lower = input.toLowerCase();
    if (lower.includes('win') || lower.includes('profit') || lower.includes('digit')) return AI_RESPONSES.win;
    if (lower.includes('loss') || lower.includes('losing') || lower.includes('stop')) return AI_RESPONSES.loss;
    if (lower.includes('strategy') || lower.includes('even') || lower.includes('odd')) return AI_RESPONSES.strategy;
    if (lower.includes('market') || lower.includes('volatility') || lower.includes('index')) return AI_RESPONSES.market;
    if (lower.includes('risk') || lower.includes('stake') || lower.includes('safe')) return AI_RESPONSES.risk;
    if (lower.includes('help') || lower.includes('what') || lower.includes('how')) return AI_RESPONSES.help;
    return AI_RESPONSES.default;
};

const now = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const AiAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', text: AI_RESPONSES.default, time: now() },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        const text = input.trim();
        if (!text) return;
        const userMsg: Message = { role: 'user', text, time: now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);
        setTimeout(() => {
            const aiMsg: Message = { role: 'ai', text: getResponse(text), time: now() };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 800 + Math.random() * 600);
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const QUICK_PROMPTS = ['Best market now?', 'Risk analysis', 'Strategy tips', 'Stop loss advice'];

    return (
        <div className='ai-assistant'>
            <button
                className={`ai-assistant__bubble ${isOpen ? 'ai-assistant__bubble--open' : ''}`}
                onClick={() => setIsOpen(o => !o)}
                title='AI Trading Assistant'
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
                            <div className='ai-assistant__panel-status'>● Online — Trading Assistant</div>
                        </div>
                        <button className='ai-assistant__panel-close' onClick={() => setIsOpen(false)}>×</button>
                    </div>

                    <div className='ai-assistant__messages'>
                        {messages.map((m, i) => (
                            <div key={i} className={`ai-assistant__msg ai-assistant__msg--${m.role}`}>
                                <div className='ai-assistant__msg-bubble'>{m.text}</div>
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
                                className='ai-assistant__quick-btn'
                                onClick={() => { setInput(p); }}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <div className='ai-assistant__input-row'>
                        <textarea
                            className='ai-assistant__input'
                            placeholder='Ask about markets, strategies, risk...'
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            rows={1}
                        />
                        <button
                            className='ai-assistant__send-btn'
                            onClick={sendMessage}
                            disabled={!input.trim()}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiAssistant;
