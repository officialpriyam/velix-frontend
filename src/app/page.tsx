"use client";

import React, { useState, useEffect, Suspense } from 'react';
import {
    Boxes,
    ChevronDown,
    Plus,
    Trash2 as Trash,
    Lock,
    LockOpen as Unlock,
    Clock,
    Edit2,
    Sparkles,
    Pencil,
    Globe,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatPanel } from '@/components/ChatPanel';
import { ModelSelector } from '@/components/ModelSelector';
import { ProjectTypeModal } from '@/components/ProjectTypeModal';
import { TopHeader, useAuth, SharedModals, Footer, cn } from '@/components/AppShell';
import { fileApi, aiApi } from '@/lib/api';

const projectTypeLabels: { [key: string]: string } = {
    'java': 'Java Plugin',
    'kotlin': 'Kotlin Plugin',
    'python': 'Python Bot',
    'javascript': 'JavaScript Bot',
    'typescript': 'TypeScript Bot',
    'ruby': 'Ruby Bot',
    'forge-java': 'Forge Mod',
    'fabric-java': 'Fabric Mod',
    'hytale': 'Hytale Plugin (Alpha)',
};

function HomeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const auth = useAuth();
    const { user, setUser, logout } = auth;

    const [view, setView] = useState(searchParams.get('view') || 'home');
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    const [platform, setPlatform] = useState(() => {
        if (typeof window !== 'undefined') {
            const prefs = JSON.parse(localStorage.getItem('velix_project_type') || '{}');
            return prefs.platform || 'minecraft';
        }
        return 'minecraft';
    });
    const [category, setCategory] = useState(() => {
        if (typeof window !== 'undefined') {
            const prefs = JSON.parse(localStorage.getItem('velix_project_type') || '{}');
            return prefs.category || 'plugins';
        }
        return 'plugins';
    });
    const [language, setLanguage] = useState('java');
    const [isProjectTypeOpen, setIsProjectTypeOpen] = useState(false);

    const [model, setModel] = useState('priyx-ultra');
    const [showModelDropdown, setShowModelDropdown] = useState(false);

    const [greeting, setGreeting] = useState("Hello");
    useEffect(() => {
        const hrs = new Date().getHours();
        if (hrs < 12) setGreeting("Good morning");
        else if (hrs < 18) setGreeting("Good afternoon");
        else setGreeting("Good evening");
    }, []);

    useEffect(() => {
        if (view === 'projects') fetchProjects();
    }, [view]);

    // Close model dropdown on outside click
    useEffect(() => {
        if (!showModelDropdown) return;
        const handler = () => { setShowModelDropdown(false); };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [showModelDropdown]);

    const fetchProjects = async () => {
        setLoadingProjects(true);
        try {
            const data = await fileApi.listSessions();
            setProjects(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch projects');
        } finally {
            setLoadingProjects(false);
        }
    };

    const handleHomePromptSubmit = async (promptText: string) => {
        if (!user) {
            auth.setIsAuthOpen(true);
            return;
        }
        const newId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        router.push(`/ide/${newId}?prompt=${encodeURIComponent(promptText)}&model=${encodeURIComponent(model)}&language=${encodeURIComponent(language)}&platform=${encodeURIComponent(platform)}&category=${encodeURIComponent(category)}`);
    };

    const handleCodeGenerated = (newSessionId: string) => {
        router.push(`/ide/${newSessionId}`);
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (!confirm("Delete this project?")) return;
        try {
            await aiApi.deleteProject(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
        } catch (err) { console.error("Failed to delete", err); }
    };

    const handleToggleVisibility = async (e: React.MouseEvent, projectId: string, currentPublic: boolean) => {
        e.stopPropagation();
        try {
            await aiApi.toggleVisibility(projectId, !currentPublic);
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, is_public: !currentPublic ? 1 : 0 } : p));
        } catch (err) { console.error("Failed", err); }
    };

    const handleRenameProject = async (e: React.MouseEvent, projectId: string, currentName: string) => {
        e.stopPropagation();
        const newName = prompt("Project name:", currentName);
        if (!newName || newName === currentName) return;
        try {
            await aiApi.renameProject(projectId, newName);
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: newName } : p));
        } catch (err) { console.error("Failed", err); }
    };

    const selectedModelName = model === 'priyx-lite' ? 'Priyx Lite' : model === 'priyx-ultra' ? 'Priyx Ultra' : model === 'priyx-max' ? 'Priyx Max' : model;

    const MODEL_TIERS = [
        { id: 'priyx-lite', name: 'Priyx Lite', desc: 'Fast & free', color: 'emerald' },
        { id: 'priyx-ultra', name: 'Priyx Ultra', desc: 'High quality', color: 'primary' },
        { id: 'priyx-max', name: 'Priyx Max', desc: 'Best models', color: 'amber' },
    ];

    return (
        <main className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden font-sans relative">
            {/* Planet horizon glow at bottom */}
            <div className="planet-horizon pointer-events-none" />

            <SharedModals auth={auth} docs={false} />
            <ProjectTypeModal isOpen={isProjectTypeOpen} onClose={() => setIsProjectTypeOpen(false)} onSelect={(plat, cat, lang) => { setPlatform(plat); setCategory(cat); setLanguage(lang); }} />

            {/* Top Header */}
            <TopHeader user={user} onLogout={logout} onLoginClick={() => auth.setIsAuthOpen(true)} />

            {view === 'home' ? (
                <div className="flex-1 flex flex-col items-center justify-between animate-fade-in-up overflow-y-auto">
                    {/* Center content */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full px-6 max-w-3xl mx-auto">
                        {/* Greeting */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-3 tracking-tight">
                                {greeting}, <span className="greeting-gradient font-black">{user ? (user.display_name || user.name) : "guest"}</span>
                            </h1>
                            <p className="text-foreground/40 text-sm font-medium">
                                Stars can only shine in the dark.
                            </p>
                        </div>

                        {/* Chat Input Box */}
                        <div className="w-full max-w-2xl">
                            <div className="rounded-2xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] shadow-2xl transition-all">
                                <ChatPanel
                                    sessionId={null}
                                    onCodeGenerated={handleCodeGenerated}
                                    model={model}
                                    language={language}
                                    platform={platform}
                                    compact={true}
                                    onPromptSubmit={handleHomePromptSubmit}
                                    modelDropdown={
                                        <ModelSelector
                                            selectedModel={model}
                                            onSelectModel={setModel}
                                        />
                                    }
                                    typeDropdown={
                                        <button
                                            onClick={() => setIsProjectTypeOpen(true)}
                                            className="rounded-full border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface-sunk))] px-3 py-1.5 text-xs text-foreground/70 flex items-center gap-1.5 hover:text-foreground transition-all"
                                        >
                                            <Pencil className="w-3 h-3 text-foreground/60" />
                                            <span>{projectTypeLabels[language] || 'Auto'}</span>
                                            <ChevronDown className="w-3 h-3 text-zinc-500" />
                                        </button>
                                    }
                                />
                            </div>

                            {/* Community badge */}
                            <div className="flex items-center justify-center gap-1.5 mt-5 text-[11px] text-foreground/40 font-medium bg-[hsl(var(--surface))]/60 border border-[hsl(var(--surface-sunk))]/60 px-4 py-2 rounded-full w-fit mx-auto">
                                <Globe className="w-3.5 h-3.5 text-foreground/40 mr-1" />
                                <span>Your creations are shared with the community. <Link href="/pricing" className="text-foreground hover:underline">Upgrade to Enterprise</Link> for private projects.</span>
                            </div>

                            {/* Bottom links */}
                            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-foreground/40 font-medium">
                                <Link href="/community" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3" /> Explore Community Plugins
                                </Link>
                                <span className="text-foreground/20">|</span>
                                <button onClick={() => setView('projects')} className="hover:text-foreground transition-colors flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" /> Your Projects
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <Footer />
                </div>
            ) : (
                <div className="flex-1 p-8 max-w-6xl mx-auto w-full animate-fade-in overflow-y-auto flex flex-col justify-between min-h-full">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-black text-foreground">Your Projects</h1>
                            <button
                                onClick={() => setView('home')}
                                className="glass-capsule px-4 py-2 text-xs text-foreground flex items-center gap-2 hover:border-[hsl(var(--text)/0.5)] transition-all"
                            >
                                <Plus className="w-3.5 h-3.5 text-foreground" /> New Project
                            </button>
                        </div>
                        {loadingProjects ? (
                            <div className="flex items-center justify-center py-16 text-foreground/50">Loading...</div>
                        ) : projects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mb-4">
                                    <Boxes className="w-7 h-7 text-foreground/40" />
                                </div>
                                <p className="text-foreground/40 text-sm">No projects yet. Start by describing what you want to build.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projects.map((proj) => (
                                    <div
                                        key={proj.id}
                                        onClick={() => router.push(`/ide/${proj.id}`)}
                                        className="group glass-card p-5 rounded-2xl hover:border-[hsl(var(--text)/0.4)] transition-all cursor-pointer relative"
                                    >
                                        <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button onClick={(e) => handleRenameProject(e, proj.id, proj.name)} className="p-1.5 rounded-lg bg-[hsl(var(--surface-sunk))] text-foreground/50 hover:text-foreground border border-[hsl(var(--surface-sunk))]" title="Rename">
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                             <button onClick={(e) => handleToggleVisibility(e, proj.id, proj.is_public === 1)} className={cn("p-1.5 rounded-lg border border-[hsl(var(--surface-sunk))]", proj.is_public === 1 ? "bg-[hsl(var(--primary)/0.2)] text-foreground" : "bg-[hsl(var(--surface-sunk))] text-foreground/50")} title="Visibility">
                                                {proj.is_public === 1 ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                            </button>
                                             <button onClick={(e) => handleDeleteProject(e, proj.id)} className="p-1.5 rounded-lg bg-[hsl(var(--surface-sunk))] text-foreground/50 hover:text-red-500 border border-[hsl(var(--surface-sunk))]" title="Delete">
                                                <Trash className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--surface-sunk))] flex items-center justify-center mb-4 border border-[hsl(var(--surface-sunk))]">
                                            <Boxes className="w-5 h-5 text-foreground/60" />
                                        </div>
                                        <h3 className="font-bold text-foreground mb-1 truncate pr-8">{proj.name || proj.id}</h3>
                                        <div className="flex items-center gap-3 text-foreground/40 text-xs mt-3">
                                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {proj.last_updated ? new Date(proj.last_updated).toLocaleDateString() : '—'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <Footer />
                </div>
            )}
        </main>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background text-zinc-500">Loading...</div>}>
            <HomeContent />
        </Suspense>
    );
}
