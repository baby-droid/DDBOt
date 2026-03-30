import { useEffect, useRef, useState } from 'react';
import './chunk-loader.scss';

const LOAD_MESSAGES = [
    'Initializing AHMEDSYNTRADER...',
    'Loading market intelligence...',
    'Syncing neural pathways...',
    'Connecting to live markets...',
    'Calibrating algorithms...',
    'Loading trading systems...',
    'Scanning volatility patterns...',
    'Finalizing quantum setup...',
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
            const target = Math.min((elapsed / 4000) * 100, 98);
            setProgress(target);
            animRef.current = requestAnimationFrame(animate);
        };
        animRef.current = requestAnimationFrame(animate);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setMsgIndex(prev => (prev + 1) % LOAD_MESSAGES.length);
        }, 1400);
        return () => clearInterval(interval);
    }, []);

    const p = Math.min(Math.round(progress), 99);
    const circumference = 2 * Math.PI * 34;
    const arcLength = (p / 100) * circumference;

    return (
        <div className='splash'>
            <div className='splash__bg' />
            <div className='splash__glow splash__glow--1' />
            <div className='splash__glow splash__glow--2' />

            <div className='splash__content'>
                <div className='splash__logo-wrap'>
                    <img src='/ahmedsyntrader-logo.png' className='splash__logo' alt='AHMEDSYNTRADER' />
                </div>

                <h1 className='splash__title'>AHMEDSYNTRADER</h1>
                <div className='splash__divider' />
                <p className='splash__tagline'>Advanced Algorithmic Trading Platform</p>

                <div className='splash__spinner-wrap'>
                    <svg className='splash__ring' viewBox='0 0 80 80' width='90' height='90'>
                        <defs>
                            <linearGradient id='ringGrad' x1='0%' y1='0%' x2='100%' y2='0%'>
                                <stop offset='0%' stopColor='#4a9fff' />
                                <stop offset='100%' stopColor='#00e890' />
                            </linearGradient>
                        </defs>
                        <circle cx='40' cy='40' r='34' fill='none' stroke='rgba(74,159,255,0.1)' strokeWidth='3' />
                        <circle
                            className='splash__ring-arc'
                            cx='40'
                            cy='40'
                            r='34'
                            fill='none'
                            stroke='url(#ringGrad)'
                            strokeWidth='3.5'
                            strokeLinecap='round'
                            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
                            transform='rotate(-90 40 40)'
                        />
                    </svg>
                    <div className='splash__pct'>{p}%</div>
                </div>

                <p className='splash__msg' key={msgIndex}>{LOAD_MESSAGES[msgIndex]}</p>
                <p className='splash__sub-msg'>{message || 'Syncing neural pathways'}</p>
            </div>

            <div className='splash__version'>v2.0.0 — Quantum Edition</div>
        </div>
    );
}
