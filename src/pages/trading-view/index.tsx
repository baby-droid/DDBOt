import React, { useState } from 'react';
import './trading-view.scss';

const TradingViewPage: React.FC = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className='trading-view-page'>
            {!isLoaded && (
                <div className='trading-view-page__loading'>
                    <div className='trading-view-page__spinner' />
                    <p>Loading Deriv Charts...</p>
                </div>
            )}
            <iframe
                className='trading-view-page__frame'
                src='https://charts.deriv.com/deriv'
                title='Deriv TradingView Charts'
                allow='fullscreen'
                onLoad={() => setIsLoaded(true)}
                style={{ opacity: isLoaded ? 1 : 0 }}
            />
        </div>
    );
};

export default TradingViewPage;
