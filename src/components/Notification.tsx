"use client";

import React, { useState, createContext, useContext } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
    id: string;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = (message: string, type: NotificationType) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications(prev => [...prev, { id, message, type }]);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-md w-full sm:w-auto">
                {notifications.map(n => (
                    <div
                        key={n.id}
                        className={`
                            glass-card-strong p-4 rounded-2xl flex items-center gap-3 shadow-2xl animate-in slide-in-from-right-full duration-300 border
                            ${n.type === 'error' ? 'border-red-500/30' : n.type === 'success' ? 'border-green-500/30' : 'border-[hsl(var(--text)/0.3)]'}
                        `}
                    >
                        {n.type === 'error' && <AlertCircle className="w-5 h-5 text-danger shrink-0" />}
                        {n.type === 'success' && <CheckCircle className="w-5 h-5 text-success shrink-0" />}
                        {n.type === 'info' && <Info className="w-5 h-5 text-primary shrink-0" />}

                        <span className="text-xs font-medium text-foreground flex-1">{n.message}</span>

                        <button
                            onClick={() => removeNotification(n.id)}
                            className="p-1 hover:bg-[hsl(var(--surface-sunk))] rounded-lg text-muted hover:text-foreground transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
