"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, HelpCircle, Sparkles, CreditCard, ChevronDown, MessageSquare, AlertCircle, Coins, X } from 'lucide-react';
import { authApi } from '@/lib/api';
import { MatrixRain } from '@/components/MatrixRain';
import { TopHeader, useAuth, SharedModals } from '@/components/AppShell';

interface PricingPack {
    name: string;
    price: string;
    priceNum: number;
    credits: number;
    description: string;
    features: string[];
    popular?: boolean;
    buttonText: string;
}

interface PricingConfigResponse {
    plans: PricingPack[];
    payment_gateway: {
        enabled: boolean;
        provider: string;
        discord_invite_url?: string;
    };
}

export default function PricingPage() {
    const router = useRouter();
    const auth = useAuth();
    const { user, setUser, logout } = auth;

    const [loading, setLoading] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [plans, setPlans] = useState<PricingPack[]>([]);
    const [paymentGateway, setPaymentGateway] = useState<{ enabled: boolean; provider: string; discord_invite_url?: string }>({ enabled: false, provider: '', discord_invite_url: 'https://discord.gg/FD6QrzeATb' });
    const [loadingPlans, setLoadingPlans] = useState(true);

    useEffect(() => {
        const loadPricing = async () => {
            try {
                const data = await authApi.getPricingConfig() as PricingConfigResponse;
                setPlans(data.plans || []);
                setPaymentGateway(data.payment_gateway || { enabled: false, provider: '', discord_invite_url: 'https://discord.gg/FD6QrzeATb' });
            } catch (err) {
                console.error('Failed to load pricing config', err);
            } finally {
                setLoadingPlans(false);
            }
        };

        loadPricing();
    }, []);

    const handlePurchase = async (pack: PricingPack) => {
        if (!user) {
            auth.setIsAuthOpen(true);
            setErrorMessage("Please log in or register to purchase credit packages.");
            return;
        }

        try {
            const pricingState = await authApi.getPricingConfig() as PricingConfigResponse;
            const gateway = pricingState.payment_gateway || { enabled: false, provider: '', discord_invite_url: 'https://discord.gg/FD6QrzeATb' };
            if (!gateway.enabled) {
                window.open(gateway.discord_invite_url || 'https://discord.gg/FD6QrzeATb', '_blank', 'noopener,noreferrer');
                setSuccessMessage(`No payment gateway is configured. Please join our Discord to request access to the ${pack.name} plan.`);
                return;
            }
        } catch (error) {
            console.error('Failed to verify pricing gateway', error);
        }

        setLoading(pack.name);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const result = await authApi.buyCredits(pack.credits, pack.name);
            if (result.success) {
                setUser(result.user);
                setSuccessMessage(`Successfully purchased "${pack.name}"! Added ${pack.credits} credits to your account.`);
                setTimeout(() => setSuccessMessage(null), 8000);
            } else {
                setErrorMessage(result.error || "Failed to complete transaction.");
            }
        } catch (error: any) {
            setErrorMessage(error.message || "An error occurred.");
        } finally {
            setLoading(null);
        }
    };

    const packages = plans.length > 0 ? plans : [
        {
            name: "Free",
            price: "$0",
            priceNum: 0,
            credits: 100,
            description: "Perfect for testing and small personal projects",
            features: [
                "100 initial free credits",
                "Standard speed AI generation",
                "Access to Minecraft & Discord templates",
                "Community support channel"
            ],
            buttonText: "Registered Default"
        }
    ];

    const handlePlanAction = async (pack: PricingPack) => {
        if (!paymentGateway.enabled) {
            window.open(paymentGateway.discord_invite_url || 'https://discord.gg/FD6QrzeATb', '_blank', 'noopener,noreferrer');
            setSuccessMessage(`No payment gateway is configured. Please join our Discord to request access to the ${pack.name} plan.`);
            return;
        }

        await handlePurchase(pack);
    };

    const faqs = [
        {
            q: "What are credits used for?",
            a: "Credits are spent when you generate code, enhance prompts, or auto-compile projects. Standard AI generations cost 5 credits per transaction. Compiling or running your projects is free inside your sandbox container."
        },
        {
            q: "How do I add credits to my account?",
            a: "You can purchase any of our credits packages above, which credits your balance immediately. Alternatively, you can copy your affiliate link in Settings and invite developers to earn 50 bonus credits per signup."
        },
        {
            q: "Do purchased credits expire?",
            a: "No! All credits purchased or earned from referrals are added to your balance permanently and do not expire. You can consume them at your own pace."
        },
        {
            q: "Can I use my own API keys?",
            a: "Yes. In the settings page, premium users can configure their own OpenRouter or NVIDIA API keys. When custom keys are used, AI generations will not consume your credits balance."
        },
        {
            q: "What is your refund policy?",
            a: "Because our sandbox instantly runs AI generations and allocates server cycles, we generally do not offer refunds once credits are consumed. If you face any technical issues, please contact support."
        }
    ];

    return (
        <main className="flex h-screen bg-background text-foreground overflow-hidden font-sans relative">
            <MatrixRain />
            {/* Horizon line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] horizon-line z-10 pointer-events-none" />
            {/* Glow orbs */}
            <div className="bg-orb bg-orb-teal w-[600px] h-[600px] -top-40 left-1/3 fixed opacity-40 pointer-events-none" />
            <div className="bg-orb bg-orb-cyan w-[500px] h-[500px] bottom-0 right-10 fixed opacity-30 pointer-events-none" style={{ animationDelay: '-5s' }} />

            <SharedModals auth={auth} docs={false} />

            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                <TopHeader user={user} onLogout={logout} />

                <div className="flex-1 overflow-y-auto">
                    <section className="max-w-6xl mx-auto px-6 pt-10 pb-20">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[hsl(var(--text)/0.3)] bg-[hsl(var(--primary)/0.15)] text-primary text-xs font-bold uppercase tracking-wider mb-4 animate-pulse">
                                <Sparkles className="w-3.5 h-3.5" />
                                Mock Billing Sandbox
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
                                Buy Credits, Power Your <span className="gradient-text">IDE Sandbox</span>
                            </h1>
                            <p className="text-muted text-base max-w-xl mx-auto">
                                Scale your generations with high-speed compiler access. Add credits to your balance instantly using our mock billing environment.
                            </p>
                        </div>

                        {/* Notifications */}
                        {successMessage && (
                            <div className="max-w-3xl mx-auto mb-8 p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-success text-sm flex items-center gap-3 animate-fade-in">
                                <Check className="w-4 h-4 text-success shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                        )}
                        {errorMessage && (
                            <div className="max-w-3xl mx-auto mb-8 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-danger text-sm flex items-center gap-3 animate-fade-in">
                                <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Pricing Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                            {packages.map((pack, idx) => (
                                <div
                                    key={`${pack.name}-${idx}`}
                                    style={pack.popular ? { background: 'hsl(var(--primary) / 0.10)' } : undefined}
                                    className={`rounded-2xl relative transition-all duration-300 flex flex-col p-6 overflow-hidden ${
                                        pack.popular
                                            ? "neu-card shadow-2xl scale-[1.02] md:scale-[1.04] z-10"
                                            : "neu-card hover:border-zinc-700/80 hover:scale-[1.01]"
                                    }`}
                                >
                                    {pack.popular && (
                                        <div className="absolute top-0 right-0 neu-button-primary text-foreground font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow-lg">
                                            Popular Pack
                                        </div>
                                    )}

                                    <h3 className="text-xl font-bold text-foreground mb-1.5">{pack.name}</h3>
                                    <p className="text-muted text-xs min-h-[32px] mb-4">{pack.description}</p>

                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="text-4xl font-extrabold text-foreground">{pack.price}</span>
                                        {pack.priceNum > 0 && <span className="text-muted text-xs font-semibold">one-time</span>}
                                    </div>

                                    <div className="px-3.5 py-2.5 rounded-xl neu-inset flex items-center justify-between mb-6">
                                        <span className="text-muted text-xs font-medium">Credits Included:</span>
                                        <span className="text-primary text-sm font-black flex items-center gap-1">
                                            <Coins className="w-4 h-4" /> {pack.credits.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex-1 mb-6">
                                        <ul className="space-y-2.5 text-xs text-muted">
                                            {pack.features.map((feat, fIdx) => (
                                                <li key={fIdx} className="flex items-start gap-2">
                                                    <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {pack.priceNum === -1 ? (
                                        <a
                                            href="https://github.com/CodellaAI/codella-documentations"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full py-3 rounded-xl neu-button text-foreground transition-colors font-bold text-xs flex items-center justify-center gap-2"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5 text-primary" />
                                            Contact Support
                                        </a>
                                    ) : (
                                        <button
                                            onClick={() => handlePlanAction(pack)}
                                            disabled={loading !== null || pack.priceNum === 0}
                                            className={`w-full py-3 rounded-xl transition-all font-bold text-xs flex items-center justify-center gap-2 ${
                                                pack.priceNum === 0
                                                    ? "neu-inset text-muted cursor-not-allowed"
                                                    : pack.popular
                                                    ? "neu-button-primary"
                                                    : "neu-button-primary"
                                            }`}
                                        >
                                            {loading === pack.name ? (
                                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <CreditCard className="w-3.5 h-3.5" />
                                                    {pack.buttonText}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Feature Matrix */}
                        <div className="neu-card rounded-2xl p-6 mb-16 overflow-x-auto">
                            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                                <Check className="w-5 h-5 text-primary" /> Complete Package Matrix
                            </h3>
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-muted font-bold uppercase tracking-wider">
                                        <th className="pb-3 pr-4">Feature Parameters</th>
                                        <th className="pb-3 pr-4 text-center">Free</th>
                                        <th className="pb-3 pr-4 text-center">Starter</th>
                                        <th className="pb-3 pr-4 text-center">Pro</th>
                                        <th className="pb-3 pr-4 text-center">Ultra</th>
                                        <th className="pb-3 text-center">Enterprise</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50 text-muted">
                                    <tr>
                                        <td className="py-3 font-semibold text-foreground">Initial Credits</td>
                                        <td className="py-3 text-center">100</td>
                                        <td className="py-3 text-center font-bold text-primary">500</td>
                                        <td className="py-3 text-center font-bold text-primary">1,200</td>
                                        <td className="py-3 text-center font-bold text-primary">3,000</td>
                                        <td className="py-3 text-center font-bold text-primary">8,000</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 font-semibold text-foreground">AI Generation Queue</td>
                                        <td className="py-3 text-center">Standard</td>
                                        <td className="py-3 text-center">Fast</td>
                                        <td className="py-3 text-center text-primary font-medium">Priority</td>
                                        <td className="py-3 text-center text-primary font-medium">Priority</td>
                                        <td className="py-3 text-center text-primary font-black">Instant VM</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 font-semibold text-foreground">NVIDIA NIM Engine</td>
                                        <td className="py-3 text-center text-muted"><X className="w-3.5 h-3.5 mx-auto" /></td>
                                        <td className="py-3 text-center text-muted"><X className="w-3.5 h-3.5 mx-auto" /></td>
                                        <td className="py-3 text-center text-success"><Check className="w-3.5 h-3.5 mx-auto" /></td>
                                        <td className="py-3 text-center text-success"><Check className="w-3.5 h-3.5 mx-auto" /></td>
                                        <td className="py-3 text-center text-success"><Check className="w-3.5 h-3.5 mx-auto" /></td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 font-semibold text-foreground">Web Search Tools</td>
                                        <td className="py-3 text-center">Standard</td>
                                        <td className="py-3 text-center">Standard</td>
                                        <td className="py-3 text-center text-success"><Check className="w-3.5 h-3.5 mx-auto" /></td>
                                        <td className="py-3 text-center text-success"><Check className="w-3.5 h-3.5 mx-auto" /></td>
                                        <td className="py-3 text-center text-success"><Check className="w-3.5 h-3.5 mx-auto" /></td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 font-semibold text-foreground">Private Repositories</td>
                                        <td className="py-3 text-center">5 limit</td>
                                        <td className="py-3 text-center">15 limit</td>
                                        <td className="py-3 text-center">30 limit</td>
                                        <td className="py-3 text-center font-semibold text-foreground">Unlimited</td>
                                        <td className="py-3 text-center font-semibold text-foreground">Unlimited</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 font-semibold text-foreground">Custom Sandbox Config</td>
                                        <td className="py-3 text-center text-muted"><X className="w-3.5 h-3.5 mx-auto" /></td>
                                        <td className="py-3 text-center text-muted"><X className="w-3.5 h-3.5 mx-auto" /></td>
                                        <td className="py-3 text-center text-muted">Basic</td>
                                        <td className="py-3 text-center text-success"><Check className="w-3.5 h-3.5 mx-auto" /></td>
                                        <td className="py-3 text-center text-success"><Check className="w-3.5 h-3.5 mx-auto" /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* FAQ */}
                        <div className="max-w-3xl mx-auto">
                            <h3 className="text-2xl font-black text-foreground text-center mb-8 flex items-center justify-center gap-2">
                                <HelpCircle className="w-6 h-6 text-primary" /> Frequently Asked Questions
                            </h3>
                            <div className="space-y-4">
                                {faqs.map((faq, fIdx) => (
                                    <div key={fIdx} className="neu-card rounded-2xl overflow-hidden transition-all duration-300">
                                        <button
                                            onClick={() => setActiveFaq(activeFaq === fIdx ? null : fIdx)}
                                            className="w-full flex items-center justify-between p-5 text-left font-bold text-foreground hover:text-foreground transition-colors"
                                        >
                                            <span>{faq.q}</span>
                                            <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-300 ${activeFaq === fIdx ? 'rotate-180 text-primary' : ''}`} />
                                        </button>
                                        <div
                                            className={`transition-all duration-300 ease-in-out ${
                                                activeFaq === fIdx ? 'max-h-40 border-t border-zinc-800/30' : 'max-h-0'
                                            } overflow-hidden`}
                                        >
                                            <p className="neu-inset p-5 text-xs text-muted leading-relaxed">
                                                {faq.a}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
