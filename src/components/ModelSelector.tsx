"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, Search, Check, Zap, Cpu, Award } from 'lucide-react';
import { aiApi } from '@/lib/api';

export interface ModelItem {
    id: string;
    name: string;
    description?: string;
    provider?: 'openrouter' | 'nvidia';
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
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        aiApi.getModels().then(data => {
            if (data) {
                if (data.tiers) setTiersData(data.tiers);
                if (data.flat && Array.isArray(data.flat)) setFlatModels(data.flat);
                else if (Array.isArray(data)) setFlatModels(data);
            }
        }).catch(err => console.error('Failed to load models:', err))
        .finally(() => setLoading(false));
    }, []);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handler = () => setIsOpen(false);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [isOpen]);

    const getDisplayName = (id: string) => {
        if (id === 'velix-lite' || id === 'priyx-lite' || id === 'lite') return 'Velix Lite';
        if (id === 'velix-pro' || id === 'priyx-ultra' || id === 'velix-ultra' || id === 'pro' || id === 'ultra') return 'Velix Pro';
        if (id === 'velix-max' || id === 'priyx-max' || id === 'max') return 'Velix Max';
        const found = flatModels.find(m => m.id === id);
        if (found) return found.name || found.id;
        return id.split('/').pop()?.replace(/:free/g, '').replace(/-/g, ' ') || id;
    };

    const filteredModels = flatModels.filter(m => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return m.id.toLowerCase().includes(q) || (m.name && m.name.toLowerCase().includes(q));
    });

    return (
        <div className="relative w-fit" onClick={e => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface-sunk))] px-3 py-1.5 text-xs text-foreground/80 flex items-center gap-1.5 hover:text-foreground hover:bg-[hsl(var(--surface-sunk))]/80 transition-all shadow-sm font-medium"
            >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="truncate max-w-[130px]">{getDisplayName(selectedModel)}</span>
                <ChevronDown className="w-3 h-3 text-muted" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[280px] sm:w-[320px] rounded-2xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] p-2.5 z-50 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    {/* Search bar */}
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
                        {!search.trim() ? (
                            <>
                                {/* Tier Presets Header */}
                                <div className="px-2 py-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                                    Velix Model Tiers
                                </div>
                                {PRESET_TIERS.map(tier => {
                                    const IconComp = tier.icon;
                                    const isSelected = selectedModel === tier.id ||
                                        (tier.id === 'velix-pro' && (selectedModel === 'priyx-ultra' || selectedModel === 'velix-ultra')) ||
                                        (tier.id === 'velix-lite' && selectedModel === 'priyx-lite') ||
                                        (tier.id === 'velix-max' && selectedModel === 'priyx-max');

                                    return (
                                        <button
                                            key={tier.id}
                                            type="button"
                                            onClick={() => {
                                                onSelectModel(tier.id);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2 border ${
                                                isSelected
                                                    ? 'bg-primary/10 border-primary/30 text-foreground font-semibold shadow-sm'
                                                    : 'border-transparent text-foreground/70 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground'
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
                                                        <span className="px-1.5 py-0.2 text-[9px] font-medium bg-[hsl(var(--surface-sunk))] text-muted rounded-full">
                                                            {tier.badge}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-muted mt-0.5 leading-tight">
                                                        {tier.desc}
                                                    </div>
                                                </div>
                                            </div>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-1" />}
                                        </button>
                                    );
                                })}

                                {/* Individual Models List Header */}
                                {flatModels.length > 0 && (
                                    <div className="pt-2 px-2 py-1 text-[10px] font-bold text-muted uppercase tracking-wider flex items-center justify-between">
                                        <span>All Available Models</span>
                                        <span className="text-[9px] font-normal text-muted/60">{flatModels.length} models</span>
                                    </div>
                                )}
                            </>
                        ) : null}

                        {/* Filtered or Flat Model List */}
                        {filteredModels.length > 0 ? (
                            filteredModels.map(m => {
                                const isSelected = selectedModel === m.id;
                                const isFree = m.id.endsWith(':free');
                                const isNvidia = m.provider === 'nvidia' || m.id.startsWith('nvidia/');

                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                            onSelectModel(m.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-all flex items-center justify-between gap-2 ${
                                            isSelected
                                                ? 'bg-primary/10 text-foreground font-bold border border-primary/20'
                                                : 'text-foreground/70 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <Cpu className="w-3.5 h-3.5 text-muted shrink-0" />
                                            <span className="truncate">{m.name || m.id}</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {isFree && (
                                                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-emerald-500/15 text-emerald-400 rounded">
                                                    Free
                                                </span>
                                            )}
                                            {isNvidia && (
                                                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-green-500/15 text-green-400 rounded">
                                                    NVIDIA
                                                </span>
                                            )}
                                            {isSelected && <Check className="w-3 h-3 text-primary ml-1" />}
                                        </div>
                                    </button>
                                );
                            })
                        ) : search.trim() ? (
                            <div className="py-6 text-center text-xs text-muted">
                                No models matching "{search}"
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
