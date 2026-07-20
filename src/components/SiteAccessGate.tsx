"use client";

import { useEffect, useState } from "react";
import { Lock, MessageCircle } from "lucide-react";
import { authApi } from "@/lib/api";

export function SiteAccessGate({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<{ open: boolean; message?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const checkStatus = async () => {
            try {
                const result = await authApi.getSiteStatus();
                if (mounted) {
                    setStatus(result);
                }
            } catch (error) {
                if (mounted) {
                    setStatus({ open: false, message: "The site is temporarily unavailable. Please try again shortly." });
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        checkStatus();
        return () => {
            mounted = false;
        };
    }, []);

    if (loading) {
        return null;
    }

    if (status?.open) {
        return <>{children}</>;
    }

    return (
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
            <div className="max-w-xl rounded-3xl border border-white/10 bg-[hsl(var(--surface))]/90 p-8 text-center shadow-2xl">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.15)] text-primary">
                    <Lock className="h-7 w-7" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">Site temporarily unavailable</p>
                <h1 className="mt-3 text-3xl font-black text-foreground">The site is currently closed</h1>
                <p className="mt-4 text-sm leading-7 text-muted">
                    {status?.message || "The site is offline for your current connection. Please contact support or join our Discord for access."}
                </p>
                <a
                    href="https://discord.gg/FD6QrzeATb"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-white/10"
                >
                    <MessageCircle className="h-4 w-4" />
                    Open Discord
                </a>
            </div>
        </main>
    );
}
