
import React, { useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { ShieldCheckIcon, WrenchScrewdriverIcon, BoltIcon, XMarkIcon } from './icons';

const NotificationSystem: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { notification } = state;

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                dispatch({ type: 'HIDE_NOTIFICATION' });
            }, notification.duration || 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, dispatch]);

    if (!notification) return null;

    const getStyles = (type: string) => {
        switch(type) {
            case 'success': return 'bg-emerald-900/90 border-emerald-500 text-emerald-100 shadow-emerald-900/20';
            case 'error': return 'bg-red-900/90 border-red-500 text-red-100 shadow-red-900/20';
            case 'warning': return 'bg-amber-900/90 border-amber-500 text-amber-100 shadow-amber-900/20';
            default: return 'bg-blue-900/90 border-blue-500 text-blue-100 shadow-blue-900/20';
        }
    };

    const getIcon = (type: string) => {
        switch(type) {
            case 'success': return <ShieldCheckIcon className="w-5 h-5" />;
            case 'error': return <XMarkIcon className="w-5 h-5" />;
            default: return <BoltIcon className="w-5 h-5" />;
        }
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md">
            <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-300 ${getStyles(notification.type)}`}>
                {getIcon(notification.type)}
                <span className="font-medium text-sm flex-1">{notification.message}</span>
                <button onClick={() => dispatch({ type: 'HIDE_NOTIFICATION' })} className="opacity-70 hover:opacity-100">
                    <XMarkIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default NotificationSystem;
