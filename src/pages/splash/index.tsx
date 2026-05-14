import React, { useEffect, useState } from 'react';
import './splash.scss';

type SplashScreenProps = {
    message?: string;
};

const SplashScreen: React.FC<SplashScreenProps> = () => {
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Initializing AHMEDSYNTRADER...');

    useEffect(() => {
        const messages = [
            'Initializing AHMEDSYNTRADER...',
            'Loading trading algorithms...',
            'Connecting to markets...',
            'Calibrating AI engines...',
            'Preparing your workspace...',
        ];
        let msgIndex = 0;
        const interval = setInterval(() => {
            setProgress(prev => {
                const next = prev + Math.random() * 6 + 3;
                if (next >= 95) {
                    clearInterval(interval);
                    return 95;
                }
                return next;
            });
            msgIndex = (msgIndex + 1) % messages.length;
            setStatusText(messages[msgIndex]);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const clamped = Math.min(Math.round(progress), 100);
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;

    return (
        <div className='splash-screen'>
            <div className='splash-screen__bg-glow splash-screen__bg-glow--1' />
            <div className='splash-screen__bg-glow splash-screen__bg-glow--2' />

            <div className='splash-screen__content'>
                <div className='splash-screen__logo-wrapper'>
                    <div className='splash-screen__logo-ring' />
                    <div className='splash-screen__logo-ring splash-screen__logo-ring--2' />
                    <img src='/ahmed-logo.png' alt='AHMEDSYNTRADER' className='splash-screen__logo' />
                </div>

                <h1 className='splash-screen__title'>AHMEDSYNTRADER</h1>
                <p className='splash-screen__subtitle'>ADVANCED ALGORITHMIC TRADING PLATFORM</p>

                <div className='splash-screen__progress-wrapper'>
                    <svg className='splash-screen__ring' viewBox='0 0 100 100'>
                        <circle className='splash-screen__ring-bg' cx='50' cy='50' r={radius} />
                        <circle
                            className='splash-screen__ring-fill'
                            cx='50'
                            cy='50'
                            r={radius}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                        />
                    </svg>
                    <span className='splash-screen__percent'>{clamped}%</span>
                </div>

                <p className='splash-screen__status'>{statusText}</p>
                <p className='splash-screen__loading-text'>Loading...</p>
            </div>

            <div className='splash-screen__footer'>v2.0.0 &mdash; Quantum Edition</div>
        </div>
    );
};

export default SplashScreen;
