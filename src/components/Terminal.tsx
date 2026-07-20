"use client";

import React from 'react';
import { Terminal as TerminalIcon, Play, Loader2, Sparkles, Clock, Download, X } from 'lucide-react';

interface TerminalProps {
    output: string;
    loading: boolean;
    onRun: () => void;
    isDiscordBot?: boolean;
    onAutoFix?: (error: string) => void;
    history?: any[];
    onDownload?: (historyId: number) => void;
}

export const Terminal = ({ output, loading, onRun, isDiscordBot = false, onAutoFix, history = [], onDownload }: TerminalProps) => {
    const [showHistory, setShowHistory] = React.useState(false);

    // Simple error detection
    const hasError = output && (
        output.toLowerCase().includes('error') ||
        output.toLowerCase().includes('exception') ||
        output.toLowerCase().includes('failed') ||
        output.toLowerCase().includes('fatal')
    );

    const latestArtifact = history.length > 0 && history[0].success && history[0].artifact_path ? history[0] : null;

    return (
        <div className="h-full border-t border-[hsl(var(--neu-dark)/0.4)] neu-inset flex flex-col shadow-2xl relative">
            {/* History Overlay */}
            {showHistory && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
                    <div className="px-4 py-2 border-b border-[hsl(var(--surface-sunk))] flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Compilation History</span>
                        <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-[hsl(var(--surface-sunk))] rounded-lg text-muted hover:text-foreground transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {history.length > 0 ? (
                            history.map((item, idx) => (
                                <div key={idx} className="p-2 mb-1 rounded-xl bg-[hsl(var(--surface-sunk))] border border-[hsl(var(--surface-sunk))] flex items-center justify-between group hover:bg-[hsl(var(--surface-sunk))] transition-all">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${item.success ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className="text-xs font-medium text-foreground">
                                                {new Date(item.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        {item.artifact_path && (
                                            <span className="text-[10px] text-muted mt-1 truncate max-w-[200px] font-mono">
                                                {item.artifact_path.split(/[\\/]/).pop()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {item.artifact_path && item.success && (
                                            <button
                                                onClick={() => onDownload?.(item.id)}
                                                className="p-1.5 hover:bg-[hsl(var(--primary)/0.15)] text-muted hover:text-primary rounded-lg transition-all"
                                                title="Download Artifact"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-faint">
                                <Clock className="w-8 h-8 mb-2 opacity-20" />
                                <span className="text-xs">No history yet</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="px-4 py-2 border-b border-[hsl(var(--neu-dark)/0.4)] flex items-center justify-between bg-surface">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                    <TerminalIcon className="w-3.5 h-3.5" /> Terminal Output
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(true)}
                        className="flex items-center gap-2 px-3 py-1 bg-[hsl(var(--surface-sunk))] hover:bg-[hsl(var(--surface-sunk))] text-muted hover:text-foreground rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border border-[hsl(var(--surface-sunk))]"
                    >
                        <Clock className="w-3 h-3" /> History
                    </button>

                    {latestArtifact && (
                        <button
                            onClick={() => onDownload?.(latestArtifact.id)}
                            className="flex items-center gap-2 px-3 py-1 bg-[hsl(var(--primary)/0.15)] hover:bg-[hsl(var(--primary)/0.15)] text-primary border border-[hsl(var(--text)/0.2)] rounded-md text-[10px] font-bold uppercase tracking-wider transition-all animate-pulse shadow-[0_0_15px_rgba(45,212,191,0.2)]"
                        >
                            <Download className="w-3 h-3" /> Download Build
                        </button>
                    )}

                    {hasError && onAutoFix && !loading && (
                        <button
                            onClick={() => onAutoFix(output)}
                            className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border border-amber-500/20 animate-in fade-in zoom-in duration-300"
                        >
                            <Sparkles className="w-3 h-3" /> Auto Fix
                        </button>
                    )}
                    <button
                        onClick={onRun}
                        disabled={loading}
                        className={`neu-button-success flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${isDiscordBot
                            ? "text-primary"
                            : "text-success"
                            }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" /> {isDiscordBot ? "Starting..." : "Compiling..."}
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3 fill-current" /> {isDiscordBot ? "Run Bot" : "Compile & Run"}
                            </>
                        )}
                    </button>
                </div>
            </div>
            <div className="flex-1 p-4 font-mono text-sm overflow-y-auto overflow-x-hidden neu-inset scrollbar-thin scrollbar-thumb-zinc-800">
                {output ? (
                    <pre className={`whitespace-pre-wrap break-words leading-relaxed ${hasError ? 'text-danger' : 'text-muted'}`}>{output}</pre>
                ) : (
                    <div className="text-faint italic">No output yet. Click '{isDiscordBot ? "Run Bot" : "Compile & Run"}' to execute.</div>
                )}
            </div>
        </div>
    );
};
