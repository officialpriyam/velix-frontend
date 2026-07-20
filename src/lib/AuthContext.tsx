"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api';

interface AuthContextType {
    user: any;
    setUser: (user: any) => void;
    isAuthOpen: boolean;
    setIsAuthOpen: (open: boolean) => void;
    isDocsOpen: boolean;
    setIsDocsOpen: (open: boolean) => void;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUserState] = useState<any>(null);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isDocsOpen, setIsDocsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authApi.me()
            .then((res: any) => {
                if (res.user) setUserState(res.user);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const setUser = useCallback((u: any) => {
        setUserState(u);
        if (u) setLoading(false);
    }, []);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch {
            // ignore errors
        }
        setUserState(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, isAuthOpen, setIsAuthOpen, isDocsOpen, setIsDocsOpen, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        // Fallback for components rendered outside provider (shouldn't happen)
        return {
            user: null,
            setUser: () => {},
            isAuthOpen: false,
            setIsAuthOpen: () => {},
            isDocsOpen: false,
            setIsDocsOpen: () => {},
            logout: async () => {},
            loading: false,
        };
    }
    return ctx;
}
