"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Download, Eye, Calendar, Database, Terminal,
    Settings, AlertCircle, FolderOpen
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { TopHeader, useAuth, SharedModals } from '@/components/AppShell';

interface ProfileData {
    user: {
        id: string;
        name: string;
        displayName: string;
        discordId: string;
        profileId: number;
        created_at: string;
    };
    projects: any[];
    stats: {
        projectsCount: number;
        totalViews: number;
        totalDownloads: number;
    };
    activity: {
        totalActions: number;
        heatmap: { date: string; count: number }[];
        monthlyCounts: Record<string, number>;
        breakdown: {
            messagesToAI: number;
            manualEdits: number;
        };
    };
}

function ProfileContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetProfileId = searchParams.get('id');
    const auth = useAuth();
    const { user, setUser, logout } = auth;

    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState(2026);

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                let loggedInUser = user;

                if (!loggedInUser) {
                    const token = document.cookie.split('; ').find(c => c.startsWith('token='));
                    if (token) {
                        const result = await authApi.me();
                        if (result.user) {
                            setUser(result.user);
                            loggedInUser = result.user;
                        }
                    }
                }

                let pid = targetProfileId;
                if (!pid && loggedInUser) {
                    pid = loggedInUser.profile_id?.toString();
                }

                if (!pid) {
                    setError("No profile ID specified. Please log in or provide a profile link.");
                    setLoading(false);
                    return;
                }

                const res = await authApi.getPublicProfile(pid);
                if (res.error) {
                    setError(res.error);
                } else {
                    setProfileData(res);
                }
            } catch (err: any) {
                setError(err.message || "Failed to load profile.");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [targetProfileId]);

    if (loading) {
        return (
            <main className="flex h-screen bg-background text-foreground/50 font-sans">
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[hsl(var(--text)/0.3)] border-t-[hsl(var(--text))] rounded-full animate-spin" />
                </div>
            </main>
        );
    }

    if (error || !profileData) {
        return (
            <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
                <div className="rounded-2xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] p-8 text-center max-w-sm">
                    <AlertCircle className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">Profile Not Found</h3>
                    <p className="text-foreground/40 text-xs mb-6 leading-relaxed">
                        {error || "We couldn't retrieve profile details for this ID."}
                    </p>
                    <Link href="/" className="inline-flex px-5 py-2 text-xs font-bold text-foreground border border-[hsl(var(--surface-sunk))] rounded-full hover:border-[hsl(var(--text)/0.5)] transition-all">
                        Back to Home
                    </Link>
                </div>
            </main>
        );
    }

    const { user: profileUser, projects, stats, activity } = profileData;
    const isOwnProfile = user && user.id === profileUser.id;

    // Process real heatmap data from API
    const processHeatmap = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const days = ['Mon', 'Wed', 'Fri'];

        // Build a map of date -> count from real data
        const dateMap: Record<string, number> = {};
        if (activity.heatmap) {
            for (const entry of activity.heatmap) {
                dateMap[entry.date] = entry.count;
            }
        }

        // Generate the 13-week (approx 3 months) grid ending today
        const today = new Date();
        const grid: { date: string; count: number; dayOfWeek: number; weekStart: string }[][] = [];
        const weekLabels: string[] = [];

        // Go back 12 weeks from today
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - (12 * 7 + startDate.getDay()));

        for (let w = 0; w < 13; w++) {
            const week: { date: string; count: number; dayOfWeek: number; weekStart: string }[] = [];
            const weekStart = new Date(startDate);
            weekStart.setDate(weekStart.getDate() + w * 7);
            weekLabels.push(months[weekStart.getMonth()]);

            for (let d = 0; d < 7; d++) {
                const cellDate = new Date(weekStart);
                cellDate.setDate(cellDate.getDate() + d);
                const dateStr = cellDate.toISOString().slice(0, 10);
                const count = dateMap[dateStr] || 0;
                week.push({ date: dateStr, count, dayOfWeek: d, weekStart: dateStr });
            }
            grid.push(week);
        }

        // Deduplicate month labels (show only first occurrence per week group)
        const uniqueMonths: (string | null)[] = [];
        let lastMonth = '';
        for (const m of weekLabels) {
            if (m !== lastMonth) {
                uniqueMonths.push(m);
                lastMonth = m;
            } else {
                uniqueMonths.push(null);
            }
        }

        return { months: uniqueMonths, days, grid };
    };

    const heatmap = processHeatmap();

    const getHeatmapColor = (count: number) => {
        if (count === 0) return 'bg-[#0d1117]';
        if (count === 1) return 'bg-[#0e4429]';
        if (count === 2) return 'bg-[#006d32]';
        return 'bg-[#26a641]';
    };

    // Process monthly chart data
    const processMonthlyChart = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const today = new Date();
        const monthlyData: { month: string; count: number }[] = [];

        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const count = activity.monthlyCounts?.[key] || 0;
            monthlyData.push({ month: months[d.getMonth()], count });
        }

        return monthlyData;
    };

    const monthlyChart = processMonthlyChart();
    const maxMonthly = Math.max(...monthlyChart.map(m => m.count), 1);

    const joinDate = new Date(profileUser.created_at);
    const joinMonth = joinDate.toLocaleString('default', { month: 'short' });
    const joinYear = joinDate.getFullYear();

    return (
        <main className="flex h-screen bg-background text-foreground font-sans relative overflow-hidden">
            {/* Background planet horizon */}
            <div className="planet-horizon pointer-events-none" />

            <SharedModals auth={auth} docs={false} />

            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                <TopHeader user={user} onLogout={logout} onLoginClick={() => auth.setIsAuthOpen(true)} />

                <div className="flex-1 overflow-y-auto">
                    <section className="max-w-6xl mx-auto px-6 pt-10 pb-20">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                            {/* Left Column - Profile Sidebar */}
                            <div className="lg:col-span-4">
                                <div className="rounded-2xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] p-6 relative overflow-hidden">
                                    {/* Profile Picture */}
                                    <div className="w-28 h-28 mx-auto mb-5 rounded-full overflow-hidden border-2 border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface-sunk))]">
                                        <img
                                            src="/avatar.png"
                                            alt={profileUser.displayName || profileUser.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement!.innerHTML = `
                                                    <div class="w-full h-full flex items-center justify-center text-3xl font-extrabold text-foreground">
                                                        ${(profileUser.displayName || profileUser.name || '?')[0].toUpperCase()}
                                                    </div>
                                                `;
                                            }}
                                        />
                                    </div>

                                    {/* Username & Handle */}
                                    <div className="text-center mb-5">
                                        <h1 className="text-xl font-extrabold text-foreground mb-0.5">
                                            {profileUser.displayName || profileUser.name}
                                        </h1>
                                        <p className="text-foreground/40 text-sm">
                                            @{(profileUser.displayName || profileUser.name).toLowerCase().replace(/\s+/g, '')}
                                        </p>
                                    </div>

                                    {/* User ID */}
                                    <div className="flex items-center gap-2 text-foreground/50 text-xs mb-2">
                                        <Database className="w-3.5 h-3.5 text-foreground/40" />
                                        <span className="font-mono">{profileUser.id.substring(0, 18)}</span>
                                    </div>

                                    {/* Join Date */}
                                    <div className="flex items-center gap-2 text-foreground/50 text-xs mb-6">
                                        <Calendar className="w-3.5 h-3.5 text-foreground/40" />
                                        <span>Joined {joinMonth} {joinYear}</span>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-[hsl(var(--surface-sunk))] my-5" />

                                    {/* Roles */}
                                    <div className="mb-5">
                                        <h3 className="text-xs font-bold text-foreground mb-2.5">Roles</h3>
                                        <span className="inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground/70 border border-[hsl(var(--surface-sunk))] rounded-md bg-[hsl(var(--surface-sunk))]">
                                            Member
                                        </span>
                                    </div>

                                    {/* Achievements */}
                                    <div className="mb-5">
                                        <h3 className="text-xs font-bold text-foreground mb-2.5">Achievements</h3>
                                        <span className="inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground/40 border border-[hsl(var(--surface-sunk))] rounded-md bg-[hsl(var(--surface-sunk))]">
                                            Coming Soon
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div>
                                        <h3 className="text-xs font-bold text-foreground mb-3">Stats</h3>
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-foreground/40">Projects</span>
                                                <span className="font-bold text-foreground">{stats.projectsCount}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-foreground/40">Total views</span>
                                                <span className="font-bold text-foreground">{stats.totalViews}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-foreground/40">Total downloads</span>
                                                <span className="font-bold text-foreground">{stats.totalDownloads}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Edit Profile (own profile only) */}
                                    {isOwnProfile && (
                                        <Link
                                            href="/settings"
                                            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-foreground/50 border border-[hsl(var(--surface-sunk))] rounded-xl hover:text-foreground hover:border-[hsl(var(--text)/0.5)] transition-all"
                                        >
                                            <Settings className="w-3.5 h-3.5" /> Edit Profile
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Activity & Projects */}
                            <div className="lg:col-span-8 space-y-6">

                                {/* Activity Heatmap */}
                                <div className="rounded-2xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-sm font-bold text-foreground">
                                            {activity.totalActions} actions in the last year
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedYear(2026)}
                                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${selectedYear === 2026 ? 'bg-[hsl(var(--surface-sunk))] text-foreground' : 'text-foreground/40 hover:text-foreground'}`}
                                            >
                                                2026
                                            </button>
                                            <button
                                                onClick={() => setSelectedYear(2025)}
                                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${selectedYear === 2025 ? 'bg-[hsl(var(--surface-sunk))] text-foreground' : 'text-foreground/40 hover:text-foreground'}`}
                                            >
                                                2025
                                            </button>
                                        </div>
                                    </div>

                                    {/* Heatmap Grid */}
                                    <div className="overflow-x-auto pb-2">
                                        <div className="min-w-[600px]">
                                            {/* Month labels */}
                                            <div className="flex gap-1 mb-2 ml-8">
                                                {heatmap.months.map((m, i) => (
                                                    <div key={i} className="w-3.5 text-[9px] text-foreground/40 text-center">
                                                        {m || ''}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Grid with day labels */}
                                            <div className="flex gap-2">
                                                <div className="flex flex-col gap-1">
                                                    {heatmap.days.map((d, i) => (
                                                        <div key={i} className="h-3.5 text-[9px] text-foreground/40 flex items-center">
                                                            {d}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex gap-1">
                                                    {heatmap.grid.map((week, wIdx) => (
                                                        <div key={wIdx} className="flex flex-col gap-1">
                                                            {week.filter((_, dIdx) => dIdx % 2 === 0).map((cell, dIdx) => (
                                                                <div
                                                                    key={dIdx}
                                                                    className={`w-3.5 h-3.5 rounded-sm ${getHeatmapColor(cell.count)} border border-white/5 transition-colors hover:border-white/20`}
                                                                    title={`${cell.date}: ${cell.count} actions`}
                                                                />
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="flex items-center justify-end gap-1.5 mt-4 text-[10px] text-foreground/40">
                                        <span>Less</span>
                                        <div className="w-3 h-3 bg-[#0d1117] rounded-sm border border-white/5" />
                                        <div className="w-3 h-3 bg-[#0e4429] rounded-sm border border-white/5" />
                                        <div className="w-3 h-3 bg-[#006d32] rounded-sm border border-white/5" />
                                        <div className="w-3 h-3 bg-[#26a641] rounded-sm border border-white/5" />
                                        <span>More</span>
                                    </div>
                                </div>

                                {/* Activity Overview */}
                                <div className="rounded-2xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-sm font-bold text-foreground">Activity overview</h3>
                                        <span className="text-xs text-foreground/40">{activity.totalActions} total actions</span>
                                    </div>

                                    {/* Activity Chart (SVG) - Real data */}
                                    <div className="h-32 w-full mb-5 relative">
                                        <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                                                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            {/* Area fill */}
                                            <path
                                                d={`M0,${100 - (monthlyChart[0].count / maxMonthly) * 80} ${monthlyChart.map((m, i) => {
                                                    const x = (i / 11) * 400;
                                                    const y = 100 - (m.count / maxMonthly) * 80;
                                                    return `L${x},${y}`;
                                                }).join(' ')} L400,100 L0,100 Z`}
                                                fill="url(#activityGrad)"
                                            />
                                            {/* Line */}
                                            <path
                                                d={`M0,${100 - (monthlyChart[0].count / maxMonthly) * 80} ${monthlyChart.map((m, i) => {
                                                    const x = (i / 11) * 400;
                                                    const y = 100 - (m.count / maxMonthly) * 80;
                                                    return `L${x},${y}`;
                                                }).join(' ')}`}
                                                fill="none"
                                                stroke="#22c55e"
                                                strokeWidth="2"
                                            />
                                            {/* Data points */}
                                            {monthlyChart.map((m, i) => {
                                                const x = (i / 11) * 400;
                                                const y = 100 - (m.count / maxMonthly) * 80;
                                                return m.count > 0 ? (
                                                    <circle key={i} cx={x} cy={y} r="3" fill="#22c55e" stroke="#090a0d" strokeWidth="1" />
                                                ) : null;
                                            })}
                                        </svg>
                                        {/* Month labels */}
                                        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-foreground/40 px-2">
                                            {monthlyChart.map((m, i) => (
                                                <span key={i}>{m.month.charAt(0)}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Activity Legend - Real data */}
                                    <div className="flex items-center gap-6 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
                                            <span className="text-foreground/50">Messages to the AI</span>
                                            <span className="font-bold text-foreground ml-1">
                                                {activity.breakdown ? (activity.totalActions > 0 ? Math.round((activity.breakdown.messagesToAI / (activity.breakdown.messagesToAI + activity.breakdown.manualEdits || 1)) * 100) : 0) : 0}%
                                            </span>
                                            <span className="text-foreground/40">{activity.breakdown?.messagesToAI || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-sm bg-[hsl(var(--text))]" />
                                            <span className="text-foreground/50">Manual edits</span>
                                            <span className="font-bold text-foreground ml-1">
                                                {activity.breakdown ? (activity.totalActions > 0 ? Math.round((activity.breakdown.manualEdits / (activity.breakdown.messagesToAI + activity.breakdown.manualEdits || 1)) * 100) : 0) : 0}%
                                            </span>
                                            <span className="text-foreground/40">{activity.breakdown?.manualEdits || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Projects Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-foreground">
                                            Projects <span className="text-foreground/40 font-normal">(Top 6 most popular)</span>
                                        </h3>
                                    </div>
                                    {projects.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] p-12 text-center">
                                            <FolderOpen className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                            <p className="text-foreground/40 text-xs">No public projects yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {projects.map((proj) => (
                                                <div
                                                    key={proj.id}
                                                    onClick={() => router.push(`/ide/${proj.id}`)}
                                                    className="group rounded-2xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] p-5 hover:border-[hsl(var(--text)/0.3)] transition-all cursor-pointer"
                                                >
                                                    {/* Project thumbnail */}
                                                    <div className="w-full h-32 rounded-xl bg-gradient-to-br from-[hsl(var(--text)/0.2)] to-[hsl(var(--text)/0.1)] border border-[hsl(var(--surface-sunk))] flex items-center justify-center mb-4 overflow-hidden">
                                                        <Terminal className="w-8 h-8 text-foreground/40" />
                                                    </div>

                                                    <h4 className="font-bold text-foreground text-sm truncate mb-2 group-hover:text-foreground transition-colors">
                                                        {proj.name || proj.id}
                                                    </h4>

                                                    <div className="flex items-center gap-3 text-foreground/40 text-[11px]">
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="w-3 h-3" /> 4
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Download className="w-3 h-3" /> 0
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-background text-foreground/40">
                Loading Profile...
            </div>
        }>
            <ProfileContent />
        </Suspense>
    );
}
