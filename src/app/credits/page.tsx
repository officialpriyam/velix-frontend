"use client";

import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { TopHeader, useAuth, SharedModals, Footer } from '@/components/AppShell';

interface Transaction {
    id: number;
    user_id: string;
    amount: number;
    type: string;
    description: string;
    created_at: string;
}

export default function CreditsPage() {
    const router = useRouter();
    const auth = useAuth();
    const { user, setUser, logout } = auth;

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'credits' | 'tokens'>('credits');

    useEffect(() => {
        const fetchCreditsData = async () => {
            try {
                const profileResult = await authApi.me();
                if (profileResult.user) {
                    setUser(profileResult.user);
                } else {
                    router.push('/');
                    return;
                }

                const creditsResult = await authApi.getCredits();
                if (creditsResult.transactions) {
                    setTransactions(creditsResult.transactions);
                }
            } catch (err) {
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        fetchCreditsData();
    }, []);

    const addedCredits = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

    const usedCredits = Math.abs(
        transactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + t.amount, 0)
    );

    const formatTime = (timeStr: string) => {
        const d = new Date(timeStr);
        return d.toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    const mockTokenUsage = [
        { model: "anthropic/claude-3.5-sonnet", input: 2450, output: 890, tokens: 3340, cost: "1.25 credits", date: new Date(Date.now() - 3600000 * 2).toISOString() },
        { model: "nvidia/llama-3.1-405b", input: 1200, output: 450, tokens: 1650, cost: "0.85 credits", date: new Date(Date.now() - 3600000 * 5).toISOString() },
        { model: "meta-llama/llama-3-70b-instruct", input: 4100, output: 1980, tokens: 6080, cost: "2.10 credits", date: new Date(Date.now() - 3600000 * 24).toISOString() },
        { model: "openai/gpt-4o", input: 890, output: 210, tokens: 1100, cost: "0.50 credits", date: new Date(Date.now() - 3600000 * 48).toISOString() }
    ];

    return (
        <main className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden font-sans relative">
            {/* Planet horizon */}
            <div className="planet-horizon pointer-events-none" />

            <SharedModals auth={auth} docs={false} />

            <TopHeader user={user} onLogout={logout} onLoginClick={() => auth.setIsAuthOpen(true)} />

            <div className="flex-1 overflow-y-auto flex flex-col justify-between min-h-full relative z-10">
                <section className="max-w-5xl mx-auto px-6 pt-10 pb-12 w-full">
                        {/* Main Header Block */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">Credit history</h1>
                                <p className="text-foreground/40 text-xs">
                                    Every credit added or used on your account, to the exact decimal.
                                </p>
                            </div>
                            <div className="flex p-0.5 bg-[hsl(var(--surface))] border border-[hsl(var(--surface-sunk))] rounded-xl w-fit">
                                <button
                                    onClick={() => setActiveTab('credits')}
                                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'credits' ? 'bg-[hsl(var(--surface-sunk))] text-foreground' : 'text-foreground/40 hover:text-foreground/70'}`}
                                >
                                    Credits
                                </button>
                                <button
                                    onClick={() => setActiveTab('tokens')}
                                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'tokens' ? 'bg-[hsl(var(--surface-sunk))] text-foreground' : 'text-foreground/40 hover:text-foreground/70'}`}
                                >
                                    Tokens
                                </button>
                            </div>
                        </div>

                        {/* Minimalist Stats List */}
                        <div className="flex gap-16 mb-10 border-b border-[hsl(var(--surface-sunk))]/30 pb-6">
                            <div>
                                <div className="text-[10px] text-foreground/40 font-extrabold uppercase tracking-wider mb-1">Balance</div>
                                <div className="text-3xl font-bold text-foreground">{user ? user.credits : 0}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-foreground/40 font-extrabold uppercase tracking-wider mb-1">Added</div>
                                <div className="text-3xl font-bold text-green-500">+{addedCredits}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-foreground/40 font-extrabold uppercase tracking-wider mb-1">Used</div>
                                <div className="text-3xl font-bold text-red-500">-{usedCredits}</div>
                            </div>
                        </div>

                        {/* Transactions Ledger Container */}
                        <div className="rounded-2xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] overflow-hidden">
                            <div className="px-5 py-4 border-b border-[hsl(var(--surface-sunk))] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground text-sm">Transactions</span>
                                    <span className="text-[10px] text-zinc-600 font-medium">(V3 credits)</span>
                                </div>
                                <a
                                    href="/pricing"
                                    className="rounded-full border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] px-3 py-1 text-[10px] font-bold text-foreground/70 hover:text-foreground transition-all"
                                >
                                    Buy More Credits
                                </a>
                            </div>

                            {loading ? (
                                <div className="p-16 text-center text-foreground/40 text-xs">
                                    <div className="w-5 h-5 border-2 border-[hsl(var(--text))] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    Fetching transactions...
                                </div>
                            ) : !user ? (
                                <div className="p-12 text-center text-foreground/40 text-xs">
                                    <AlertCircle className="w-5 h-5 mx-auto mb-2 text-foreground/40" />
                                    Please log in to view credit histories.
                                </div>
                            ) : activeTab === 'credits' ? (
                                transactions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                                        <div className="w-10 h-10 rounded-xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))]/40 flex items-center justify-center mb-4 text-foreground/40">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <p className="text-zinc-400 text-xs font-semibold max-w-sm">No transactions yet. Start generating to see your credit activity here.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="border-b border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface-sunk)/0.5)] text-foreground/40 font-bold uppercase text-[10px]">
                                                    <th className="p-4">Transaction ID</th>
                                                    <th className="p-4">Timestamp</th>
                                                    <th className="p-4">Operation Type</th>
                                                    <th className="p-4">Description</th>
                                                    <th className="p-4 text-right">Credits Adjustment</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[hsl(var(--surface-sunk))]/50">
                                                {transactions.map((tx) => (
                                                    <tr key={tx.id} className="hover:bg-[hsl(var(--surface-sunk))] transition-colors">
                                                        <td className="p-4 text-foreground/40 font-mono">TX-{1000 + tx.id}</td>
                                                        <td className="p-4 text-foreground/40">{formatTime(tx.created_at)}</td>
                                                        <td className="p-4">
                                                            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                                tx.type === 'purchase'
                                                                    ? "bg-green-500/10 text-green-400"
                                                                    : tx.type === 'bonus'
                                                                    ? "bg-[hsl(var(--text)/0.1)] text-foreground"
                                                                    : "bg-red-500/10 text-red-400"
                                                            }`}>
                                                                {tx.type}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-foreground/70 font-medium">{tx.description}</td>
                                                        <td className={`p-4 text-right font-extrabold text-xs ${
                                                            tx.amount > 0 ? "text-green-500" : "text-red-500"
                                                        }`}>
                                                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="border-b border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface-sunk)/0.5)] text-foreground/40 font-bold uppercase text-[10px]">
                                                <th className="p-4">Endpoint Model</th>
                                                <th className="p-4">Prompt Tokens</th>
                                                <th className="p-4">Completion Tokens</th>
                                                <th className="p-4">Total Tokens</th>
                                                <th className="p-4 text-right">Deducted Credits</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[hsl(var(--surface-sunk))]/50">
                                            {mockTokenUsage.map((tk, idx) => (
                                                <tr key={idx} className="hover:bg-[hsl(var(--surface-sunk))] transition-colors">
                                                    <td className="p-4 text-foreground/70 font-mono font-medium">{tk.model}</td>
                                                    <td className="p-4 text-foreground/40 font-mono">{tk.input.toLocaleString()}</td>
                                                    <td className="p-4 text-foreground/40 font-mono">{tk.output.toLocaleString()}</td>
                                                    <td className="p-4 text-foreground/70 font-mono font-bold">{tk.tokens.toLocaleString()}</td>
                                                    <td className="p-4 text-right font-bold text-foreground/70">{tk.cost}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                </section>
                <Footer />
            </div>
        </main>
    );
}
