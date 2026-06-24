"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Users, Trash2, Shield, ArrowLeft, Loader2 } from "lucide-react";

export default function AdminPage() {
    const router = useRouter();
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/admin/check`, { credentials: "include" })
            .then(r => r.json())
            .then(d => { setAuthenticated(d.authenticated); setLoading(false); })
            .catch(() => { setAuthenticated(false); setLoading(false); });
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError("");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.success) {
                setAuthenticated(true);
                loadUsers();
            } else {
                setLoginError(data.error || "Login failed");
            }
        } catch (err: any) {
            setLoginError(err.message || "Connection failed");
        }
        setLoginLoading(false);
    };

    const handleLogout = async () => {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/admin/logout`, { method: "POST", credentials: "include" });
        setAuthenticated(false);
        setUsers([]);
    };

    const loadUsers = async () => {
        setUsersLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/admin/users`, { credentials: "include" });
            const data = await res.json();
            if (data.users) setUsers(data.users);
        } catch {}
        setUsersLoading(false);
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Delete this user?")) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/admin/users/${userId}`, {
                method: "DELETE",
                credentials: "include"
            });
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch {}
    };

    useEffect(() => {
        if (authenticated) loadUsers();
    }, [authenticated]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted" />
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-sm">
                    <button onClick={() => router.push("/")} className="flex items-center gap-2 text-muted hover:text-foreground text-sm mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Velix
                    </button>
                    <div className="rounded-2xl border border-white/10 bg-[hsl(var(--surface-sunk))] p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-primary/10">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
                                <p className="text-xs text-muted">Sign in to manage users</p>
                            </div>
                        </div>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted mb-1.5 block">Email or Username</label>
                                <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin" className="w-full px-3 py-2.5 text-sm rounded-xl bg-background border border-white/10 text-foreground placeholder:text-faint focus:outline-none focus:border-primary/50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted mb-1.5 block">Password</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full px-3 py-2.5 text-sm rounded-xl bg-background border border-white/10 text-foreground placeholder:text-faint focus:outline-none focus:border-primary/50" />
                            </div>
                            {loginError && <p className="text-xs text-red-500">{loginError}</p>}
                            <button type="submit" disabled={loginLoading} className="w-full py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                Sign In
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
                            <p className="text-xs text-muted">{users.length} users registered</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={loadUsers} disabled={usersLoading} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[hsl(var(--surface-sunk))] text-muted hover:text-foreground transition-all">
                            {usersLoading ? "Loading..." : "Refresh"}
                        </button>
                        <button onClick={handleLogout} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                            Logout
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[hsl(var(--surface-sunk))] overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted" />
                        <span className="text-sm font-bold text-foreground">Users</span>
                    </div>
                    {usersLoading ? (
                        <div className="p-8 text-center text-sm text-muted">Loading users...</div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted">No users found</div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {users.map((user: any) => (
                                <div key={user.id} className="px-6 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                            {(user.name || user.email || "?")[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{user.name || "Unnamed"}</p>
                                            <p className="text-xs text-muted truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${user.role === "admin" ? "bg-primary/20 text-primary" : "bg-white/5 text-muted"}`}>
                                            {user.role || "member"}
                                        </span>
                                        <span className="text-xs text-muted">{user.credits ?? 0} credits</span>
                                        <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-all" title="Delete user">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
