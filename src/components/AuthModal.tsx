"use client";

import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';

const PROVIDER_ICONS: Record<string, string> = {
    github: 'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z',
    google: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z',
    discord: 'M20.52 4.19a19.6 19.6 0 00-4.87-1.51.03.03 0 00-.03.01c-.21.37-.44.86-.61 1.25a18.17 18.17 0 00-5.48 0 12.45 12.45 0 00-.62-1.25.03.03 0 00-.03-.01 19.67 19.67 0 00-4.87 1.51.02.02 0 00-.01.01C.32 8.97-.32 13.47.09 17.9a.03.03 0 00.01.02 19.8 19.8 0 005.99 3.03.03.03 0 00.03-.01c.46-.63.87-1.3 1.23-1.99a.03.03 0 00-.02-.04 13.01 13.01 0 01-1.87-.89.03.03 0 01 0-.05c.13-.09.25-.19.37-.29a.03.03 0 01.08-.01c3.93 1.79 8.18 1.79 12.06 0a.03.03 0 01.08.01c.12.1.24.2.37.29a.03.03 0 01 0 .05c-.6.35-1.22.65-1.87.89a.03.03 0 00-.02.04c.36.7.77 1.36 1.23 1.99a.03.03 0 00.03.01 19.74 19.74 0 006-3.03.03.03 0 00.01-.02c.5-5.18-.84-9.67-3.55-13.66a.02.02 0 00-.01-.02zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.41 0-1.33.96-2.41 2.16-2.41 1.21 0 2.18 1.09 2.16 2.41 0 1.33-.96 2.41-2.16 2.41zm7.97 0c-1.18 0-2.16-1.08-2.16-2.41 0-1.33.96-2.41 2.16-2.41 1.21 0 2.18 1.09 2.16 2.41 0 1.33-.95 2.41-2.16 2.41z',
    apple: 'M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z',
    bitbucket: 'M.778 1.978l6.324 16.594a.778.778 0 001.433.039L14.478 1.978a.778.778 0 00-.71-1.022H1.488a.778.778 0 00-.71 1.022zm5.365 5.538h3.96l-1.978 5.094h-3.96l-1.978-5.094z',
    azure: 'M11.4 2L2 7.8l3.4 13.2L12 23.2l6.6-2.2L22 7.8 11.4 2zm0 2.4L18 8l-2.4 8.8L12 18l-3.6-1.2L6 8l5.6-3.6z',
    gitlab: 'M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 014.82 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0118.6 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.51L23 13.45a.84.84 0 01-.35.94z',
    facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    notion: 'M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.2 2.16c-.42-.326-.98-.7-2.055-.607l-12.8.934c-.466.047-.56.28-.374.466l1.44 1.29zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.166V6.354c0-.606-.233-.933-.748-.886l-15.177.887c-.56.04-.747.28-.747.887zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.515-1.635.515-.748 0-.935-.234-1.498-.933l-4.577-7.186v6.952l1.449.327s0 .84-1.168.84l-3.222.187c-.093-.187 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.187 0-.746.374-.793l3.456-.233 4.764 7.279V9.201l-1.215-.14c-.093-.515.28-.886.747-.933l3.27-.187z',
    twitter: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
};

const PROVIDER_NAMES: Record<string, string> = {
    github: 'GitHub',
    google: 'Google',
    apple: 'Apple',
    facebook: 'Facebook',
    twitter: 'X (Twitter)',
    discord: 'Discord',
    bitbucket: 'Bitbucket',
    gitlab: 'GitLab',
    azure: 'Azure',
    linkedin: 'LinkedIn',
    notion: 'Notion',
};

interface OAuthProvider {
    name: string;
    enabled: boolean;
}

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: any) => void;
}

export const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [providers, setProviders] = useState<OAuthProvider[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl) return;

        fetch(`${supabaseUrl}/auth/v1/settings`, {
            headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' }
        })
            .then(r => r.json())
            .then(data => {
                const exts = data.external_labels || data.external || {};
                const list: OAuthProvider[] = Object.entries(exts)
                    .filter(([_, v]: [string, any]) => v === true)
                    .map(([k]) => ({ name: k, enabled: true }));
                setProviders(list);
            })
            .catch(() => setProviders([]));
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = isLogin
                ? await authApi.login(email, password)
                : await authApi.register(email, name, password);

            if (result.error) {
                setError(result.error);
            } else {
                onSuccess(result.user);
                onClose();
            }
        } catch (err: any) {
            console.error('Auth request failed:', err);
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = (provider: string) => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl) {
            setError('Supabase URL is not configured.');
            return;
        }

        const redirectUrl = encodeURIComponent(`${window.location.origin}/oauth-callback`);
        window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${redirectUrl}`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 dark:bg-black/75 p-4 backdrop-blur-[2px]">
            <div className="relative w-full max-w-[365px] rounded-lg border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))]/95 p-5 shadow-2xl dark:shadow-black/70">
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 p-1 text-foreground/40 transition-colors hover:text-foreground"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="mb-7 flex items-center gap-3">
                    <span className="flex h-6 w-6 overflow-hidden rounded-md border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))]">
                        <img src="/logo.png" alt="Velix" className="h-full w-full object-cover" />
                    </span>
                    <h2 className="text-base font-bold text-foreground">
                        {isLogin ? 'Sign in to Velix' : 'Create your Velix account'}
                    </h2>
                </div>

                {providers.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 gap-2">
                        {providers.map(p => {
                            const label = PROVIDER_NAMES[p.name] || p.name.charAt(0).toUpperCase() + p.name.slice(1);
                            return (
                                <button
                                    key={p.name}
                                    type="button"
                                    onClick={() => handleOAuth(p.name)}
                                    className="flex items-center justify-center gap-2 rounded-md border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] py-2 text-xs font-semibold text-foreground transition-colors hover:bg-[hsl(var(--surface-sunk))]"
                                >
                                    {PROVIDER_ICONS[p.name] ? (
                                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d={PROVIDER_ICONS[p.name]} /></svg>
                                    ) : (
                                        <span className="h-3.5 w-3.5 rounded-full border border-current" />
                                    )}
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {providers.length > 0 && (
                    <div className="relative mb-4 flex items-center justify-center">
                        <div className="absolute inset-x-0 top-1/2 border-t border-[hsl(var(--surface-sunk))]" />
                        <span className="relative bg-[hsl(var(--surface))] px-3 text-[9px] uppercase tracking-wide text-foreground/40">
                            Or continue with
                        </span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-600 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    {!isLogin && (
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-foreground/70">Full name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-foreground/40" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input-theme w-full rounded-md py-2 pl-9 pr-3 text-xs outline-none placeholder:text-foreground/30"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground/70">Email address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-foreground/40" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-theme w-full rounded-md py-2 pl-9 pr-3 text-xs outline-none placeholder:text-foreground/30"
                                placeholder="you@velix.ai"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-foreground/70">Password</label>
                            {isLogin && (
                                <button type="button" className="text-[10px] text-foreground/50 transition-colors hover:text-foreground">
                                    Forgot your password?
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-foreground/40" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-theme w-full rounded-md py-2 pl-9 pr-3 text-xs outline-none placeholder:text-foreground/30"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="neu-button-primary flex w-full items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <p className="mt-4 text-center text-xs text-foreground/50">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                        }}
                        className="font-semibold text-foreground underline underline-offset-2 transition-colors hover:text-foreground/80"
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    );
};
