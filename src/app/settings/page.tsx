"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    User, Shield, Link2, Copy, Check, Settings as SettingsIcon, Bell, Trash2,
    Key, Coins, Sun, Moon, Eye, EyeOff, ExternalLink, Lock, Sparkles,
    ChevronRight, Palette, CreditCard, Zap, Crown
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { MatrixRain } from '@/components/MatrixRain';
import { TopHeader, useAuth, SharedModals } from '@/components/AppShell';
import { useTheme } from '@/components/ThemeProvider';

type SectionId = 'profile' | 'account' | 'api-keys' | 'affiliate' | 'preferences' | 'appearance' | 'danger';

const SECTIONS: { id: SectionId; icon: React.ComponentType<{ className?: string }>; label: string; badge?: string; badgeColor?: string }[] = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'account', icon: Shield, label: 'Account' },
    { id: 'api-keys', icon: Key, label: 'API Keys', badge: 'Upcoming', badgeColor: 'warning' },
    { id: 'affiliate', icon: Link2, label: 'Affiliate' },
    { id: 'preferences', icon: Bell, label: 'Preferences' },
    { id: 'appearance', icon: Palette, label: 'Appearance' },
    { id: 'danger', icon: Trash2, label: 'Danger Zone' },
];

export default function SettingsPage() {
    const router = useRouter();
    const auth = useAuth();
    const { user, setUser, logout } = auth;
    const { theme, setTheme } = useTheme();

    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<SectionId>('profile');

    // Profile Fields
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [discordId, setDiscordId] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);

    // Preferences
    const [quickAccess, setQuickAccess] = useState(false);
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pasteAsFile, setPasteAsFile] = useState(true);

    // API Keys
    const [openRouterKey, setOpenRouterKey] = useState('');
    const [nvidiaKey, setNvidiaKey] = useState('');
    const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
    const [showNvidiaKey, setShowNvidiaKey] = useState(false);

    // Copy states
    const [copied, setCopied] = useState(false);
    const [copiedId, setCopiedId] = useState(false);
    const [prefSuccess, setPrefSuccess] = useState(false);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const res = await authApi.me();
                if (res.user) {
                    setUser(res.user);
                    setDisplayName(res.user.display_name || res.user.name || '');
                    setEmail(res.user.email || '');
                    setDiscordId(res.user.discord_id || '');
                    setQuickAccess(res.user.history_quick_access === 1);
                    setEmailNotifs(res.user.email_notifications === 1);
                    setPasteAsFile(res.user.paste_as_file === 1);
                } else {
                    router.push('/');
                }
            } catch (err) {
                console.error("Failed to load user settings:", err);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [router]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileSaving(true);
        setProfileSuccess(false);
        try {
            const result = await authApi.updateProfile({ displayName, email, discordId });
            if (result.success) {
                setUser(result.user);
                setProfileSuccess(true);
                setTimeout(() => setProfileSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Profile save error:", error);
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePrefToggle = async (prefName: string, currentValue: boolean) => {
        const newVal = !currentValue;
        const updatedPrefs: any = {
            history_quick_access: quickAccess,
            email_notifications: emailNotifs,
            paste_as_file: pasteAsFile,
        };
        updatedPrefs[prefName] = newVal;

        if (prefName === 'quickAccess') setQuickAccess(newVal);
        if (prefName === 'emailNotifs') setEmailNotifs(newVal);
        if (prefName === 'pasteAsFile') setPasteAsFile(newVal);

        try {
            const result = await authApi.updatePreferences(updatedPrefs);
            if (result.success) {
                setUser(result.user);
                setPrefSuccess(true);
                setTimeout(() => setPrefSuccess(false), 2000);
            }
        } catch (err) {
            console.error("Failed to save preference:", err);
        }
    };

    const handleCopyAffiliate = () => {
        if (!user) return;
        const refUrl = `${window.location.origin}/register?ref=${user.affiliate_code || 'VEL-USER'}`;
        navigator.clipboard.writeText(refUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const handleCopyId = () => {
        if (!user?.profile_id) return;
        navigator.clipboard.writeText(String(user.profile_id));
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    const handleDeleteAccount = async () => {
        if (!confirm("WARNING: Are you sure you want to delete your account permanently? This action is irreversible and all your sandboxes will be cleaned up.")) return;
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const result = await res.json();
            if (result.success) {
                await logout();
                router.push('/');
            }
        } catch (err) {
            alert("Failed to delete account. Support team notified.");
        }
    };

    if (loading) {
        return (
            <main className="flex h-screen bg-background text-muted font-sans">
                <MatrixRain />
                <div className="flex-1 flex items-center justify-center relative z-10">
                    <div className="w-6 h-6 border-2 border-[hsl(var(--primary))]/30 border-t-[hsl(var(--primary))] rounded-full animate-spin mb-4 mx-auto" />
                    <span className="text-xs">Loading Settings...</span>
                </div>
            </main>
        );
    }

    return (
        <main className="flex h-screen bg-background text-foreground font-sans relative overflow-hidden">
            <MatrixRain />
            <div className="absolute bottom-0 left-0 right-0 h-[2px] horizon-line z-10 pointer-events-none" />
            <div className="bg-orb bg-orb-teal w-[600px] h-[600px] -top-40 -left-40 fixed opacity-40 pointer-events-none" />
            <div className="bg-orb bg-orb-cyan w-[500px] h-[500px] bottom-0 right-0 fixed opacity-30 pointer-events-none" style={{ animationDelay: '-5s' }} />

            <SharedModals auth={auth} docs={false} />

            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                <TopHeader user={user} onLogout={logout} />

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-5xl mx-auto px-6 pt-8 pb-24">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-black text-foreground mb-1">Settings</h1>
                            <p className="text-muted text-sm">Manage your account, preferences, and access.</p>
                        </div>

                        <div className="flex gap-6">
                            {/* Sidebar Navigation */}
                            <nav className="w-56 shrink-0 hidden lg:block">
                                <div className="sticky top-8 space-y-1">
                                    {SECTIONS.map((section) => (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                                activeSection === section.id
                                                    ? 'bg-[hsl(var(--primary)/0.1)] text-foreground border border-[hsl(var(--primary)/0.2)]'
                                                    : 'text-muted hover:text-foreground hover:bg-[hsl(var(--surface-sunk))] border border-transparent'
                                            }`}
                                        >
                                            <section.icon className="w-4 h-4 shrink-0" />
                                            <span className="flex-1 text-left">{section.label}</span>
                                            {section.badge && (
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                                    section.badgeColor === 'warning' ? 'bg-warning/15 text-warning' : 'bg-primary/15 text-primary'
                                                }`}>
                                                    {section.badge}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </nav>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0">
                                {/* Mobile section selector */}
                                <div className="lg:hidden mb-6">
                                    <select
                                        value={activeSection}
                                        onChange={(e) => setActiveSection(e.target.value as SectionId)}
                                        className="w-full neu-input rounded-xl px-4 py-3 text-sm font-medium text-foreground appearance-none cursor-pointer"
                                    >
                                        {SECTIONS.map((s) => (
                                            <option key={s.id} value={s.id}>{s.label}{s.badge ? ` (${s.badge})` : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Profile Section */}
                                {activeSection === 'profile' && (
                                    <SettingsSection icon={User} title="Profile">
                                        <SettingsRow
                                            label="Velix profile ID"
                                            desc="Your unique identifier, used for gifting."
                                            value={
                                                <button onClick={handleCopyId} className="flex items-center gap-2 neu-pill px-3 py-1 text-xs font-mono font-bold text-foreground hover:border-white/15 transition-all">
                                                    {user?.profile_id || '---'}
                                                    {copiedId ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted" />}
                                                </button>
                                            }
                                        />
                                        <SettingsRow
                                            label="Display name"
                                            desc="How your name appears to others."
                                            value={<span className="text-sm font-semibold text-foreground">{user?.display_name || user?.name || '---'}</span>}
                                        />
                                        <SettingsRow
                                            label="Email"
                                            desc="Your account email."
                                            value={<span className="text-sm font-semibold text-foreground">{user?.email || '---'}</span>}
                                        />
                                        <SettingsRow
                                            label="Discord ID"
                                            desc="Connected Discord account."
                                            value={<span className="text-sm font-semibold text-foreground font-mono">{user?.discord_id || 'Not linked'}</span>}
                                        />
                                    </SettingsSection>
                                )}

                                {/* Account Section */}
                                {activeSection === 'account' && (
                                    <SettingsSection icon={Shield} title="Account">
                                        <SettingsRow
                                            label="Account status"
                                            desc="Your account standing."
                                            value={
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md bg-success/20 text-success border border-success/30">
                                                    <span className="w-1.5 h-1.5 bg-success rounded-full" />
                                                    Active
                                                </span>
                                            }
                                        />
                                        <SettingsRow
                                            label="Member since"
                                            desc="Account creation date."
                                            value={
                                                <span className="text-sm font-semibold text-foreground">
                                                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '---'}
                                                </span>
                                            }
                                        />
                                        <SettingsRow
                                            label="Roles"
                                            desc="Your account permissions."
                                            value={
                                                <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md bg-[hsl(var(--surface-sunk))] text-muted border border-[hsl(var(--surface))]">
                                                    {user?.role || 'Member'}
                                                </span>
                                            }
                                        />
                                        <SettingsRow
                                            label="Credits balance"
                                            desc="Current available credits."
                                            value={
                                                <Link href="/credits" className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-primary transition-colors">
                                                    <Coins className="w-4 h-4 text-primary" />
                                                    {user?.credits ?? 0}
                                                </Link>
                                            }
                                        />
                                    </SettingsSection>
                                )}

                                {/* API Keys Section — Upcoming */}
                                {activeSection === 'api-keys' && (
                                    <div className="relative">
                                        <SettingsSection icon={Key} title="API Keys">
                                            <div className="px-5 py-3 bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--text)/0.1)] rounded-lg flex items-start gap-2.5 mb-1">
                                                <Lock className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-muted leading-relaxed">
                                                    Bring your own API keys for direct model access. Keys are stored securely and only used for your requests.
                                                </p>
                                            </div>
                                            <ApiKeyRow
                                                label="OpenRouter API Key"
                                                placeholder="sk-or-v1-..."
                                                value={openRouterKey}
                                                onChange={setOpenRouterKey}
                                                showKey={showOpenRouterKey}
                                                onToggleShow={() => setShowOpenRouterKey(!showOpenRouterKey)}
                                                disabled
                                            />
                                            <ApiKeyRow
                                                label="NVIDIA NIM API Key"
                                                placeholder="nvapi-..."
                                                value={nvidiaKey}
                                                onChange={setNvidiaKey}
                                                showKey={showNvidiaKey}
                                                onToggleShow={() => setShowNvidiaKey(!showNvidiaKey)}
                                                disabled
                                            />
                                        </SettingsSection>

                                        {/* Upcoming overlay */}
                                        <div className="absolute inset-0 rounded-2xl bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                                            <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] shadow-xl text-center max-w-xs">
                                                <div className="w-12 h-12 rounded-2xl bg-warning/15 flex items-center justify-center">
                                                    <Sparkles className="w-6 h-6 text-warning" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-extrabold text-foreground mb-1">Coming Soon</h3>
                                                    <p className="text-[11px] text-muted leading-relaxed">
                                                        Bring Your Own Key support is in development. You'll be able to use your own OpenRouter and NVIDIA API keys for direct model access.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20">
                                                    <Zap className="w-3 h-3 text-warning" />
                                                    <span className="text-[10px] font-bold text-warning uppercase tracking-wider">In Progress</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Affiliate Section */}
                                {activeSection === 'affiliate' && (
                                    <SettingsSection icon={Link2} title="Affiliate program">
                                        <SettingsRow
                                            label="Your affiliate code"
                                            desc="Share this code to earn rewards."
                                            value={
                                                <button onClick={handleCopyAffiliate} className="flex items-center gap-2 neu-pill px-3 py-1 text-xs font-mono font-bold text-foreground hover:border-white/15 transition-all">
                                                    {user?.affiliate_code || 'VEL-USER'}
                                                    {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted" />}
                                                </button>
                                            }
                                        />
                                        <SettingsRow
                                            label="Share link"
                                            desc="Your personalized referral link."
                                            value={
                                                <button onClick={handleCopyAffiliate} className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    {copied ? 'Copied!' : 'Copy link'}
                                                </button>
                                            }
                                        />
                                        <SettingsRow
                                            label="Commission rate"
                                            desc={<span>You earn <span className="text-foreground font-bold">50 credits</span> per referral.</span>}
                                            value={
                                                <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md bg-primary/15 text-primary border border-primary/20">
                                                    50 CR
                                                </span>
                                            }
                                        />
                                        <div className="grid grid-cols-2 gap-3 mt-1">
                                            <div className="px-5 py-3 neu-card rounded-xl border border-[hsl(var(--surface-sunk))] text-center">
                                                <div className="text-muted text-[10px] uppercase tracking-wider font-bold mb-1">Referrals</div>
                                                <div className="text-lg font-black text-foreground">0</div>
                                            </div>
                                            <div className="px-5 py-3 neu-card rounded-xl border border-[hsl(var(--surface-sunk))] text-center">
                                                <div className="text-muted text-[10px] uppercase tracking-wider font-bold mb-1">Earned</div>
                                                <div className="text-lg font-black text-success flex items-center justify-center gap-1"><Coins className="w-4 h-4" /> 0</div>
                                            </div>
                                        </div>
                                    </SettingsSection>
                                )}

                                {/* Preferences Section */}
                                {activeSection === 'preferences' && (
                                    <SettingsSection icon={Bell} title="Preferences" badge={prefSuccess ? 'Saved' : undefined} badgeColor="success">
                                        <PrefToggle
                                            label="History quick access"
                                            desc="Show quick access to recent sessions under the prompt panel."
                                            checked={quickAccess}
                                            onChange={() => handlePrefToggle('quickAccess', quickAccess)}
                                        />
                                        <PrefToggle
                                            label="Email notifications"
                                            desc="Receive emails when AI generations complete and other important updates."
                                            checked={emailNotifs}
                                            onChange={() => handlePrefToggle('emailNotifs', emailNotifs)}
                                        />
                                        <PrefToggle
                                            label="Paste as file"
                                            desc="When you paste a large block of code, attach it as a file instead of cluttering the chat input."
                                            checked={pasteAsFile}
                                            onChange={() => handlePrefToggle('pasteAsFile', pasteAsFile)}
                                        />
                                    </SettingsSection>
                                )}

                                {/* Appearance Section */}
                                {activeSection === 'appearance' && (
                                    <SettingsSection icon={theme === 'dark' ? Moon : Sun} title="Appearance">
                                        <div className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setTheme('dark')}
                                                    className={`flex-1 neu-card rounded-xl p-4 border transition-all cursor-pointer ${theme === 'dark' ? 'border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.5)]' : 'border-[hsl(var(--surface-sunk))] hover:border-[hsl(var(--text-faint)/0.3)]'}`}
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Moon className="w-4 h-4" />
                                                        <span className="text-xs font-bold text-foreground">Dark</span>
                                                    </div>
                                                    <div className="w-full h-16 rounded-lg bg-[#0a0a0f] border border-[hsl(var(--surface-sunk))] flex items-center justify-center">
                                                        <div className="w-3/4 h-2 rounded bg-white/5" />
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => setTheme('light')}
                                                    className={`flex-1 neu-card rounded-xl p-4 border transition-all cursor-pointer ${theme === 'light' ? 'border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.5)]' : 'border-[hsl(var(--surface-sunk))] hover:border-[hsl(var(--text-faint)/0.3)]'}`}
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Sun className="w-4 h-4" />
                                                        <span className="text-xs font-bold text-foreground">Light</span>
                                                    </div>
                                                    <div className="w-full h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                                        <div className="w-3/4 h-2 rounded bg-gray-300" />
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </SettingsSection>
                                )}

                                {/* Danger Zone */}
                                {activeSection === 'danger' && (
                                    <div className="rounded-2xl border border-danger/20 overflow-hidden" style={{ background: 'hsl(var(--danger) / 0.05)' }}>
                                        <div className="px-5 py-4 flex items-center gap-3 border-b border-danger/10">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-danger/15">
                                                <Trash2 className="w-4 h-4 text-danger" />
                                            </div>
                                            <h3 className="text-sm font-extrabold text-danger">Danger zone</h3>
                                        </div>
                                        <div className="px-5 py-4 flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-bold text-foreground">Delete account</div>
                                                <div className="text-xs text-muted mt-0.5">Permanently delete your account and all data. A 30-day recovery window applies.</div>
                                            </div>
                                            <button
                                                onClick={handleDeleteAccount}
                                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-danger border border-danger/30 rounded-lg hover:bg-danger/10 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Delete account
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

/* ─── Layout Components ─── */

function SettingsSection({ icon: Icon, title, children, badge, badgeColor = 'primary' }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    children: React.ReactNode;
    badge?: string;
    badgeColor?: 'primary' | 'success' | 'warning';
}) {
    const badgeClasses = {
        primary: 'bg-primary/15 text-primary border-primary/20',
        success: 'bg-success/20 text-success border-success/30',
        warning: 'bg-warning/15 text-warning border-warning/20',
    };

    return (
        <div className="neu-card rounded-2xl border border-[hsl(var(--surface-sunk))] overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-[hsl(var(--surface-sunk))]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(var(--surface-sunk))]">
                        <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-extrabold text-foreground">{title}</h3>
                </div>
                {badge && (
                    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md border ${badgeClasses[badgeColor]}`}>
                        {badge}
                    </span>
                )}
            </div>
            <div className="divide-y divide-white/5">
                {children}
            </div>
        </div>
    );
}

function SettingsRow({ label, desc, value }: {
    label: string;
    desc?: React.ReactNode;
    value: React.ReactNode;
}) {
    return (
        <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
                <div className="text-sm font-bold text-foreground">{label}</div>
                {desc && <div className="text-[11px] text-muted mt-0.5">{desc}</div>}
            </div>
            <div className="shrink-0">{value}</div>
        </div>
    );
}

function PrefToggle({ label, desc, checked, onChange }: {
    label: string;
    desc: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
                <div className="text-sm font-bold text-foreground">{label}</div>
                <div className="text-[11px] text-muted mt-0.5 leading-relaxed">{desc}</div>
            </div>
            <button
                onClick={onChange}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-all duration-200 ${checked ? 'bg-primary' : 'bg-[hsl(var(--surface-sunk))] border border-[hsl(var(--surface-sunk))]'}`}
                aria-label={`Toggle ${label}`}
            >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-all duration-200 shadow-sm ${checked ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
        </div>
    );
}

function ApiKeyRow({ label, placeholder, value, onChange, showKey, onToggleShow, disabled }: {
    label: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    showKey: boolean;
    onToggleShow: () => void;
    disabled?: boolean;
}) {
    return (
        <div className="px-5 py-4">
            <label className="block text-sm font-bold text-foreground mb-2">{label}</label>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="w-full neu-input rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground font-mono focus:outline-none focus:border-[hsl(var(--text)/0.5)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <button
                        onClick={onToggleShow}
                        disabled={disabled}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
