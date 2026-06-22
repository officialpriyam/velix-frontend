"use client";

import React, { useState } from 'react';
import { X, Box, MessageSquare, Chrome, Puzzle, Settings, FileCode, Database, Check } from 'lucide-react';

interface ProjectTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (platform: string, category: string, language: string) => void;
}

interface Platform {
    id: string;
    name: string;
    subtitle: string;
    icon: React.ReactNode;
}

interface Category {
    id: string;
    name: string;
    icon: React.ReactNode;
}

interface LanguageOption {
    id: string;
    name: string;
    icon: string;
    description: string;
}

const platforms: Platform[] = [
    { id: 'minecraft', name: 'Minecraft Java', subtitle: '1.8-1.21+', icon: <Box className="w-4 h-4" /> },
    { id: 'hytale', name: 'Hytale (Alpha)', subtitle: 'Unofficial / Preview', icon: <Box className="w-4 h-4 text-orange-500" /> },
    { id: 'discord', name: 'Discord', subtitle: 'Multiple languages', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'chrome', name: 'Chrome Extensions', subtitle: 'Manifest V3', icon: <Chrome className="w-4 h-4" /> },
];

const categories: { [platform: string]: Category[] } = {
    minecraft: [
        { id: 'plugins', name: 'Plugins', icon: <Puzzle className="w-3.5 h-3.5" /> },
        { id: 'mods', name: 'Mods', icon: <Box className="w-3.5 h-3.5" /> },
        { id: 'configuration', name: 'Configuration', icon: <Settings className="w-3.5 h-3.5" /> },
        { id: 'scripting', name: 'Scripting', icon: <FileCode className="w-3.5 h-3.5" /> },
        { id: 'datapacks', name: 'Data Packs', icon: <Database className="w-3.5 h-3.5" /> },
    ],
    hytale: [
        { id: 'plugins', name: 'Plugins', icon: <Puzzle className="w-3.5 h-3.5" /> },
    ],
    discord: [
        { id: 'bots', name: 'Bots', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    ],
    chrome: [
        { id: 'extension', name: 'Extension', icon: <Chrome className="w-3.5 h-3.5" /> },
    ],
};

const languageOptions: { [key: string]: LanguageOption[] } = {
    'minecraft-plugins': [
        { id: 'java', name: 'Bukkit/Spigot/Paper Plugin (Java)', icon: 'J', description: 'Server-side plugins for 1.8-1.21+' },
        { id: 'kotlin', name: 'Bukkit/Spigot/Paper Plugin (Kotlin)', icon: 'K', description: 'Modern plugins written in Kotlin' },
    ],
    'minecraft-mods': [
        { id: 'forge-java', name: 'Forge Mod (Java)', icon: 'F', description: 'Minecraft Forge modding' },
        { id: 'fabric-java', name: 'Fabric Mod (Java)', icon: 'Fa', description: 'Fabric mod loader' },
    ],
    'hytale-plugins': [
        { id: 'hytale', name: 'Hytale Plugin', icon: 'H', description: 'Alpha support for Hytale Server' }
    ],
    'discord-bots': [
        { id: 'python', name: 'Python', icon: 'Py', description: 'discord.py' },
        { id: 'javascript', name: 'JavaScript', icon: 'JS', description: 'discord.js' },
        { id: 'typescript', name: 'TypeScript', icon: 'TS', description: 'discord.js (TS)' },
        { id: 'ruby', name: 'Ruby', icon: 'Rb', description: 'discordrb' },
    ],
    'chrome-extension': [
        { id: 'javascript', name: 'JavaScript', icon: 'JS', description: 'Manifest V3 Extension' },
        { id: 'typescript', name: 'TypeScript', icon: 'TS', description: 'TypeScript with bundler' },
    ],
};

export const ProjectTypeModal = ({ isOpen, onClose, onSelect }: ProjectTypeModalProps) => {
    const [selectedPlatform, setSelectedPlatform] = useState<string>('minecraft');
    const [selectedCategory, setSelectedCategory] = useState<string>('plugins');
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

    if (!isOpen) return null;

    const currentCategories = categories[selectedPlatform] || [];
    const languageKey = `${selectedPlatform}-${selectedCategory}`;
    const currentLanguages = languageOptions[languageKey] || [];

    const handlePlatformChange = (platformId: string) => {
        setSelectedPlatform(platformId);
        const firstCategory = categories[platformId]?.[0]?.id || '';
        setSelectedCategory(firstCategory);
        setSelectedLanguage(null);
    };

    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setSelectedLanguage(null);
    };

    const handleConfirm = () => {
        if (selectedLanguage) {
            onSelect(selectedPlatform, selectedCategory, selectedLanguage);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-3xl glass-card-strong rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--surface-sunk))]">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Select Project Type</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[hsl(var(--surface-sunk))] rounded-lg text-muted hover:text-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex">
                    {/* Platform Sidebar */}
                    <div className="w-56 border-r border-[hsl(var(--surface-sunk))] p-4">
                        <div className="text-[10px] uppercase font-bold text-muted tracking-wider mb-3 flex items-center gap-2">
                            <Box className="w-3 h-3" /> Platform
                        </div>
                        <div className="space-y-1">
                            {platforms.map((platform) => (
                                <button
                                    key={platform.id}
                                    onClick={() => handlePlatformChange(platform.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${selectedPlatform === platform.id
                                        ? 'bg-[hsl(var(--primary)/0.15)] border border-[hsl(var(--text)/0.3)] text-primary'
                                        : 'text-muted hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedPlatform === platform.id ? 'neu-raised text-primary' : 'neu-inset'
                                        }`}>
                                        {platform.icon}
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold">{platform.name}</div>
                                        <div className="text-[10px] text-muted">{platform.subtitle}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="flex-1 p-4">
                        {/* Category Tabs */}
                        <div className="flex gap-1.5 mb-4 flex-wrap">
                            {currentCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryChange(cat.id)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                        selectedCategory === cat.id
                                            ? 'bg-foreground text-background border-foreground'
                                            : 'bg-white/5 text-foreground/70 border-white/10 hover:bg-white/10 hover:text-foreground hover:border-white/20'
                                    }`}
                                >
                                    {cat.icon}
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Language Options */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {currentLanguages.map((lang) => (
                                <button
                                    key={lang.id}
                                    onClick={() => setSelectedLanguage(lang.id)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${selectedLanguage === lang.id
                                        ? 'bg-[hsl(var(--primary)/0.15)] border-2 border-[hsl(var(--text)/0.5)]'
                                        : 'neu-inset border border-[hsl(var(--surface-sunk))] hover:border-[hsl(var(--text)/0.3)]'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${selectedLanguage === lang.id ? 'neu-raised text-primary' : 'neu-raised'
                                        }`}>
                                        {lang.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-foreground">{lang.name}</div>
                                        <div className="text-xs text-muted">{lang.description}</div>
                                    </div>
                                    {selectedLanguage === lang.id && (
                                        <div className="w-6 h-6 rounded-full neu-raised text-primary flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                    )}
                                </button>
                            ))}
                            {currentLanguages.length === 0 && (
                                <div className="text-center py-8 text-muted text-sm">
                                    No options available for this category yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--surface-sunk))]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-medium text-foreground/60 hover:text-foreground border border-white/10 hover:border-white/20 rounded-lg transition-colors"
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedLanguage}
                        className="px-5 py-2 bg-foreground text-background text-xs font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
                    >
                        Confirm Selection
                    </button>
                </div>
            </div>
        </div>
    );
};
