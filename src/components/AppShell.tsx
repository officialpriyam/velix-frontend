"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    LogOut,
    ChevronDown,
    Coins,
    Menu,
    X,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AuthModal } from '@/components/AuthModal';
import { SubmitDocsModal } from '@/components/SubmitDocsModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/lib/AuthContext';
export { useAuth };

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type IconRailItem = {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    href?: string;
    active?: boolean;
    onClick?: () => void;
    accent?: 'teal' | 'purple';
};

/**
 * The thin vertical icon rail on the far left of every page.
 * Matches the screenshots: ~64px, glass, logo at top, nav icons, utility icons at bottom.
 */
export function IconRail({ items }: { items: IconRailItem[] }) {
    return (
        <div className="w-16 shrink-0 flex flex-col items-center py-5 gap-2 glass-card z-20 relative">
            <Link
                href="/chat"
                className="neu-raised w-11 h-11 flex items-center justify-center mb-3 hover:brightness-110 transition-all duration-300 active:scale-95 overflow-hidden"
            >
                <img src="/logo.png" alt="Velix" className="h-full w-full object-cover" />
            </Link>

            <div className="flex flex-col gap-1.5 w-full px-2">
                {items.map((item, i) => (
                    <RailButton key={i} {...item} />
                ))}
            </div>
        </div>
    );
}

function RailButton({ icon: Icon, label, href, active, onClick }: IconRailItem) {
    const inner = (
        <button
            onClick={onClick}
            className={cn(
                'w-full p-2.5 transition-all duration-300 group relative flex items-center justify-center rounded-xl',
                active
                    ? 'neu-button-primary text-foreground'
                    : 'text-[hsl(var(--text-faint))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.1)] hover:scale-110 hover:rotate-3 active:scale-95'
            )}
        >
            <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            <span className="absolute left-14 glass-card-strong text-[hsl(var(--text))] px-3 py-1.5 text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-[100] -translate-x-1 group-hover:translate-x-0 font-medium">
                {label}
            </span>
        </button>
    );

    if (href) {
        return <Link href={href}>{inner}</Link>;
    }
    return inner;
}

/**
 * The top header bar with brand, nav links, credit pill, and user menu.
 * Shared across all non-IDE pages. Responsive: mobile gets hamburger menu.
 */
export function TopHeader({
    user,
    onLogout,
    onLoginClick
}: {
    user: any;
    onLogout: () => void;
    onLoginClick?: () => void;
}) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    useEffect(() => {
        if (showMobileMenu) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [showMobileMenu]);

    return (
        <header className="h-12 md:h-16 flex items-center justify-between px-3 md:px-8 z-30 shrink-0 relative bg-transparent">
            <div className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0">
                <Link href="/chat" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                    <span className="inline-flex h-7 w-7 md:h-8 md:w-8 items-center justify-center overflow-hidden rounded-xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] shadow-lg shadow-[hsl(var(--text)/0.1)]">
                        <img src="/logo.png" alt="Velix" className="h-full w-full object-cover" />
                    </span>
                    <span className="font-extrabold text-foreground text-base md:text-lg tracking-tight">Velix</span>
                </Link>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium absolute left-1/2 -translate-x-1/2">
                <Link href="/community" className="text-foreground/50 hover:text-foreground transition-all duration-300 hover:scale-105">
                    Community
                </Link>
                <Link href="/images" className="text-foreground/50 hover:text-foreground transition-all duration-300 hover:scale-105">
                    Images
                </Link>
                <Link href="/studio" className="text-foreground/50 hover:text-foreground transition-all duration-300 hover:scale-105">
                    Studio
                </Link>
                <Link href="/pricing" className="text-foreground/50 hover:text-foreground transition-all duration-300 hover:scale-105">
                    Pricing
                </Link>
                <div className="relative">
                    <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        onBlur={() => setTimeout(() => setShowMoreMenu(false), 200)}
                        className="text-foreground/50 hover:text-foreground transition-colors flex items-center gap-1"
                    >
                        More <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {showMoreMenu && (
                        <div className="absolute top-full left-0 mt-2 w-40 rounded-xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] p-1.5 shadow-xl z-50">
                            <Link href="/credits" className="block px-3 py-2 text-xs rounded-lg text-foreground/60 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground transition-colors">
                                Credits History
                            </Link>
                            <Link href="/profile" className="block px-3 py-2 text-xs rounded-lg text-foreground/60 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground transition-colors">
                                My Profile
                            </Link>
                            <Link href="/settings" className="block px-3 py-2 text-xs rounded-lg text-foreground/60 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground transition-colors">
                                Settings
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
                <ThemeToggle />
                {user ? (
                    <>
                        <Link
                            href="/credits"
                            className="hidden sm:flex rounded-full border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] px-3 py-1 items-center gap-1.5 text-xs text-foreground/70 hover:text-foreground transition-all font-semibold"
                        >
                            <Coins className="w-3.5 h-3.5 text-foreground/50" />
                            <span>{user.credits !== undefined ? user.credits : 0}</span>
                        </Link>
                        <div className="relative flex items-center">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface-sunk))]">
                                    <img src="/avatar.png" alt="Profile" className="h-full w-full object-cover" onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                    }} />
                                </div>
                            </button>
                            {showUserMenu && (
                                <div className="absolute top-full right-0 mt-2 w-48 rounded-xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] p-1.5 shadow-xl z-50 animate-scale-in">
                                    <div className="px-3 py-1.5 text-[10px] text-foreground/40 uppercase font-bold tracking-wider">
                                        Account
                                    </div>
                                    <Link href="/profile" className="block px-3 py-2 text-xs rounded-lg text-foreground/60 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground transition-colors">
                                        My Profile
                                    </Link>
                                    <Link href="/settings" className="block px-3 py-2 text-xs rounded-lg text-foreground/60 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground transition-colors">
                                        Settings
                                    </Link>
                                    <Link href="/credits" className="block px-3 py-2 text-xs rounded-lg text-foreground/60 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground transition-colors">
                                        Credits
                                    </Link>
                                    <div className="my-1.5 border-t border-[hsl(var(--surface-sunk))]" />
                                    <button onClick={onLogout} className="w-full text-left px-3 py-2 text-xs rounded-lg text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                                        <LogOut className="w-3.5 h-3.5" /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <button
                        onClick={onLoginClick}
                        className="rounded-full border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] px-3 md:px-4 py-1.5 text-xs text-foreground/70 hover:text-foreground transition-all font-semibold"
                    >
                        Sign In
                    </button>
                )}

                {/* Mobile hamburger */}
                <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="md:hidden p-2 rounded-lg hover:bg-[hsl(var(--surface-sunk))] text-muted hover:text-foreground transition-all"
                >
                    {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile slide-down menu */}
            {showMobileMenu && (
                <div className="md:hidden absolute top-full left-0 right-0 z-50 border-b border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))]/95 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <nav className="flex flex-col p-4 gap-1">
                        <Link href="/community" onClick={() => setShowMobileMenu(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground transition-colors">
                            Community
                        </Link>
                        <Link href="/images" onClick={() => setShowMobileMenu(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground transition-colors">
                            Images
                        </Link>
                        <Link href="/studio" onClick={() => setShowMobileMenu(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground transition-colors">
                            Studio
                        </Link>
                        <Link href="/pricing" onClick={() => setShowMobileMenu(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground transition-colors">
                            Pricing
                        </Link>
                        <div className="border-t border-[hsl(var(--surface-sunk))] my-2" />
                        <Link href="/credits" onClick={() => setShowMobileMenu(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground transition-colors">
                            Credits History
                        </Link>
                        <Link href="/profile" onClick={() => setShowMobileMenu(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground transition-colors">
                            My Profile
                        </Link>
                        <Link href="/settings" onClick={() => setShowMobileMenu(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:bg-[hsl(var(--surface-sunk))] hover:text-foreground transition-colors">
                            Settings
                        </Link>
                        {user && (
                            <>
                                <div className="border-t border-[hsl(var(--surface-sunk))] my-2" />
                                <button onClick={() => { setShowMobileMenu(false); onLogout(); }} className="px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left flex items-center gap-2">
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}

/**
 * Shared modals wrapper — render once near the page root.
 */
export function SharedModals({ auth, docs }: { auth: ReturnType<typeof useAuth>; docs: boolean }) {
    return (
        <>
            <AuthModal isOpen={auth.isAuthOpen} onClose={() => auth.setIsAuthOpen(false)} onSuccess={auth.setUser} />
            <SubmitDocsModal isOpen={auth.isDocsOpen} onClose={() => auth.setIsDocsOpen(false)} />
        </>
    );
}

export function Footer() {
    return (
        <footer className="w-full max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6 border-t border-[hsl(var(--surface-sunk))]/30 flex flex-col items-center justify-between gap-3 md:gap-4 text-[10px] text-foreground/40 font-medium z-10 relative">
            <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-center">
                <Link href="/terms" className="hover:text-foreground/70 transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-foreground/70 transition-colors">Privacy</Link>
                <Link href="/cookies" className="hover:text-foreground/70 transition-colors">Cookie Preferences</Link>
                <a href="https://discord.gg/p6dGBwpEV" target="_blank" rel="noopener noreferrer" className="hover:text-foreground/70 transition-colors">Discord</a>
            </div>
            <div className="flex items-center gap-1">
                Developed by <a href="https://velix.snapgrids.store/" target="_blank" rel="noopener noreferrer" className="text-foreground/60 hover:text-foreground/80 transition-colors font-bold">PriyxStudio (Velix)</a>
            </div>
        </footer>
    );
}
