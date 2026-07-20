"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Loader2, Download, Wand2, Image, Box, Database,
    Sparkles, Coins, ChevronRight, Zap, RotateCcw
} from 'lucide-react';
import { useNotification } from '@/components/Notification';

type Category = 'textures' | 'models' | 'builds';
type SchematicMode = 'fast' | 'craft';

interface GenResult {
    file: string;
    download_url: string;
    preview_url: string;
    [key: string]: any;
}

const CATEGORIES: { id: Category; name: string; icon: React.ReactNode; desc: string; color: string }[] = [
    { id: 'textures', name: 'Textures', icon: <Image className="w-5 h-5" />, desc: 'Pixel art textures (16-64px)', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    { id: 'models', name: '3D Models', icon: <Box className="w-5 h-5" />, desc: 'Blockbench .bbmodel files', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
    { id: 'builds', name: 'Builds', icon: <Database className="w-5 h-5" />, desc: 'WorldEdit .schem structures', color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
];

const SUGGESTIONS: Record<Category, string[]> = {
    textures: [
        'A diamond sword with enchanted glow',
        'A wooden shield with iron trim',
        'A golden apple with particle effects',
        'A nether portal frame block',
        'A custom music disc design',
        'A mystical staff with runes',
    ],
    models: [
        'A medieval knight with sword and shield',
        'A dragon with spread wings',
        'A robot mech suit',
        'A wizard with a staff',
        'A tree with glowing mushrooms',
        'A treasure chest overflowing with gold',
    ],
    builds: [
        'A cozy wooden cottage with a garden',
        'A medieval castle with four towers',
        'A futuristic neon tower',
        'A Japanese shrine with cherry trees',
        'A underwater temple ruin',
        'A floating sky island',
    ],
};

const RESOLUTIONS = [16, 32, 64];
const SIZES = [32, 48, 64, 96, 128];

export default function StudioPage() {
    const { showNotification } = useNotification();
    const [category, setCategory] = useState<Category>('textures');
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<GenResult | null>(null);
    const [error, setError] = useState('');

    const [resolution, setResolution] = useState(32);
    const [texType, setTexType] = useState<'item' | 'block'>('item');
    const [schematicSize, setSchematicSize] = useState(48);
    const [schematicMode, setSchematicMode] = useState<SchematicMode>('fast');

    const handleGenerate = async () => {
        if (!prompt.trim() || loading) return;
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
            let endpoint = '';
            let body: any = {};

            if (category === 'textures') {
                endpoint = `${apiBase}/generator/texture`;
                body = { prompt, resolution, type: texType };
            } else if (category === 'models') {
                endpoint = `${apiBase}/generator/model`;
                body = { prompt, texture_ref: 'texture.png' };
            } else {
                endpoint = `${apiBase}/generator/schematic`;
                body = { prompt, size: schematicSize, mode: schematicMode };
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (data.error) {
                setError(data.error);
                showNotification(data.error, 'error');
            } else {
                setResult(data);
                showNotification('Generated successfully!', 'success');
            }
        } catch (err: any) {
            const msg = err.message || 'Generation failed';
            setError(msg);
            showNotification(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;
        const a = document.createElement('a');
        a.href = result.download_url;
        a.download = result.file;
        a.click();
    };

    const handleReset = () => {
        setResult(null);
        setError('');
        setPrompt('');
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-5xl mx-auto px-6 py-10">
                {/* Back */}
                <Link href="/" className="inline-flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors mb-8">
                    <ArrowLeft className="w-3 h-3" /> Back to Home
                </Link>

                {/* Hero */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
                        Imagine it. <span className="text-foreground/40">Generate it.</span>
                    </h1>
                    <p className="text-sm text-muted max-w-md mx-auto">
                        Turn your ideas into Minecraft textures, 3D models, and schematics with AI.
                    </p>
                </div>

                {/* Category Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => { setCategory(cat.id); setResult(null); setError(''); }}
                            className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
                                category === cat.id
                                    ? 'bg-foreground text-background border-foreground shadow-lg scale-[1.02]'
                                    : 'bg-[hsl(var(--surface-sunk))] border-[hsl(var(--surface-sunk))] hover:border-foreground/20 text-foreground'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${category === cat.id ? 'bg-background/15' : cat.color}`}>
                                    {cat.icon}
                                </div>
                                <div>
                                    <div className="text-sm font-bold">{cat.name}</div>
                                    <div className={`text-[10px] ${category === cat.id ? 'text-background/60' : 'text-muted'}`}>{cat.desc}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Suggestion Chips */}
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTIONS[category].map((s, i) => (
                            <button
                                key={i}
                                onClick={() => setPrompt(s)}
                                className="px-3 py-1.5 text-[11px] rounded-lg bg-[hsl(var(--surface-sunk))] border border-[hsl(var(--surface-sunk))] hover:border-foreground/20 text-muted hover:text-foreground transition-all"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Options + Prompt + Generate */}
                <div className="rounded-2xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface-sunk))]/50 p-5 mb-6">
                    {/* Category-specific options */}
                    {category === 'textures' && (
                        <div className="flex gap-3 mb-4">
                            <div>
                                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Resolution</label>
                                <div className="flex gap-1.5 mt-1.5">
                                    {RESOLUTIONS.map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setResolution(r)}
                                            className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                                                resolution === r
                                                    ? 'bg-foreground text-background border-foreground'
                                                    : 'bg-background/50 text-muted border-[hsl(var(--surface-sunk))] hover:border-foreground/20'
                                            }`}
                                        >
                                            {r}x{r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Type</label>
                                <div className="flex gap-1.5 mt-1.5">
                                    {(['item', 'block'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTexType(t)}
                                            className={`px-3 py-1.5 text-xs rounded-lg border capitalize transition-all ${
                                                texType === t
                                                    ? 'bg-foreground text-background border-foreground'
                                                    : 'bg-background/50 text-muted border-[hsl(var(--surface-sunk))] hover:border-foreground/20'
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {category === 'builds' && (
                        <div className="flex gap-3 mb-4">
                            <div>
                                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Max Size</label>
                                <div className="flex gap-1.5 mt-1.5">
                                    {SIZES.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setSchematicSize(s)}
                                            className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                                                schematicSize === s
                                                    ? 'bg-foreground text-background border-foreground'
                                                    : 'bg-background/50 text-muted border-[hsl(var(--surface-sunk))] hover:border-foreground/20'
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Mode</label>
                                <div className="flex gap-1.5 mt-1.5">
                                    <button
                                        onClick={() => setSchematicMode('fast')}
                                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                                            schematicMode === 'fast'
                                                ? 'bg-foreground text-background border-foreground'
                                                : 'bg-background/50 text-muted border-[hsl(var(--surface-sunk))] hover:border-foreground/20'
                                        }`}
                                    >
                                        <Zap className="w-3 h-3 inline mr-1" />Fast
                                    </button>
                                    <button
                                        onClick={() => setSchematicMode('craft')}
                                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                                            schematicMode === 'craft'
                                                ? 'bg-foreground text-background border-foreground'
                                                : 'bg-background/50 text-muted border-[hsl(var(--surface-sunk))] hover:border-foreground/20'
                                        }`}
                                    >
                                        <Sparkles className="w-3 h-3 inline mr-1" />Craft
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Prompt Input */}
                    <div className="flex gap-2">
                        <input
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !loading && handleGenerate()}
                            placeholder={`Describe your ${category === 'textures' ? 'texture' : category === 'models' ? '3D model' : 'build'}...`}
                            className="flex-1 px-4 py-3 text-sm rounded-xl bg-background border border-[hsl(var(--surface-sunk))] text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt.trim()}
                            className="flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl bg-foreground text-background hover:opacity-90 transition-all disabled:opacity-40 shrink-0"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Wand2 className="w-4 h-4" />
                            )}
                            Generate
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
                        {error}
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="rounded-2xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface-sunk))]/50 p-6 animate-in fade-in-up mb-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-foreground/60" />
                                Generated {category === 'textures' ? 'Texture' : category === 'models' ? '3D Model' : 'Schematic'}
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[hsl(var(--surface-sunk))] text-muted hover:text-foreground hover:border-foreground/20 transition-all"
                                >
                                    <RotateCcw className="w-3 h-3" /> New
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-foreground text-background hover:opacity-90 transition-all"
                                >
                                    <Download className="w-3.5 h-3.5" /> Download
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                            {Object.entries(result)
                                .filter(([k]) => !['file', 'download_url', 'preview_url'].includes(k))
                                .map(([k, v]) => (
                                    <div key={k} className="p-3 rounded-xl bg-background border border-[hsl(var(--surface-sunk))] text-center">
                                        <div className="text-base font-bold">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
                                        <div className="text-[10px] text-muted uppercase mt-0.5">{k.replace(/_/g, ' ')}</div>
                                    </div>
                                ))}
                        </div>

                        {/* Preview */}
                        {category === 'textures' && result.preview_url && (
                            <div className="flex justify-center p-6 rounded-xl bg-background border border-[hsl(var(--surface-sunk))]">
                                <img
                                    src={result.preview_url}
                                    alt="Generated texture"
                                    className="max-h-64 rounded-lg"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                            </div>
                        )}

                        {category !== 'textures' && (
                            <div className="p-6 rounded-xl bg-background border border-[hsl(var(--surface-sunk))] text-center">
                                <Box className="w-10 h-10 text-muted/30 mx-auto mb-2" />
                                <p className="text-xs text-muted">File ready for download</p>
                                <p className="text-[10px] text-muted/60 mt-1 font-mono">{result.file}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tips */}
                {!result && !loading && (
                    <div className="rounded-2xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface-sunk))]/30 p-5">
                        <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Tips</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-start gap-2 text-xs text-muted/70">
                                <ChevronRight className="w-3 h-3 mt-0.5 text-foreground/40 shrink-0" />
                                Be specific about materials, size, and style
                            </div>
                            <div className="flex items-start gap-2 text-xs text-muted/70">
                                <ChevronRight className="w-3 h-3 mt-0.5 text-foreground/40 shrink-0" />
                                Use &quot;Craft&quot; mode for image-based 3D conversion
                            </div>
                            <div className="flex items-start gap-2 text-xs text-muted/70">
                                <ChevronRight className="w-3 h-3 mt-0.5 text-foreground/40 shrink-0" />
                                Builds support up to 128x128x128 voxels
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
