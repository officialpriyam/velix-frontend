"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Copy, Lock, Globe, FileCode, Clock, User, ExternalLink } from 'lucide-react';
import { authApi, copyToClipboard } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function PublicProjectPage() {
    const { id } = useParams();
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [versions, setVersions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cloning, setCloning] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        authApi.me().then((res: any) => { if (res.user) setUser(res.user); }).catch(() => {});
    }, []);

    useEffect(() => {
        if (!id) return;
        setLoading(true);

        // Fetch project access info (works without auth for public projects)
        fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/ai/projects/${id}/access`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                if (!data.accessible) {
                    setError('This project is private or does not exist.');
                    setLoading(false);
                    return;
                }
                setProject(data.project);
                // Load versions
                return fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/ai/versions/${id}`, { credentials: 'include' });
            })
            .then(r => r?.json())
            .then(data => {
                if (Array.isArray(data)) setVersions(data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load project.');
                setLoading(false);
            });
    }, [id]);

    const handleClone = async () => {
        if (!user) {
            router.push('/');
            return;
        }
        setCloning(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/ai/fork/${id}`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.newSessionId) {
                router.push(`/ide/${data.newSessionId}`);
            } else {
                alert(data.error || 'Failed to clone project');
            }
        } catch {
            alert('Failed to clone project');
        } finally {
            setCloning(false);
        }
    };

    const handleMakePrivate = async () => {
        if (!user) { router.push('/'); return; }
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/ai/projects/${id}/visibility`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isPublic: false })
            });
            setProject({ ...project, is_public: 0 });
        } catch {}
    };

    const handleOpenIDE = () => {
        router.push(`/ide/${id}`);
    };

    if (loading) {
        return (
            <main className="flex h-screen bg-background text-foreground items-center justify-center">
                <div className="text-sm text-muted animate-pulse">Loading project...</div>
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

    const isOwner = user && project && (user.id === project.user_id);
    const lang = project?.language || 'java';
    const langLabel = lang === 'kotlin' ? 'Kotlin' : lang === 'config-essentialsx' ? 'EssentialsX Config' : lang.startsWith('config-') ? lang.replace('config-', '') + ' Config' : lang.startsWith('datapack-') ? 'Datapack' : lang.startsWith('scripting-') ? 'Scripting' : 'Java';

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
                            <Globe className="w-4 h-4 text-success" />
                            <span className="text-sm font-bold">{project?.name || 'Project'}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">Public</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isOwner && (
                            <>
                                <button onClick={handleOpenIDE} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground rounded-lg hover:bg-[hsl(var(--surface-sunk))] transition-all">
                                    <ExternalLink className="w-3.5 h-3.5" /> Open IDE
                                </button>
                                <button onClick={handleMakePrivate} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground rounded-lg hover:bg-[hsl(var(--surface-sunk))] transition-all">
                                    <Lock className="w-3.5 h-3.5" /> Make Private
                                </button>
                            </>
                        )}
                        <ThemeToggle />
                    </div>
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
                                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Owner</span>
                            </div>

                            <div className="flex items-center gap-3 mt-4">
                                <button
                                    onClick={handleClone}
                                    disabled={cloning}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-xs font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    {cloning ? 'Cloning...' : 'Clone Project'}
                                </button>
                                <span className="text-[11px] text-muted">Creates a copy in your workspace</span>
                            </div>
                        </div>

                        {/* Version History */}
                        <div className="glass-card rounded-2xl p-6">
                            <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" /> Version History
                            </h2>
                            {versions.length === 0 ? (
                                <p className="text-xs text-muted">No versions yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {versions.map((v, i) => (
                                        <div key={v.id || i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                            <div>
                                                <div className="text-xs font-medium">{v.description || `Version ${versions.length - i}`}</div>
                                                <div className="text-[10px] text-muted mt-0.5">
                                                    {v.created_at ? new Date(v.created_at).toLocaleString() : ''} · {Object.keys(typeof v.files === 'string' ? JSON.parse(v.files || '{}') : v.files || {}).length} files
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const files = typeof v.files === 'string' ? JSON.parse(v.files || '{}') : v.files || {};
                                                    const blob = new Blob([JSON.stringify(files, null, 2)], { type: 'application/json' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `${project?.name || 'project'}-v${versions.length - i}.json`;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                }}
                                                className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-all"
                                            >
                                                <Download className="w-3 h-3" /> Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
