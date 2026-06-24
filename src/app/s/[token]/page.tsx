"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Lock, Globe, FileCode, Clock, User, ExternalLink, Loader2 } from 'lucide-react';
import { aiApi } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function SharedProjectPage() {
    const { token } = useParams();
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        aiApi.getSharedProject(token as string)
            .then((res: any) => {
                if (res.project) {
                    setProject(res.project);
                } else {
                    setError(res.error || 'Invalid or expired link');
                }
            })
            .catch(() => setError('Failed to load project.'))
            .finally(() => setLoading(false));
    }, [token]);

    const handleOpenIDE = () => {
        router.push(`/ide/${project.id}`);
    };

    if (loading) {
        return (
            <main className="flex h-screen bg-background text-foreground items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex h-screen bg-background text-foreground items-center justify-center">
                <div className="text-center">
                    <Lock className="w-12 h-12 text-muted mx-auto mb-4" />
                    <p className="text-sm text-muted">{error}</p>
                    <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 text-xs font-bold bg-foreground text-background rounded-lg">
                        Go Home
                    </button>
                </div>
            </main>
        );
    }

    const lang = project?.language || 'java';
    const langLabel = lang === 'kotlin' ? 'Kotlin' : lang.startsWith('config-') ? lang.replace('config-', '') + ' Config' : lang.startsWith('datapack-') ? 'Datapack' : lang.startsWith('scripting-') ? 'Scripting' : 'Java';

    return (
        <main className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-background/80 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/')} className="p-1.5 rounded-lg hover:bg-[hsl(var(--surface-sunk))] text-muted hover:text-foreground transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold">{project?.name || 'Project'}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Shared</span>
                        </div>
                    </div>
                    <ThemeToggle />
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-6 py-10">
                        {/* Project Info */}
                        <div className="glass-card rounded-2xl p-6 mb-6">
                            {project?.thumbnail && (
                                <div className="w-full h-48 rounded-xl overflow-hidden mb-4 border border-white/10">
                                    <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <h1 className="text-2xl font-black mb-2">{project?.name || 'Untitled Project'}</h1>
                            <div className="flex items-center gap-4 text-xs text-muted mb-4">
                                <span className="flex items-center gap-1"><FileCode className="w-3.5 h-3.5" /> {langLabel}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Updated {project?.last_updated ? new Date(project.last_updated).toLocaleDateString() : 'Unknown'}</span>
                                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {project?.author_name}</span>
                            </div>

                            <div className="flex items-center gap-3 mt-4">
                                <button
                                    onClick={handleOpenIDE}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-xs font-bold rounded-xl hover:opacity-90 transition-all"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" /> Open in IDE
                                </button>
                                <span className="text-[11px] text-muted">View and edit in the workspace</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
