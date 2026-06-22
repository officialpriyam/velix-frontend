"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Coins, Loader2, Download, Box, AlertCircle, Check, Trash2, Clock, History, ChevronDown, ChevronUp } from 'lucide-react';
import { modelgenApi } from '@/lib/api';
import { useNotification } from '@/components/Notification';

const EXAMPLE_PROMPTS = [
    'A cozy wooden cottage with a stone chimney',
    'A futuristic neon tower with glass walls',
    'A medieval castle with four towers and a drawbridge',
    'A small Japanese shrine surrounded by cherry trees'
];

interface HistoryItem {
    id: number;
    prompt: string;
    method: string;
    credits_used: number;
    schematic_data: string;
    created_at: string;
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function ModelGeneratorPage() {
    const { showNotification } = useNotification();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastGeneratedFile, setLastGeneratedFile] = useState<string | null>(null);
    const [lastGeneratedId, setLastGeneratedId] = useState<number | null>(null);
    const [serviceOnline, setServiceOnline] = useState<boolean | null>(null);
    const [credits, setCredits] = useState<number | null>(null);

    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyExpanded, setHistoryExpanded] = useState(true);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const loadHistory = useCallback(async () => {
        try {
            const data = await modelgenApi.getHistory();
            if (Array.isArray(data)) setHistory(data);
        } catch { /* ignore */ }
        setHistoryLoading(false);
    }, []);

    useEffect(() => {
        modelgenApi.getStatus().then(res => setServiceOnline(res.online)).catch(() => setServiceOnline(false));
        loadHistory();
    }, [loadHistory]);

    const handleGenerate = async () => {
        if (!prompt.trim() || loading) return;
        setLoading(true);
        setLastGeneratedFile(null);
        setLastGeneratedId(null);
        try {
            const result = await modelgenApi.generate(prompt);
            if (result.error) {
                showNotification(result.error, 'error');
            } else {
                setLastGeneratedFile(result.schematicFile);
                setLastGeneratedId(result.id);
                if (result.creditsRemaining !== undefined) setCredits(result.creditsRemaining);
                showNotification(`Model generated! Used ${result.creditsUsed || 50} credits.`, 'success');
                loadHistory();
            }
        } catch (err: any) {
            showNotification(err.message || 'Model generation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadLatest = async () => {
        if (!lastGeneratedFile) return;
        try {
            const blob = await modelgenApi.downloadSchematic(lastGeneratedFile);
            downloadBlob(blob, lastGeneratedFile);
        } catch {
            showNotification('Download failed', 'error');
        }
    };

    const handleDownloadFromHistory = async (item: HistoryItem) => {
        setDownloadingId(item.id);
        try {
            if (item.schematic_data) {
                const blob = await modelgenApi.downloadSchematic(item.schematic_data);
                const safeName = item.prompt.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 40).replace(/-+$/, '');
                downloadBlob(blob, `velix-${safeName}-${item.id}.schem`);
            } else {
                showNotification('No schematic file found', 'error');
            }
        } catch {
            showNotification('Failed to download schematic', 'error');
        }
        setDownloadingId(null);
    };

    const handleDelete = async (id: number) => {
        setDeletingId(id);
        try {
            await modelgenApi.deleteGeneration(id);
            setHistory(prev => prev.filter(h => h.id !== id));
            if (lastGeneratedId === id) {
                setLastGeneratedFile(null);
                setLastGeneratedId(null);
            }
            showNotification('Deleted', 'success');
        } catch {
            showNotification('Failed to delete', 'error');
        }
        setDeletingId(null);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <Link href="/" className="inline-flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors mb-8">
                    <ArrowLeft className="w-3 h-3" /> Back to Home
                </Link>

                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-primary/15 text-primary rounded flex items-center gap-1">
                            <Box className="w-3 h-3" /> Experimental
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Model <span className="text-primary">Generator</span></h1>
                    <p className="text-sm text-muted max-w-lg mx-auto">
                        Turn a single sentence into a Minecraft <code className="px-1.5 py-0.5 text-[10px] font-mono bg-[hsl(var(--surface-sunk))] rounded">.schem</code> file you can import with WorldEdit.
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted">
                        <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-primary" /> 50 credits / build</span>
                        <span className="flex items-center gap-1"><Loader2 className="w-3 h-3" /> ~5-10 min</span>
                    </div>
                </div>

                {serviceOnline === false && (
                    <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-danger">ML Service Offline</p>
                            <p className="text-xs text-muted mt-1">The Minecraft AI Model service is not running. Contact admin to start it.</p>
                        </div>
                    </div>
                )}
                {serviceOnline === true && (
                    <div className="mb-6 p-3 rounded-xl bg-success/10 border border-success/20 flex items-center gap-2 text-xs text-success">
                        <Check className="w-3.5 h-3.5" /> ML Service is online and ready
                    </div>
                )}

                <div className="neu-card rounded-2xl p-6 mb-6">
                    <label className="text-sm font-semibold mb-3 block">Describe what you want to build</label>
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="A medieval stone castle with four towers and a moat..."
                        maxLength={400}
                        className="w-full h-28 px-4 py-3 text-sm rounded-xl bg-[hsl(var(--surface-sunk))] border border-[hsl(var(--surface-sunk))] text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none mb-1"
                    />
                    <p className="text-right text-[10px] text-muted mb-4">{prompt.length}/400</p>

                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted/60 mb-2 block">Try</label>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {EXAMPLE_PROMPTS.map((ex, i) => (
                            <button
                                key={i}
                                onClick={() => setPrompt(ex)}
                                className="px-3 py-1.5 text-[11px] rounded-lg bg-[hsl(var(--surface-sunk))] border border-[hsl(var(--surface-sunk))] hover:border-primary/30 text-muted hover:text-foreground transition-all"
                            >
                                {ex}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || loading || serviceOnline === false}
                        className="w-full py-3 rounded-xl text-sm font-bold bg-primary text-background hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Generating model...</>
                        ) : (
                            <><Box className="w-4 h-4" /> Generate Model</>
                        )}
                    </button>
                </div>

                {lastGeneratedFile && (
                    <div className="neu-card rounded-2xl p-6 animate-in fade-in mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold flex items-center gap-2">
                                <Box className="w-4 h-4 text-primary" /> Generated Schematic
                            </h2>
                            <button onClick={handleDownloadLatest} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary/15 text-primary rounded-lg hover:bg-primary/25 transition-all">
                                <Download className="w-3.5 h-3.5" /> Download .schem
                            </button>
                        </div>
                        <div className="bg-[hsl(var(--surface-sunk))] rounded-xl p-8 text-center">
                            <Box className="w-12 h-12 text-primary/40 mx-auto mb-3" />
                            <p className="text-sm font-medium">Schematic ready!</p>
                            <p className="text-xs text-muted mt-1">
                                Import with WorldEdit: <code className="px-1.5 py-0.5 bg-background/50 rounded font-mono">/schem load</code>
                            </p>
                        </div>
                    </div>
                )}

                <div className="neu-card rounded-2xl mb-6">
                    <button
                        onClick={() => setHistoryExpanded(!historyExpanded)}
                        className="w-full flex items-center justify-between p-5 text-left"
                    >
                        <h2 className="text-sm font-semibold flex items-center gap-2">
                            <History className="w-4 h-4 text-primary" />
                            Generation History
                            {history.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 text-[10px] font-bold bg-primary/15 text-primary rounded-full">
                                    {history.length}
                                </span>
                            )}
                        </h2>
                        {historyExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                    </button>

                    {historyExpanded && (
                        <div className="px-5 pb-5">
                            {historyLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-muted" />
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-8">
                                    <Clock className="w-8 h-8 text-muted/30 mx-auto mb-2" />
                                    <p className="text-xs text-muted">No generations yet. Create your first model above!</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {history.map(item => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--surface-sunk))] hover:bg-[hsl(var(--surface-sunk))]/80 transition-colors group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{item.prompt}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                                        item.method === 'ai'
                                                            ? 'bg-primary/15 text-primary'
                                                            : 'bg-muted/15 text-muted'
                                                    }`}>
                                                        {item.method}
                                                    </span>
                                                    <span className="text-[10px] text-muted flex items-center gap-1">
                                                        <Coins className="w-2.5 h-2.5" /> {item.credits_used}
                                                    </span>
                                                    <span className="text-[10px] text-muted">
                                                        {timeAgo(item.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => handleDownloadFromHistory(item)}
                                                    disabled={downloadingId === item.id}
                                                    className="p-2 rounded-lg text-primary hover:bg-primary/15 transition-all disabled:opacity-50"
                                                    title="Download .schem"
                                                >
                                                    {downloadingId === item.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Download className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    disabled={deletingId === item.id}
                                                    className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-all disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    {deletingId === item.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="neu-card rounded-2xl p-6">
                    <h2 className="text-sm font-semibold mb-3">Tips</h2>
                    <div className="space-y-2 text-xs text-muted">
                        <div className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Be specific about materials, size, and style</div>
                        <div className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Import the <code className="px-1 py-0.5 bg-[hsl(var(--surface-sunk))] rounded font-mono">.schem</code> using WorldEdit: <code className="px-1 py-0.5 bg-[hsl(var(--surface-sunk))] rounded font-mono">/schem load</code></div>
                        <div className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Works best for buildings and small structures (not entire biomes)</div>
                        <div className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Generated structures are 16x16x16 blocks</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
