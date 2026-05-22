import { useEffect, useRef, useState } from 'react';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import './ApiTokenLogin.scss';

type Props = {
    onClose: () => void;
};

export default function ApiTokenLogin({ onClose }: Props) {
    const [token, setToken] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = token.trim();
        if (!trimmed) return;

        setStatus('loading');
        setErrorMsg('');

        try {
            localStorage.setItem('authToken', trimmed);
            await api_base.init();

            if (api_base.is_authorized) {
                const loginid = localStorage.getItem('active_loginid') || '';
                const isDemo = loginid.startsWith('VR') || loginid.startsWith('VRW');
                window.location.replace(
                    window.location.origin + `/bot/?account=${isDemo ? 'demo' : 'USD'}`
                );
            } else {
                localStorage.removeItem('authToken');
                setStatus('error');
                setErrorMsg('Token is invalid or expired. Please check and try again.');
            }
        } catch {
            localStorage.removeItem('authToken');
            setStatus('error');
            setErrorMsg('Could not connect to Deriv. Check your token and internet connection.');
        }
    };

    return (
        <div className='atl-overlay' onClick={e => { if ((e.target as Element).classList.contains('atl-overlay')) onClose(); }}>
            <div className='atl-modal'>
                <button className='atl-modal__close' onClick={onClose} aria-label='Close'>✕</button>

                <div className='atl-modal__icon'>🔑</div>
                <h2 className='atl-modal__title'>Login with API Token</h2>
                <p className='atl-modal__hint'>
                    Go to{' '}
                    <a href='https://app.deriv.com/account/api-token' target='_blank' rel='noreferrer'>
                        app.deriv.com → API Token
                    </a>{' '}
                    and create a token with <strong>Read</strong>, <strong>Trade</strong> and{' '}
                    <strong>Trading Information</strong> permissions.
                </p>

                <form onSubmit={handleSubmit} className='atl-modal__form'>
                    <input
                        ref={inputRef}
                        className='atl-modal__input'
                        type='text'
                        placeholder='Paste your API token here...'
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        spellCheck={false}
                        autoComplete='off'
                        disabled={status === 'loading'}
                    />

                    {status === 'error' && (
                        <p className='atl-modal__error'>{errorMsg}</p>
                    )}

                    <button
                        className='atl-modal__btn'
                        type='submit'
                        disabled={status === 'loading' || !token.trim()}
                    >
                        {status === 'loading' ? (
                            <span className='atl-modal__spinner' />
                        ) : (
                            'Connect & Trade'
                        )}
                    </button>
                </form>

                <p className='atl-modal__note'>
                    Your token is stored locally and never sent to any third-party server.
                </p>
            </div>
        </div>
    );
}
