"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronDown, Search, Check, Zap, Award } from 'lucide-react';
import { aiApi } from '@/lib/api';

export interface ModelItem {
    id: string;
    name: string;
    description?: string;
    provider?: 'openrouter' | 'nvidia' | 'llmgate' | 'orac' | 'priyx' | 'requesty';
}

export interface ModelTiersData {
    lite?: { id?: string; name: string; description: string; models: ModelItem[] };
    pro?: { id?: string; name: string; description: string; models: ModelItem[] };
    ultra?: { id?: string; name: string; description: string; models: ModelItem[] };
    max?: { id?: string; name: string; description: string; models: ModelItem[] };
}

export interface ModelSelectorProps {
    selectedModel: string;
    onSelectModel: (modelId: string) => void;
    compact?: boolean;
}

const PRESET_TIERS = [
    {
        id: 'velix-lite',
        name: 'Velix Lite',
        badge: 'Free & Fast',
        desc: 'Lightweight free models for quick code tasks',
        color: 'emerald',
        icon: Zap
    },
    {
        id: 'velix-pro',
        name: 'Velix Pro',
        badge: 'Recommended',
        desc: 'High-quality models from OpenRouter & NVIDIA',
        color: 'indigo',
        icon: Sparkles
    },
    {
        id: 'velix-max',
        name: 'Velix Max',
        badge: 'Best Power',
        desc: 'Top-tier models randomly selected across providers',
        color: 'amber',
        icon: Award
    }
];

export function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [tiersData, setTiersData] = useState<ModelTiersData | null>(null);
    const [flatModels, setFlatModels] = useState<ModelItem[]>([]);
    const [expandedTier, setExpandedTier] = useState<string | null>(null);
    const [openUp, setOpenUp] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const getRandomModels = (models: ModelItem[], count: number = 3): ModelItem[] => {
        if (!models || models.length === 0) return [];
        const shuffled = [...models].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, models.length));
    };

    useEffect(() => {
        aiApi.getModels().then(data => {
            if (data) {
                if (data.tiers) setTiersData(data.tiers);
                if (data.flat && Array.isArray(data.flat)) setFlatModels(data.flat);
                else if (Array.isArray(data)) setFlatModels(data);
            }
        }).catch(err => console.error('Failed to load models:', err));
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const handler = () => setIsOpen(false);
        document.addEventListener('click', handler);
        const el = containerRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setOpenUp(false);
        }
        return () => document.removeEventListener('click', handler);
    }, [isOpen]);

    const getDisplayName = (id: string) => {
        if (id === 'velix-lite' || id === 'priyx-lite' || id === 'lite') return 'Velix Lite';
        if (id === 'velix-pro' || id === 'priyx-ultra' || id === 'velix-ultra' || id === 'pro' || id === 'ultra') return 'Velix Pro';
        if (id === 'velix-max' || id === 'priyx-max' || id === 'max') return 'Velix Max';
        if (id === 'llmgate') return 'LLMGATE';
        if (id === 'orac') return 'orac';
        if (id === 'priyx') return 'Priyx';
        if (id === 'requesty') return 'Requesty';
        const found = flatModels.find(m => m.id === id);
        if (found) return found.name || found.id;
        return id.split('/').pop()?.replace(/:free/g, '').replace(/-/g, ' ') || id;
    };

    const specialtyModels = (flatModels.length > 0 ? flatModels : (tiersData?.lite?.models || []))
        .filter((m: any) => ['llmgate', 'orac', 'priyx', 'requesty'].includes(m.provider));

    return (
        <div className="relative w-fit" ref={containerRef} onClick={e => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface-sunk))] px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs text-foreground/80 flex items-center gap-1 flex-shrink-0 hover:text-foreground hover:bg-[hsl(var(--surface-sunk))]/80 transition-all shadow-sm font-medium relative z-50"
            >
                <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary" />
                <span className="truncate max-w-[50px] md:max-w-[90px]">{getDisplayName(selectedModel)}</span>
                <ChevronDown className="w-2.5 h-2.5 md:w-3 md:h-3 text-muted" />
            </button>

            {isOpen && (
                <div className={`absolute left-1/2 -translate-x-1/2 z-[100] w-[240px] sm:w-[280px] rounded-2xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] p-2.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${openUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                    <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search models..."
                            className="w-full bg-[hsl(var(--surface-sunk))] rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none border border-transparent focus:border-primary/40 transition-all font-sans"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
                        <div className="px-2 py-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                            Velix Model Tiers
                        </div>
                        {PRESET_TIERS.map(tier => {
                            const IconComp = tier.icon;
                            const isTierExpanded = expandedTier === tier.id;
                            const tierModels = tiersData && (
                                tier.id === 'velix-lite' ? tiersData.lite?.models :
                                tier.id === 'velix-pro' ? tiersData.pro?.models :
                                tier.id === 'velix-max' ? tiersData.max?.models : []
                            );
                            const displayModels = getRandomModels(tierModels || [], 3);
                            const isSelected = selectedModel === tier.id || displayModels.some(m => m.id === selectedModel);

                            return (
                                <div key={tier.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSelectModel(tier.id);
                                            setExpandedTier(isTierExpanded ? null : tier.id);
                                        }}
                                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2 border ${
                                            isSelected ? 'bg-primary/10 border-primary/30 text-foreground font-semibold shadow-sm' : 'border-transparent text-foreground/70 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                                tier.color === 'emerald' ? 'bg-emerald-500/15 text-emerald-400' :
                                                tier.color === 'indigo' ? 'bg-indigo-500/15 text-indigo-400' :
                                                'bg-amber-500/15 text-amber-400'
                                            }`}>
                                                <IconComp className="w-3.5 h-3.5" />
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-foreground">{tier.name}</span>
                                                    <span className="px-1.5 py-0.2 text-[9px] font-medium bg-[hsl(var(--surface-sunk))] text-muted rounded-full">{tier.badge}</span>
                                                </div>
                                                <div className="text-[10px] text-muted mt-0.5 leading-tight">{tier.desc}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                                        </div>
                                    </button>

                                    {isTierExpanded && displayModels.length > 0 && (
                                        <div className="ml-4 mt-2 space-y-1">
                                            {displayModels.map(m => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => {
                                                        onSelectModel(m.id);
                                                        setIsOpen(false);
                                                        setExpandedTier(null);
                                                    }}
                                                    className={`w-full text-left px-2 py-1 rounded-md text-xs flex items-center justify-between ${selectedModel === m.id ? 'bg-primary/10 text-foreground font-semibold' : 'text-foreground/70 hover:bg-[hsl(var(--surface-sunk))]'}`}
                                                >
                                                    <span className="truncate">{m.name || m.id}</span>
                                                    {m.id.endsWith(':free') && <span className="ml-2 px-1.5 py-0.2 text-[8px] font-bold bg-emerald-500/15 text-emerald-400 rounded">Free</span>}
                                                    {m.provider === 'nvidia' && <span className="ml-2 px-1.5 py-0.2 text-[8px] font-bold bg-green-500/15 text-green-400 rounded">NVIDIA</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {specialtyModels.length > 0 && (
                            <>
                                <div className="px-2 pt-2 pb-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                                    Specialty Providers
                                </div>
                                {specialtyModels.map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                            onSelectModel(m.id);
                                            setIsOpen(false);
                                            setExpandedTier(null);
                                        }}
                                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2 border ${
                                            selectedModel === m.id ? 'bg-primary/10 border-primary/30 text-foreground font-semibold shadow-sm' : 'border-transparent text-foreground/70 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <div className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-violet-500/15 text-violet-400">
                                                <Sparkles className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-foreground">{m.name || m.id}</span>
                                                    <span className="px-1.5 py-0.2 text-[9px] font-medium bg-emerald-500/15 text-emerald-400 rounded-full">Free</span>
                                                </div>
                                                <div className="text-[10px] text-muted mt-0.5 leading-tight">{m.description}</div>
                                            </div>
                                        </div>
                                        {selectedModel === m.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
