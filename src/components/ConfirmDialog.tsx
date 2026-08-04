"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmState {
    open: boolean;
    title: string;
    message: string;
    danger: boolean;
    confirmLabel: string;
}

let globalSetState: ((state: ConfirmState) => void) | null = null;

export function showConfirm(options: {
    title?: string;
    message: string;
    danger?: boolean;
    confirmLabel?: string;
}): Promise<boolean> {
    return new Promise((resolve) => {
        if (globalSetState) {
            globalSetState({
                open: true,
                title: options.title || 'Confirm',
                message: options.message,
                danger: options.danger || false,
                confirmLabel: options.confirmLabel || 'Confirm',
            });
            pendingResolve = resolve;
        } else {
            resolve(window.confirm(options.message));
        }
    });
}

let pendingResolve: ((value: boolean) => void) | null = null;

export function ConfirmManager() {
    const [state, setState] = useState<ConfirmState>({
        open: false,
        title: '',
        message: '',
        danger: false,
        confirmLabel: 'Confirm',
    });

    useEffect(() => {
        globalSetState = setState;
        return () => { globalSetState = null; };
    }, []);

    const handleConfirm = useCallback(() => {
        setState((s) => ({ ...s, open: false }));
        pendingResolve?.(true);
        pendingResolve = null;
    }, []);

    const handleCancel = useCallback(() => {
        setState((s) => ({ ...s, open: false }));
        pendingResolve?.(false);
        pendingResolve = null;
    }, []);

    useEffect(() => {
        if (!state.open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleCancel();
            if (e.key === 'Enter') handleConfirm();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [state.open, handleConfirm, handleCancel]);

    if (!state.open) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleCancel}>
            <div
                className="w-full max-w-sm rounded-2xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] shadow-2xl animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 px-5 pt-5 pb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${state.danger ? 'bg-red-500/15' : 'bg-primary/15'}`}>
                        <AlertTriangle className={`w-5 h-5 ${state.danger ? 'text-red-400' : 'text-primary'}`} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">{state.title}</h3>
                        <p className="text-xs text-muted mt-0.5">{state.message}</p>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-3">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-xs font-semibold rounded-xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface-sunk))] text-muted hover:text-foreground transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${state.danger
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                            : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
                        }`}
                    >
                        {state.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
