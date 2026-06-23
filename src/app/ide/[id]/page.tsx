"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft, Settings as SettingsIcon, History as HistoryIcon, Package,
    Share2, Github, Coins, Copy, BookOpen
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { WorkspaceView } from '@/components/workspace/WorkspaceView';
import { ThemeToggle } from '@/components/ThemeToggle';

type ModalKind = null | 'settings' | 'history' | 'deps' | 'share' | 'compile' | 'clone' | 'wiki';

export default function IdePage() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialPrompt = searchParams.get('prompt');
    const initialModel = searchParams.get('model');
    const initialLanguage = searchParams.get('language');
    const initialPlatform = searchParams.get('platform');
    const [user, setUser] = useState<any>(null);
    const [activeModal, setActiveModal] = useState<ModalKind>(null);
    const [accessChecked, setAccessChecked] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    useEffect(() => {
        authApi.me()
            .then((res: any) => {
                if (res.user) setUser(res.user);
            })
            .catch(() => {});
    }, []);

    // Check project access
    useEffect(() => {
        if (!id) return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/ai/projects/${id}/access`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                if (data.isPublic && data.role !== 'owner' && data.role !== 'editor') {
                    // Public project — redirect to public view
                    router.replace(`/pub/${id}`);
                    return;
                }
                if (!data.accessible) {
                    setAccessDenied(true);
                }
                setAccessChecked(true);
            })
            .catch(() => setAccessChecked(true));
    }, [id, router]);

    const handleLogout = async () => {
        await authApi.logout();
        setUser(null);
        router.push('/');
    };

    if (!id) return null;

    if (accessDenied) {
        return (
            <main className="flex h-screen bg-background text-foreground items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-muted mb-4">You don&apos;t have access to this project.</p>
                    <button onClick={() => router.push('/')} className="px-4 py-2 text-xs font-bold bg-foreground text-background rounded-lg">
                        Go Home
                    </button>
                </div>
            </main>
        );
    }

    if (!accessChecked) {
        return (
            <main className="flex h-screen bg-background text-foreground items-center justify-center">
                <div className="text-sm text-muted animate-pulse">Checking access...</div>
            </main>
        );
    }

    return (
        <main className="flex h-screen bg-background text-foreground overflow-hidden font-sans relative">
            <div className="bg-orb bg-orb-teal w-[600px] h-[600px] -top-40 -left-40 fixed opacity-30 pointer-events-none" />

            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* ─── Top Bar ─── */}
                <header className="h-12 flex items-center justify-between px-4 z-30 shrink-0 border-b border-white/5 bg-background/80 backdrop-blur-xl">
                    {/* Left: Back + session name */}
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/')} className="p-1.5 rounded-lg hover:bg-[hsl(var(--surface-sunk))] text-muted hover:text-foreground transition-all" title="Back to home">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Center: Tabs */}
                    <div className="flex items-center gap-1">
                        <button onClick={() => setActiveModal('settings')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground rounded-lg hover:bg-[hsl(var(--surface-sunk))] transition-all">
                            <SettingsIcon className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Settings</span>
                        </button>
                        <button onClick={() => setActiveModal('history')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground rounded-lg hover:bg-[hsl(var(--surface-sunk))] transition-all">
                            <HistoryIcon className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">History</span>
                        </button>
                        <button onClick={() => setActiveModal('deps')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground rounded-lg hover:bg-[hsl(var(--surface-sunk))] transition-all">
                            <Package className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Dependencies</span>
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        <button onClick={() => setActiveModal('wiki')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-all">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Wiki</span>
                        </button>
                        <button onClick={() => setActiveModal('share')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground rounded-lg hover:bg-[hsl(var(--surface-sunk))] transition-all">
                            <Share2 className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Share</span>
                        </button>
                        <button onClick={() => setActiveModal('clone')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground rounded-lg hover:bg-[hsl(var(--surface-sunk))] transition-all">
                            <Copy className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Clone</span>
                        </button>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground rounded-lg hover:bg-[hsl(var(--surface-sunk))] transition-all">
                            <Github className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">GitHub</span>
                        </a>
                        <ThemeToggle />
                        {user && (
                            <Link href="/credits" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground hover:text-primary rounded-lg hover:bg-[hsl(var(--surface-sunk))] transition-all">
                                <Coins className="w-3.5 h-3.5 text-primary" />
                                <span>{user.credits ?? 0}</span>
                            </Link>
                        )}
                    </div>
                </header>

                {/* ─── Workspace ─── */}
                <WorkspaceView
                    sessionId={id as string}
                    onExit={() => router.push('/')}
                    initialPrompt={initialPrompt}
                    initialModel={initialModel}
                    initialLanguage={initialLanguage || undefined}
                    initialPlatform={initialPlatform || undefined}
                    activeModal={activeModal}
                    onSetActiveModal={setActiveModal}
                />
            </div>
        </main>
    );
}
