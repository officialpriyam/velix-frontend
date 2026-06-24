"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Square, Bot, X, Clock, Activity, ChevronDown, Wrench } from 'lucide-react';

interface BotConsoleProps {
    sessionId: string;
    language: string;
    onClose: () => void;
    onFixWithAI?: (error: string) => void;
}

type BotStatus = 'idle' | 'starting' | 'running' | 'stopping' | 'error';

export function BotConsole({ sessionId, language, onClose, onFixWithAI }: BotConsoleProps) {
    const [status, setStatus] = useState<BotStatus>(() => {
        try { return (localStorage.getItem(`velix_bot_status_${sessionId}`) as BotStatus) || 'idle'; } catch { return 'idle'; }
    });
    const [logs, setLogs] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem(`velix_bot_logs_${sessionId}`) || '[]'); } catch { return []; }
    });
    const [showTokenInput, setShowTokenInput] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [maxMinutes, setMaxMinutes] = useState(10);
    const [lastError, setLastError] = useState('');
    const logRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const runningAnnouncedRef = useRef(false);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs]);

    // Persist status and logs to localStorage
    useEffect(() => {
        try { localStorage.setItem(`velix_bot_status_${sessionId}`, status); } catch {}
    }, [status, sessionId]);
    useEffect(() => {
        try { localStorage.setItem(`velix_bot_logs_${sessionId}`, JSON.stringify(logs.slice(-500))); } catch {}
    }, [logs, sessionId]);

    // On mount: check if bot is already running (re-open after close)
    useEffect(() => {
        const checkExisting = async () => {
            try {
                const logRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/ai/bot/logs/${sessionId}`, { credentials: 'include' });
                const logText = await logRes.text();
                let logData: any;
                try { logData = JSON.parse(logText); } catch { return; }
                if (logData.status === 'running' || logData.status === 'starting') {
                    runningAnnouncedRef.current = logData.status === 'running';
                    setStatus(logData.status === 'running' ? 'running' : 'starting');
                    setShowTokenInput(false);
                    if (logData.logs && logData.logs.length > 0) {
                        setLogs(logData.logs);
                    }
                    // Resume polling
                    pollRef.current = setInterval(async () => {
                        try {
                            const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/ai/bot/logs/${sessionId}`, { credentials: 'include' });
                            const t = await r.text();
                            let d: any; try { d = JSON.parse(t); } catch { return; }
                            if (d.logs && d.logs.length > 0) {
                                setLogs(prev => {
                                    const existing = new Set(prev);
                                    const newLogs = d.logs.filter((l: string) => !existing.has(l));
                                    return newLogs.length > 0 ? [...prev, ...newLogs] : prev;
                                });
                            }
                            if (d.status === 'running' && status !== 'running') {
                                setStatus('running');
                            }
                            if (d.status === 'stopped' || d.status === 'error') {
                                setStatus(d.status === 'error' ? 'error' : 'idle');
                                if (d.status === 'error') {
                                    const errLogs = d.logs?.filter((l: string) => l.includes('[ERR]')) || [];
                                    setLastError(errLogs.length > 0 ? errLogs[errLogs.length - 1].replace(/^\[.*?\]\s*\[ERR\]\s*/, '') : 'Bot process failed');
                                }
                                if (timerRef.current) clearInterval(timerRef.current);
                                if (pollRef.current) clearInterval(pollRef.current);
                            }
                        } catch {}
                    }, 2000);
                }
            } catch {}
        };
        checkExisting();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [sessionId]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const addLog = (msg: string) => {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
    };

    const startBot = async () => {
        runningAnnouncedRef.current = false;
        setStatus('starting');
        setShowTokenInput(false);
        addLog('Starting bot session...');
        addLog('Reading token from .env file...');
        addLog(`Session limit: ${maxMinutes} minutes`);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/ai/bot/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    sessionId,
                    language,
                    maxMinutes
                })
            });
            const text = await res.text();
            let data: any;
            try { data = JSON.parse(text); } catch { data = { error: text.slice(0, 200) || 'Server returned non-JSON response' }; }

            if (data.error) {
                addLog(`ERROR: ${data.error}`);
                setLastError(data.error);
                setStatus('error');
                return;
            }

            setStatus('starting');
            setTimeLeft(maxMinutes * 60);

            // Poll for logs
            pollRef.current = setInterval(async () => {
                try {
                    const logRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/ai/bot/logs/${sessionId}`, { credentials: 'include' });
                    const logText = await logRes.text();
                    let logData: any;
                    try { logData = JSON.parse(logText); } catch { return; }
                    if (logData.logs && logData.logs.length > 0) {
                        setLogs(prev => {
                            const existing = new Set(prev);
                            const newLogs = logData.logs.filter((l: string) => !existing.has(l));
                            return newLogs.length > 0 ? [...prev, ...newLogs] : prev;
                        });
                    }
                    // Update status from server
                    if (logData.status === 'running' && !runningAnnouncedRef.current) {
                        runningAnnouncedRef.current = true;
                        setStatus('running');
                        addLog('Bot process started successfully');
                        addLog('Connecting to Discord gateway...');
                        setTimeLeft(maxMinutes * 60);
                        // Start countdown timer
                        timerRef.current = setInterval(() => {
                            setTimeLeft(prev => {
                                if (prev <= 1) {
                                    addLog('Session time limit reached. Stopping bot...');
                                    stopBot();
                                    return 0;
                                }
                                return prev - 1;
                            });
                        }, 1000);
                    }
                    if (logData.status === 'stopped' || logData.status === 'error') {
                        if (pollRef.current) clearInterval(pollRef.current);
                        if (timerRef.current) clearInterval(timerRef.current);
                        pollRef.current = null;
                        timerRef.current = null;
                        setStatus(logData.status === 'error' ? 'error' : 'idle');
                        addLog('Bot process ended');
                        if (logData.status === 'error') {
                            const errLogs = logData.logs?.filter((l: string) => l.includes('[ERR]')) || [];
                            setLastError(errLogs.length > 0 ? errLogs[errLogs.length - 1].replace(/^\[.*?\]\s*\[ERR\]\s*/, '') : 'Bot process failed');
                        }
                    }
                } catch {}
            }, 2000);

        } catch (err: any) {
            addLog(`ERROR: ${err.message || 'Failed to start bot'}`);
            setLastError(err.message || 'Failed to start bot');
            setStatus('error');
        }
    };

    const stopBot = async () => {
        runningAnnouncedRef.current = false;
        setStatus('stopping');
        addLog('Stopping bot...');
        if (timerRef.current) clearInterval(timerRef.current);
        if (pollRef.current) clearInterval(pollRef.current);
        timerRef.current = null;
        pollRef.current = null;

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/ai/bot/stop/${sessionId}`, {
                method: 'POST',
                credentials: 'include'
            });
            addLog('Bot stopped successfully');
        } catch {
            addLog('Bot process terminated');
        }
        setStatus('idle');
        setTimeLeft(0);
    };

    const statusColors: Record<BotStatus, string> = {
        idle: 'text-muted',
        starting: 'text-yellow-500',
        running: 'text-green-500',
        stopping: 'text-orange-500',
        error: 'text-red-500'
    };

    const statusLabels: Record<BotStatus, string> = {
        idle: 'IDLE',
        starting: 'INSTALLING',
        running: 'RUNNING',
        stopping: 'STOPPING',
        error: 'ERROR'
    };

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col h-[70vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--surface-sunk))]">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-foreground">Bot Console</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[hsl(var(--surface-sunk))] text-[10px] font-bold uppercase">
                        <span className={statusColors[status]}>●</span>
                        <span className={statusColors[status]}>{statusLabels[status]}</span>
                    </div>
                    {status === 'running' && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                            <Clock className="w-3 h-3" />
                            {formatTime(timeLeft)}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {status === 'error' && onFixWithAI && (
                        <button onClick={() => onFixWithAI(lastError || 'Bot process failed')}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-white hover:opacity-90 transition-all">
                            <Wrench className="w-3.5 h-3.5" /> Fix with AI
                        </button>
                    )}
                    {status === 'idle' || status === 'error' ? (
                        <button onClick={startBot}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all">
                            <Play className="w-3.5 h-3.5" /> Start Bot
                        </button>
                    ) : (
                        <button onClick={stopBot} disabled={status === 'stopping'}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50">
                            <Square className="w-3.5 h-3.5" /> Stop
                        </button>
                    )}
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--surface-sunk))] text-muted hover:text-foreground transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Info bar */}
            <div className="px-4 py-2 bg-primary/5 border-b border-[hsl(var(--surface-sunk))] flex items-center gap-4 text-[11px] text-muted">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {maxMinutes} min sessions</span>
                <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Real-time logs</span>
                <span className="flex items-center gap-1"><Bot className="w-3 h-3" /> Live Discord bot</span>
            </div>

            {/* Session config */}
            {showTokenInput && (
                <div className="px-4 py-3 border-b border-[hsl(var(--surface-sunk))]">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="text-[11px] font-bold text-muted mb-1.5 block">Session Duration</label>
                            <select value={maxMinutes} onChange={(e) => setMaxMinutes(Number(e.target.value))}
                                className="px-3 py-2 text-xs rounded-lg bg-[hsl(var(--surface-sunk))] border border-white/10 text-foreground">
                                <option value={5}>5 minutes</option>
                                <option value={10}>10 minutes</option>
                                <option value={15}>15 minutes</option>
                                <option value={20}>20 minutes</option>
                            </select>
                        </div>
                        <div className="flex-1 text-[11px] text-muted">
                            <p>Token is read from the <code className="px-1 py-0.5 rounded bg-white/5 font-mono">.env</code> file in your project.</p>
                            <p className="mt-1">Make sure <code className="px-1 py-0.5 rounded bg-white/5 font-mono">DISCORD_TOKEN=your_token</code> is set.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Console output */}
            <div className="flex-1 overflow-hidden">
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="neu-inset w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                            <Terminal className="w-8 h-8 text-faint" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground mb-1">Console Output</h3>
                        <p className="text-xs text-muted max-w-xs">
                            {status === 'idle'
                                ? 'Click "Start Bot" to launch a test session and see your bot\'s logs here'
                                : 'Waiting for bot output...'}
                        </p>
                    </div>
                ) : (
                    <div ref={logRef} className="h-full overflow-y-auto p-4 font-mono text-[11px] leading-relaxed bg-[#0d1117]">
                        {logs.map((log, i) => (
                            <div key={i} className={`py-0.5 ${
                                log.includes('ERROR') ? 'text-red-400' :
                                log.includes('SUCCESS') || log.includes('connected') ? 'text-green-400' :
                                log.includes('WARN') ? 'text-yellow-400' :
                                'text-gray-400'
                            }`}>
                                {log}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
