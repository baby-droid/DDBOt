import { useEffect, useRef, useState } from 'react';
import './chunk-loader.scss';

const LOAD_MESSAGES = [
    'Preparing your trading experience...',
    'Loading market intelligence...',
    'Connecting to live markets...',
    'Calibrating algorithms...',
    'Scanning volatility patterns...',
    'Syncing AI trading signals...',
    'Finalizing quantum setup...',
    'Almost ready...',
];

const FEATURES = [
    {
        icon: (
            <svg viewBox='0 0 24 24' fill='none' width='28' height='28'>
                <polyline points='2,18 8,12 13,16 22,6' stroke='#00e5a0' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' />
                <polyline points='16,6 22,6 22,12' stroke='#00e5a0' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
        ),
        label: 'Analysis Tool',
    },
    {
        icon: (
            <svg viewBox='0 0 24 24' fill='none' width='28' height='28'>
                <rect x='3' y='11' width='18' height='11' rx='2' stroke='#00e5a0' strokeWidth='2' />
                <path d='M7 11V7a5 5 0 0 1 10 0v4' stroke='#00e5a0' strokeWidth='2' strokeLinecap='round' />
                <circle cx='12' cy='16' r='1.5' fill='#00e5a0' />
                <path d='M8 8 Q12 5 16 8' stroke='#00e5a0' strokeWidth='1.5' strokeLinecap='round' />
            </svg>
        ),
        label: 'AI Bots',
    },
    {
        icon: (
            <svg viewBox='0 0 24 24' fill='none' width='28' height='28'>
                <circle cx='9' cy='7' r='3' stroke='#00e5a0' strokeWidth='2' />
                <circle cx='17' cy='9' r='2.5' stroke='#00e5a0' strokeWidth='2' />
                <path d='M3 20c0-3.3 2.7-6 6-6h2' stroke='#00e5a0' strokeWidth='2' strokeLinecap='round' />
                <path d='M13 18c0-2.2 1.8-4 4-4s4 1.8 4 4' stroke='#00e5a0' strokeWidth='2' strokeLinecap='round' />
            </svg>
        ),
        label: 'Copy Trading',
    },
];

export default function ChunkLoader({ message }: { message: string }) {
    const [progress, setProgress] = useState(0);
    const [msgIndex, setMsgIndex] = useState(0);
    const animRef = useRef<number | null>(null);
    const startRef = useRef<number | null>(null);

    useEffect(() => {
        const animate = (ts: number) => {
            if (!startRef.current) startRef.current = ts;
            const elapsed = ts - startRef.current;
            const target = Math.min((elapsed / 4500) * 100, 97);
            setProgress(target);
            animRef.current = requestAnimationFrame(animate);
        };
        animRef.current = requestAnimationFrame(animate);
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setMsgIndex(prev => (prev + 1) % LOAD_MESSAGES.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const p = Math.min(Math.round(progress), 97);

    return (
        <div className='splash'>
            <div className='splash__grid' />
            <div className='splash__glow splash__glow--top' />
            <div className='splash__glow splash__glow--bottom' />

            <div className='splash__content'>
                <div className='splash__logo-wrap'>
                    <img src='/ahmedsyntrader-logo.png' className='splash__logo' alt='AHMEDSYNTRADER' />
                </div>

                <h1 className='splash__title'>AHMEDSYNTRADER</h1>
                <p className='splash__subtitle'>Deriv AI Trading Tool</p>

                <div className='splash__features'>
                    {FEATURES.map(f => (
                        <div className='splash__feature' key={f.label}>
                            <div className='splash__feature-icon'>
                                {f.icon}
                            </div>
                            <span className='splash__feature-label'>{f.label}</span>
                        </div>
                    ))}
                </div>

                <div className='splash__bar-wrap'>
                    <div className='splash__bar'>
                        <div className='splash__bar-fill' style={{ width: `${p}%` }} />
                        <div className='splash__bar-glow' style={{ left: `calc(${p}% - 4px)` }} />
                    </div>
                </div>

                <p className='splash__msg' key={msgIndex}>
                    {LOAD_MESSAGES[msgIndex]}
                </p>
                {message && message !== 'Loading...' && (
                    <p className='splash__sub-msg'>{message}</p>
                )}

                <p className='splash__powered'>Powered by Deriv</p>
            </div>
        </div>
    );
}
