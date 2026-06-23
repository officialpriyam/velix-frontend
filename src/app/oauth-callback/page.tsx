"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function OAuthCallbackPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState('Processing authentication...');

    useEffect(() => {
        let accessToken: string | null = null;

        const hash = window.location.hash;
        if (hash) {
            const hashParams = new URLSearchParams(hash.substring(1));
            accessToken = hashParams.get('access_token');
        }

        if (!accessToken) {
            const searchParams = new URLSearchParams(window.location.search);
            accessToken = searchParams.get('access_token');
        }

        if (!accessToken) {
            setError('No access token found in URL');
            setStatus('Authentication failed');
            const t = setTimeout(() => router.push('/'), 2000);
            return () => clearTimeout(t);
        }

        setStatus('Verifying credentials...');

        authApi.oauth(accessToken)
            .then((result: any) => {
                if (result.error) {
                    console.error('[OAuth] Backend error:', result.error);
                    setError(result.error);
                    setStatus('Authentication failed');
                    const t = setTimeout(() => router.push('/'), 2000);
                    return () => clearTimeout(t);
                }

                setStatus('Authentication successful! Redirecting...');

                // Small delay to ensure cookie is propagated through proxy
                setTimeout(() => {
                    window.location.href = '/';
                }, 300);
            })
            .catch((err) => {
                console.error('[OAuth] Request failed:', err);
                setError('Failed to authenticate with server');
                setStatus('Authentication failed');
                const t = setTimeout(() => router.push('/'), 2000);
                return () => clearTimeout(t);
            });
    }, [router]);

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground font-sans">
            <div className="w-8 h-8 border-2 border-[hsl(var(--text))] border-t-transparent rounded-full animate-spin mb-4" />
            {error ? (
                <p className="text-xs text-red-400">{error}</p>
            ) : (
                <p className="text-xs text-zinc-400">{status}</p>
            )}
        </div>
    );
}
