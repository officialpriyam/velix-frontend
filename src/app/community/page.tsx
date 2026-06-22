"use client";

import React, { useState, useEffect } from 'react';
import {
    Globe,
    Download,
    GitFork,
    Clock,
    Search,
    Loader2,
    Boxes,
    Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { aiApi, fileApi } from '@/lib/api';
import { cacheApi } from '@/lib/cache';
import { MatrixRain } from '@/components/MatrixRain';
import { TopHeader, useAuth, SharedModals } from '@/components/AppShell';

const COMMUNITY_CACHE_KEY = 'community-projects';
const COMMUNITY_CACHE_TTL_SECONDS = 60;

export default function Community() {
    const router = useRouter();
    const auth = useAuth();
    const { user, setUser, logout } = auth;

    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [forkingId, setForkingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchCommunityProjects = async () => {
            try {
                const cachedProjects = await cacheApi.get<any[]>(COMMUNITY_CACHE_KEY).catch(() => null);
                if (cachedProjects) {
                    setProjects(cachedProjects);
                    setLoading(false);
                }

                const data = await aiApi.getCommunityProjects();
                setProjects(data);
                await cacheApi.set(COMMUNITY_CACHE_KEY, data, COMMUNITY_CACHE_TTL_SECONDS).catch(() => undefined);
            } catch (err) {
                console.error("Failed to fetch community projects", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCommunityProjects();
    }, []);

    const handleFork = async (sessionId: string) => {
        setForkingId(sessionId);
        try {
            const res = await aiApi.fork(sessionId);
            if (res.success) {
                router.push(`/ide/${res.newSessionId}`);
            } else {
                alert(res.error || "Failed to fork project");
            }
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setForkingId(null);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.author_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.language?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className="flex h-screen bg-background text-foreground overflow-hidden font-sans relative">
            <MatrixRain />
            {/* Horizon line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] horizon-line z-10 pointer-events-none" />
            {/* Glow orbs */}
            <div className="bg-orb bg-orb-teal w-[600px] h-[600px] -top-40 -left-40 fixed opacity-40 pointer-events-none" />
            <div className="bg-orb bg-orb-cyan w-[500px] h-[500px] bottom-0 right-0 fixed opacity-30 pointer-events-none" style={{ animationDelay: '-5s' }} />

            <SharedModals auth={auth} docs={false} />

            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                <TopHeader user={user} onLogout={logout} />

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto px-8 py-10">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div>
                                <div className="inline-flex items-center gap-2 glass-capsule px-4 py-1.5 mb-4 text-xs text-primary">
                                    <Globe className="w-3.5 h-3.5 animate-pulse" />
                                    Public Showcase
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-foreground flex items-center gap-4">
                                    Community <span className="gradient-text">Showcase</span>
                                </h1>
                                <p className="text-muted mt-2 text-sm">Explore, fork, and build upon public projects created by the community.</p>
                            </div>

                            <div className="relative group max-w-md w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search projects, authors or languages..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full glass-input rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none border border-white/10 focus:border-[hsl(var(--text)/0.5)] transition-all hover:border-white/15"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                <p className="text-muted font-medium animate-pulse">Scanning the multiverse for projects...</p>
                            </div>
                        ) : filteredProjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProjects.map((project) => (
                                    <div
                                        key={project.id}
                                        onClick={() => router.push(`/ide/${project.id}`)}
                                        className="group relative glass-card p-6 rounded-2xl border border-white/5 hover:border-[hsl(var(--text)/0.3)] transition-all duration-500 flex flex-col h-full hover:-translate-y-1 cursor-pointer"
                                    >
                                        {/* Language Badge */}
                                        <div className="absolute top-6 right-6 px-3 py-1 rounded-full neu-pill text-[10px] font-bold uppercase tracking-widest text-muted">
                                            {project.language}
                                        </div>

                                        <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--primary)/0.15)] flex items-center justify-center mb-6 border border-[hsl(var(--text)/0.2)] shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            <Boxes className="w-7 h-7 text-primary" />
                                        </div>

                                        <h3 className="text-xl font-black text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-all duration-300">
                                            {project.name || "Untitled Project"}
                                        </h3>

                                        <div className="flex flex-col gap-3 mb-8">
                                            <div className="flex items-center gap-2 text-sm text-muted">
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[hsl(var(--text))] to-[hsl(var(--text-muted))] flex items-center justify-center text-[8px] font-bold text-black">
                                                    {(project.author_name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium">{project.author_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Last seen {new Date(project.last_updated).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex items-center gap-3">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleFork(project.id); }}
                                                disabled={forkingId === project.id}
                                                className="flex-1 neu-button-primary py-3.5 flex items-center justify-center gap-2 text-sm font-bold text-foreground hover:border-[hsl(var(--text)/0.5)] transition-all disabled:opacity-50"
                                            >
                                                {forkingId === project.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-foreground" />
                                                ) : (
                                                    <GitFork className="w-4 h-4" />
                                                )}
                                                {forkingId === project.id ? "Forking..." : "Fork Project"}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); fileApi.downloadAll(project.id); }}
                                                className="w-12 h-12 neu-button flex items-center justify-center text-muted hover:text-primary transition-all"
                                                title="Download ZIP"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 text-center glass-card rounded-2xl border border-dashed border-white/5">
                                <div className="neu-inset w-24 h-24 rounded-2xl flex items-center justify-center mb-6">
                                    <Sparkles className="w-16 h-16 text-faint" />
                                </div>
                                <h2 className="text-2xl font-black text-foreground mb-2">No public projects found</h2>
                                <p className="text-muted max-w-sm">Try searching for something else or be the first to share your project!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
