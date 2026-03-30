import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { load, save_types } from '@/external/bot-skeleton';
import './free-bots.scss';

interface Bot {
    id: string;
    name: string;
    description: string;
    fileName: string;
    category: string;
    icon: string;
    neonColor: string;
}

const BOTS: Bot[] = [
    {
        id: '1',
        name: 'Expert Speed Bot',
        description: 'Advanced speed trading bot with optimized entry and exit points for quick trades.',
        fileName: '2_2025_Updated_Expert_Speed_Bot_Version_📉📉📉📈📈📈_1_1_1765711647656.xml',
        category: 'Speed Trading',
        icon: '⚡',
        neonColor: '#00f5ff',
    },
    {
        id: '2',
        name: 'Candle Mine Bot',
        description: 'Analyzes candlestick patterns to identify profitable trading opportunities.',
        fileName: '3_2025_Updated_Version_Of_Candle_Mine🇬🇧_1765711647657.xml',
        category: 'Pattern Analysis',
        icon: '🕯️',
        neonColor: '#ff6b35',
    },
    {
        id: '3',
        name: 'Accumulators Pro Bot',
        description: 'Professional accumulator strategy bot for consistent growth trading.',
        fileName: 'Accumulators_Pro_Bot_1765711647657.xml',
        category: 'Accumulators',
        icon: '📈',
        neonColor: '#39ff14',
    },
    {
        id: '4',
        name: 'AI Entry Point Bot',
        description: 'AI-powered bot that identifies optimal entry points for maximum profit.',
        fileName: 'AI_with_Entry_Point_1765711647658.xml',
        category: 'AI Trading',
        icon: '🤖',
        neonColor: '#bf5fff',
    },
    {
        id: '5',
        name: 'Alex Speed Bot EXPRO2',
        description: 'Enhanced speed trading bot with advanced algorithms for rapid execution.',
        fileName: 'ALEXSPEEDBOT__EXPRO2_(2)_(1)_1765711647659.xml',
        category: 'Speed Trading',
        icon: '🚀',
        neonColor: '#00f5ff',
    },
    {
        id: '6',
        name: 'Alpha AI Two Predictions',
        description: 'Dual prediction AI system for higher accuracy in market forecasting.',
        fileName: 'Alpha_Ai_Two_Predictions__1765711647659.xml',
        category: 'AI Trading',
        icon: '🎯',
        neonColor: '#bf5fff',
    },
    {
        id: '7',
        name: 'Auto C4 Volt Premium',
        description: 'Premium automated trading bot with advanced market analysis features.',
        fileName: 'AUTO_C4_VOLT_🇬🇧_2_🇬🇧_AI_PREMIUM_ROBOT_(2)_(1)_1765711647660.xml',
        category: 'Premium',
        icon: '⚡',
        neonColor: '#ffd700',
    },
    {
        id: '8',
        name: 'Binary Flipper AI Plus',
        description: 'AI-enhanced binary options trading bot with flip strategy optimization.',
        fileName: 'BINARY_FLIPPER_AI_ROBOT_PLUS_+_1765711647660.xml',
        category: 'AI Trading',
        icon: '🔄',
        neonColor: '#bf5fff',
    },
    {
        id: '9',
        name: 'Binarytool Wizard AI',
        description: 'Intelligent trading wizard with multiple strategy implementations.',
        fileName: 'BINARYTOOL_WIZARD_AI_BOT_1765711647661.xml',
        category: 'AI Trading',
        icon: '🧙',
        neonColor: '#bf5fff',
    },
    {
        id: '10',
        name: 'Binarytool Differ V2.0',
        description: 'Version 2.0 differ bot with improved accuracy and performance.',
        fileName: 'BINARYTOOL@_DIFFER_V2.0_(1)_(1)_1765711647662.xml',
        category: 'Differ',
        icon: '📊',
        neonColor: '#00f5ff',
    },
    {
        id: '11',
        name: 'Even Odd Thunder AI Pro',
        description: 'Professional even/odd prediction bot with thunder-fast execution.',
        fileName: 'BINARYTOOL@EVEN_ODD_THUNDER_AI_PRO_BOT_1765711647662.xml',
        category: 'Even/Odd',
        icon: '⚡',
        neonColor: '#39ff14',
    },
    {
        id: '12',
        name: 'Even & Odd AI Bot',
        description: 'Smart AI bot specialized in even and odd digit predictions.',
        fileName: 'BINARYTOOL@EVEN&ODD_AI_BOT_(2)_1765711647663.xml',
        category: 'Even/Odd',
        icon: '🎲',
        neonColor: '#39ff14',
    },
    {
        id: '13',
        name: 'Ahmed SpeedBot Over 1 Pro',
        description: 'Ultra-fast digit over 1 bot with Martingale recovery system. Targets quick wins on 1HZ10V with aggressive profit locking.',
        fileName: 'AHMED_SPEEDBOT_OVER_1_PRO_1774885856719.xml',
        category: 'Speed Trading',
        icon: '🔥',
        neonColor: '#ff073a',
    },
    {
        id: '14',
        name: 'Fake Losses Higher Only',
        description: 'Smart fake-loss strategy bot that waits for pattern confirmation before placing a real CALL trade on R_100.',
        fileName: 'FAKE_LOSES_HIGHER_ONLY_1774885871252.xml',
        category: 'Pattern Analysis',
        icon: '🎭',
        neonColor: '#ff6b35',
    },
    {
        id: '15',
        name: 'Digit Over 3 Bot',
        description: 'Precision digit over 3 bot with advanced tick-by-tick analysis and smart stake management on R_10.',
        fileName: 'Digit_Over_3_1774885882967.xml',
        category: 'Differ',
        icon: '🔢',
        neonColor: '#00f5ff',
    },
    {
        id: '16',
        name: 'Ahmed SpeedBot Under 7 Pro',
        description: 'Lightning-fast digit under 7 bot with Martingale on 1HZ25V. Rapid execution with auto profit and loss protection.',
        fileName: 'AHMED_SPEEDBOT_under_7_pro_1774885898657.xml',
        category: 'Speed Trading',
        icon: '💨',
        neonColor: '#ff073a',
    },
    {
        id: '17',
        name: 'Ahmed SpeedBot v6.2',
        description: 'Latest flagship version of the AhmedSpeedBot series with multi-digit tracking, Martingale recovery, and advanced tick analysis.',
        fileName: 'AHMED_SPEEDBOT_v6.2_1774885909546.xml',
        category: 'Speed Trading',
        icon: '🏎️',
        neonColor: '#ff073a',
    },
];

const FreeBots = observer(() => {
    const store = useStore();
    const [loadingBotId, setLoadingBotId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const categories = ['All', ...Array.from(new Set(BOTS.map(bot => bot.category)))];

    const filteredBots = selectedCategory === 'All'
        ? BOTS
        : BOTS.filter(bot => bot.category === selectedCategory);

    const loadBot = async (bot: Bot) => {
        try {
            setLoadingBotId(bot.id);

            const response = await fetch(`/bots/${bot.fileName}`);
            if (!response.ok) {
                throw new Error('Failed to fetch bot file');
            }

            const xmlContent = await response.text();

            await load({
                block_string: xmlContent,
                file_name: bot.name,
                workspace: (window as any).Blockly?.derivWorkspace,
                from: save_types.LOCAL,
                drop_event: null,
                strategy_id: null,
                showIncompatibleStrategyDialog: null,
            });

            store?.dashboard?.setActiveTab(1);
            window.location.hash = 'bot_builder';

        } catch (error) {
            console.error('Error loading bot:', error);
        } finally {
            setLoadingBotId(null);
        }
    };

    return (
        <div className='free-bots'>
            <div className='free-bots__bg-grid' />
            <div className='free-bots__header'>
                <div className='free-bots__header-badge'>AI POWERED</div>
                <h1 className='free-bots__title'>Free Trading Bots</h1>
                <p className='free-bots__subtitle'>
                    Next-generation bots engineered for precision. Load any bot instantly into the builder.
                </p>
            </div>

            <div className='free-bots__categories'>
                {categories.map(category => (
                    <button
                        key={category}
                        className={`free-bots__category-btn ${selectedCategory === category ? 'free-bots__category-btn--active' : ''}`}
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <div className='free-bots__grid'>
                {filteredBots.map(bot => (
                    <div
                        key={bot.id}
                        className='free-bots__card'
                        style={{ '--neon-color': bot.neonColor } as React.CSSProperties}
                    >
                        <div className='free-bots__card-glow' />
                        <div className='free-bots__card-header'>
                            <span className='free-bots__card-icon'>{bot.icon}</span>
                            <span className='free-bots__card-category'>{bot.category}</span>
                        </div>
                        <h3 className='free-bots__card-title'>{bot.name}</h3>
                        <p className='free-bots__card-description'>{bot.description}</p>
                        <button
                            className='free-bots__card-btn'
                            onClick={() => loadBot(bot)}
                            disabled={loadingBotId === bot.id}
                        >
                            {loadingBotId === bot.id ? (
                                <span className='free-bots__card-btn-loading'>
                                    <span className='free-bots__card-btn-spinner' />
                                    Loading...
                                </span>
                            ) : (
                                <>
                                    <span>Load Bot</span>
                                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                                        <path d='M5 12h14M12 5l7 7-7 7' />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            <div className='free-bots__footer'>
                <p>All bots are provided for educational purposes. Always test with demo accounts first.</p>
            </div>
        </div>
    );
});

export default FreeBots;
