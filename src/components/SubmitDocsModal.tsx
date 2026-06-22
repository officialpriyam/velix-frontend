"use client";

import React, { useState } from 'react';
import { X, BookOpen, Link2, Loader2, CheckCircle2 } from 'lucide-react';

interface SubmitDocsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SubmitDocsModal = ({ isOpen, onClose }: SubmitDocsModalProps) => {
    const [name, setName] = useState('');
    const [docsUrl, setDocsUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/docs/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, docsUrl })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setSuccess(true);
                setName('');
                setDocsUrl('');
            } else {
                setError(data.error || 'Failed to submit document request');
            }
        } catch (err: any) {
            console.error('Submit docs failed:', err);
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md glass-card-strong rounded-3xl overflow-hidden shadow-2xl shadow-[hsl(var(--text)/0.1)] backdrop-blur-xl animate-in zoom-in-95 duration-300 border border-[hsl(var(--surface-sunk))]">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 hover:bg-[hsl(var(--surface-sunk))] rounded-full text-muted hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 neu-raised text-primary rounded-xl flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Request Plugin Docs</h2>
                            <p className="text-xs text-muted uppercase tracking-widest font-semibold mt-0.5">
                                Velix Sync Queue
                            </p>
                        </div>
                    </div>

                    {success ? (
                        <div className="text-center py-6 space-y-4">
                            <div className="flex justify-center">
                                <CheckCircle2 className="w-16 h-16 text-primary animate-bounce" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Request Submitted!</h3>
                            <p className="text-sm text-muted">
                                Thank you! We'll review, vet, and add the API reference to Velix within 2 minutes!
                            </p>
                            <button
                                onClick={() => {
                                    setSuccess(false);
                                    onClose();
                                }}
                                className="mt-6 w-full glass-capsule hover:bg-[hsl(var(--surface-sunk))] text-foreground font-bold py-3.5 rounded-2xl transition-all"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-[hsl(var(--danger)/0.1)] border border-red-500/20 text-danger text-xs p-3 rounded-xl">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted ml-1 tracking-wider">Plugin Name</label>
                                <div className="relative">
                                    <BookOpen className="absolute left-4 top-3.5 w-4 h-4 text-muted" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full glass-input rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--text)/0.5)] transition-all placeholder:text-faint text-foreground"
                                        placeholder="e.g. Vault, LuckPerms, EssentialsX"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted ml-1 tracking-wider">Public Docs URL</label>
                                <div className="relative">
                                    <Link2 className="absolute left-4 top-3.5 w-4 h-4 text-muted" />
                                    <input
                                        type="url"
                                        value={docsUrl}
                                        onChange={(e) => setDocsUrl(e.target.value)}
                                        className="w-full glass-input rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--text)/0.5)] transition-all placeholder:text-faint text-foreground"
                                        placeholder="https://github.com/..."
                                        required
                                    />
                                </div>
                                <span className="text-[9px] text-muted block ml-1 leading-relaxed">
                                    Link to the official API docs, GitHub reference, or developer wiki.
                                </span>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full neu-button-primary disabled:opacity-50 text-foreground font-bold py-4 rounded-2xl mt-6 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Submit Request
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
