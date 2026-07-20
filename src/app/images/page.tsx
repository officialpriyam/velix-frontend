"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Coins, Loader2, Download, Sparkles, Image as ImageIcon } from 'lucide-react';
import { imageApi } from '@/lib/api';
import { useNotification } from '@/components/Notification';

const ASPECT_RATIOS = [
    { id: '1:1', width: 1024, height: 1024, label: 'Square', group: 'SQUARE' },
    { id: '3:2', width: 1216, height: 832, label: '3:2', group: 'LANDSCAPE' },
    { id: '4:3', width: 1152, height: 864, label: '4:3', group: 'LANDSCAPE' },
    { id: '5:4', width: 1120, height: 896, label: '5:4', group: 'LANDSCAPE' },
    { id: '16:9', width: 1344, height: 768, label: '16:9', group: 'LANDSCAPE' },
    { id: '21:9', width: 1536, height: 672, label: '21:9', group: 'LANDSCAPE', tag: 'CINEMATIC' },
    { id: '2:3', width: 832, height: 1216, label: '2:3', group: 'PORTRAIT' },
    { id: '3:4', width: 864, height: 1152, label: '3:4', group: 'PORTRAIT' },
    { id: '4:5', width: 896, height: 1088, label: '4:5', group: 'PORTRAIT' },
    { id: '9:16', width: 768, height: 1344, label: '9:16', group: 'PORTRAIT' },
];

export default function ImagesPage() {
    const { showNotification } = useNotification();
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [loading, setLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [credits, setCredits] = useState<number | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim() || loading) return;
        setLoading(true);
        setGeneratedImage(null);
        try {
            const result = await imageApi.generate(prompt, aspectRatio);
            if (result.error) {
                showNotification(result.error, 'error');
            } else {
                setGeneratedImage(result.imageUrl);
                if (result.creditsRemaining !== undefined) setCredits(result.creditsRemaining);
                showNotification(`Image generated! Used ${result.creditsUsed || 3} credits.`, 'success');
            }
        } catch (err: any) {
            showNotification(err.message || 'Image generation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!generatedImage) return;
        const a = document.createElement('a');
        a.href = generatedImage;
        a.download = `velix-image-${Date.now()}.png`;
        a.click();
    };

    const grouped = ASPECT_RATIOS.reduce((acc, r) => {
        if (!acc[r.group]) acc[r.group] = [];
        acc[r.group].push(r);
        return acc;
    }, {} as Record<string, typeof ASPECT_RATIOS>);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <Link href="/" className="inline-flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors mb-8">
                    <ArrowLeft className="w-3 h-3" /> Back to Home
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-primary/15 text-primary rounded">Experimental</span>
                        </div>
                        <h1 className="text-3xl font-bold">Generate <span className="text-primary">Image</span></h1>
                    </div>
                    {credits !== null && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold neu-card rounded-lg">
                            <Coins className="w-3.5 h-3.5 text-primary" /> {credits}
                        </div>
                    )}
                </div>

                <div className="neu-card rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold">Create AI Image</h2>
                        <span className="text-[10px] font-bold text-muted">3 credits per image</span>
                    </div>

                    <label className="text-xs font-medium text-muted mb-2 block">Describe your image</label>
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Example: Diamond sword with purple enchantment glow, floating in the air, dark background, minecraft style"
                        className="w-full h-24 px-4 py-3 text-sm rounded-xl bg-[hsl(var(--surface-sunk))] border border-[hsl(var(--surface-sunk))] text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none mb-2"
                    />
                    <p className="text-[10px] text-muted mb-6">Be specific about what you want to see</p>

                    <label className="text-xs font-medium text-muted mb-3 block">Aspect Ratio</label>
                    {Object.entries(grouped).map(([group, ratios]) => (
                        <div key={group} className="mb-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted/60 mb-2">{group}</p>
                            <div className="flex flex-wrap gap-2">
                                {ratios.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => setAspectRatio(r.id)}
                                        className={`relative flex flex-col items-center justify-center rounded-xl border transition-all ${
                                            aspectRatio === r.id
                                                ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(45,212,191,0.15)]'
                                                : 'border-[hsl(var(--surface-sunk))] hover:border-primary/30 bg-[hsl(var(--surface-sunk))]'
                                        }`}
                                        style={{ width: Math.min(100, r.width / 12), height: Math.min(80, r.height / 12) }}
                                    >
                                        {r.tag && (
                                            <span className="absolute -top-2 right-0 px-1.5 py-0.5 text-[8px] font-bold bg-primary/20 text-primary rounded">
                                                {r.tag}
                                            </span>
                                        )}
                                        {aspectRatio === r.id && (
                                            <span className="absolute -top-2 left-0 px-1.5 py-0.5 text-[8px] font-bold bg-primary text-background rounded">
                                                DEFAULT
                                            </span>
                                        )}
                                        <div className="w-6 h-6 rounded bg-foreground/20 mb-1" />
                                        <span className="text-[10px] font-bold">{r.label}</span>
                                        <span className="text-[8px] text-muted">{r.width}x{r.height}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || loading}
                        className="w-full mt-4 py-3 rounded-xl text-sm font-bold bg-primary text-background hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                        ) : (
                            <><Sparkles className="w-4 h-4" /> Generate Image</>
                        )}
                    </button>
                </div>

                {generatedImage && (
                    <div className="neu-card rounded-2xl p-6 animate-in fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold">Generated Image</h2>
                            <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary/15 text-primary rounded-lg hover:bg-primary/25 transition-all">
                                <Download className="w-3.5 h-3.5" /> Download
                            </button>
                        </div>
                        <img src={generatedImage} alt={prompt} className="w-full rounded-xl border border-[hsl(var(--surface-sunk))]" />
                    </div>
                )}

                <div className="neu-card rounded-2xl p-6 mt-6">
                    <h2 className="text-sm font-semibold mb-3">Tips</h2>
                    <div className="space-y-2 text-xs text-muted">
                        <div className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Be specific about style, lighting, and composition</div>
                        <div className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Mention &quot;minecraft style&quot; or &quot;pixel art&quot; for game assets</div>
                        <div className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Square ratio works best for item icons and textures</div>
                        <div className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Use landscape ratios for banners and screenshots</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
