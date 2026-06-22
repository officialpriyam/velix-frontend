"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function OAuthCallbackPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const hash = window.location.hash;
        if (!hash) {
            const t = setTimeout(() => router.push('/'), 1500);
            return () => clearTimeout(t);
        }

        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');

        if (!accessToken) {
            setError('No access token found');
            const t = setTimeout(() => router.push('/'), 1500);
            return () => clearTimeout(t);
        }

        authApi.oauth(accessToken)
            .then((result: any) => {
                if (result.error) {
                    setError(result.error);
                } else {
                    router.push('/');
                }
            })
            .catch(() => {
                setError('Failed to authenticate');
                setTimeout(() => router.push('/'), 1500);
            });
    }, [router]);

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground font-sans">
            <div className="w-8 h-8 border-2 border-[hsl(var(--text))] border-t-transparent rounded-full animate-spin mb-4" />
            {error ? (
                <p className="text-xs text-red-400">{error} — redirecting...</p>
            ) : (
                <p className="text-xs text-zinc-400">Completing sign-in authentication...</p>
            )}
        </div>
    );
}
