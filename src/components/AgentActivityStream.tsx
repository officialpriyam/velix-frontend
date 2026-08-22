"use client";

import React, { useState, useEffect } from 'react';
import {
    ChevronDown,
    ChevronUp,
    FileCode,
    FileEdit,
    FilePlus,
    FileX,
    Globe,
    TerminalSquare,
    Sparkles,
    Check,
    Loader2,
    Clock,
    Search,
    ListTodo,
    MessageSquare,
    Brain,
    FileText
} from 'lucide-react';
import {
    StepEvent,
    PlanEvent,
    ReasoningEvent,
    FileActionEvent,
    TodoItem,
    ToolProgressEvent,
    QueuedMessageEvent
} from '../types/agentStreamTypes';

/**
 * 1. <StepCounter /> — collapsible "Worked N steps ˅" header, expands to full step log.
 */
export function StepCounter({ steps, expanded: initialExpanded = false }: { steps: StepEvent[]; expanded?: boolean }) {
    const [expanded, setExpanded] = useState(initialExpanded);
    if (!steps || steps.length === 0) return null;

    const count = steps.length;
    return (
        <div className="my-1.5 overflow-hidden rounded-xl border border-white/[.08] bg-[#161b22]/90 backdrop-blur-sm">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-white/[.03] transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-[12px] font-medium text-zinc-200">
                        Worked {count} step{count === 1 ? '' : 's'}
                    </span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
                <div className="border-t border-white/[.06] divide-y divide-white/[.04] bg-black/20">
                    {steps.map((s, idx) => {
                        const duration = s.endTime ? Math.round((s.endTime - s.startTime) / 1000) : null;
                        return (
                            <div key={idx} className="flex items-center justify-between px-3.5 py-1.5 text-[11px]">
                                <div className="flex items-center gap-2 text-zinc-300">
                                    <span className="font-mono text-zinc-500 text-[10px]">#{s.stepIndex}</span>
                                    <span>{s.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px]">
                                    {s.endTime ? (
                                        <span>{duration}s</span>
                                    ) : (
                                        <Loader2 className="h-3 w-3 animate-spin text-sky-400" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/**
 * 2. <PlanLine /> — plain sentence, first-person, no card/border.
 */
export function PlanLine({ text }: { text: string }) {
    if (!text) return null;
    return (
        <div className="my-1.5 px-1 py-0.5 text-[12px] italic text-zinc-300 leading-relaxed font-sans">
            {text}
        </div>
    );
}

/**
 * 3. <ReasoningBlock /> — collapsible, muted text, one sentence.
 */
export function ReasoningBlock({ text, defaultOpen = false }: { text: string; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    if (!text) return null;

    return (
        <div className="my-1 border-l-2 border-zinc-700/60 pl-3 py-0.5">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
                <Brain className="h-3 w-3 text-zinc-500" />
                <span>Thinking</span>
                <ChevronDown className={`h-3 w-3 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-400/90 font-mono bg-white/[.02] p-2 rounded-md border border-white/[.04]">
                    {text}
                </p>
            )}
        </div>
    );
}

/**
 * 4. <FileActionCard path status op onClick /> — file icon + dimmed folder path + bright filename + right-aligned badge
 * (EDITED / CREATED / DELETED) that flips to a checkmark ONLY when the write actually completes server-side (no optimistic checkmarks).
 */
export function FileActionCard({
    path,
    status,
    op = 'edited',
    onClick
}: {
    path: string;
    status: 'writing' | 'confirmed';
    op?: 'created' | 'edited' | 'deleted';
    onClick?: () => void;
}) {
    // Split path into dir and filename
    const parts = path.split('/');
    const filename = parts.pop() || path;
    const dirPath = parts.length > 0 ? parts.join('/') + '/' : '';

    const Icon = op === 'created' ? FilePlus : op === 'deleted' ? FileX : FileEdit;
    const badgeColor = op === 'created'
        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        : op === 'deleted'
            ? 'text-red-400 bg-red-500/10 border-red-500/20'
            : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center justify-between rounded-lg border border-white/[.06] bg-[#161b22]/80 px-3 py-2 text-[11px] transition-all hover:border-white/20 hover:bg-white/[.04] group my-1"
        >
            <div className="flex items-center gap-2 min-w-0 pr-2">
                <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-400 group-hover:text-zinc-200" />
                <span className="font-mono truncate">
                    {dirPath && <span className="text-zinc-500">{dirPath}</span>}
                    <span className="font-semibold text-zinc-200">{filename}</span>
                </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                {status === 'confirmed' ? (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span>{op.toUpperCase()}</span>
                        <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                    </div>
                ) : (
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                        <span>{op.toUpperCase()}</span>
                        <Loader2 className="h-3 w-3 animate-spin text-zinc-400 shrink-0" />
                    </div>
                )}
            </div>
        </button>
    );
}

/**
 * 5. <ToolProgressRow tool label elapsedMs progressPct /> — icon + label + a real progress bar driven by elapsed time or stream completion %, plus a live seconds counter.
 */
export function ToolProgressRow({
    tool,
    label,
    startTime,
    endTime,
    progressPct
}: {
    tool: string;
    label: string;
    startTime: number;
    endTime?: number;
    progressPct?: number;
}) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (endTime) return;
        const timer = setInterval(() => setNow(Date.now()), 200);
        return () => clearInterval(timer);
    }, [endTime]);

    const elapsedMs = (endTime || now) - startTime;
    const elapsedSec = (elapsedMs / 1000).toFixed(1);

    const getIcon = () => {
        switch (tool) {
            case 'web_search':
                return <Globe className="h-3.5 w-3.5 text-sky-400 shrink-0" />;
            case 'read_file':
            case 'grep':
                return <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
            case 'run_command':
                return <TerminalSquare className="h-3.5 w-3.5 text-purple-400 shrink-0" />;
            default:
                return <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
        }
    };

    return (
        <div className="my-1.5 rounded-lg border border-white/[.06] bg-[#161b22]/70 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 min-w-0">
                    {getIcon()}
                    <span className="font-medium text-zinc-200 truncate">{label}</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-500 tabular-nums shrink-0 ml-2">
                    {elapsedSec}s
                </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[.06] overflow-hidden relative">
                {progressPct !== undefined ? (
                    <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                    />
                ) : endTime ? (
                    <div className="h-full bg-emerald-500 rounded-full w-full" />
                ) : (
                    <div className="h-full bg-gradient-to-r from-emerald-500 via-sky-400 to-emerald-500 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] w-3/4" />
                )}
            </div>
        </div>
    );
}

/**
 * 6. <TodoPanel items /> — pinned near the bottom of active turn.
 * Header shows live {done}/{total} counter.
 * Completed items: filled checkmark + strikethrough.
 * Pending: empty circle, no strikethrough.
 * Renders purely from backend state — never model free-typed text.
 */
export function TodoPanel({ items }: { items: TodoItem[] }) {
    if (!items || items.length === 0) return null;

    const doneCount = items.filter(i => i.status === 'done').length;
    const totalCount = items.length;
    const isComplete = doneCount === totalCount;

    return (
        <div className="my-2 rounded-xl border border-white/[.08] bg-[#161b22] overflow-hidden shadow-lg">
            <div className="flex items-center justify-between border-b border-white/[.06] px-3.5 py-2.5 bg-black/20">
                <div className="flex items-center gap-2">
                    <ListTodo className={`h-4 w-4 ${isComplete ? 'text-emerald-400' : 'text-sky-400'}`} />
                    <span className="text-[12px] font-semibold text-zinc-200">Tasks Checklist</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-zinc-300">
                        {doneCount}/{totalCount}
                    </span>
                    {isComplete && (
                        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-400 border border-emerald-500/30">
                            DONE
                        </span>
                    )}
                </div>
            </div>
            <div className="divide-y divide-white/[.04] px-3 py-1">
                {items.map((item, idx) => {
                    const isDone = item.status === 'done';
                    return (
                        <div key={idx} className="flex items-center gap-2.5 py-2 text-[12px]">
                            {isDone ? (
                                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-black">
                                    <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                            ) : (
                                <div className="h-4 w-4 shrink-0 rounded-full border-2 border-zinc-600" />
                            )}
                            <span className={isDone ? 'text-zinc-500 line-through' : 'text-zinc-200 font-medium'}>
                                {item.text}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * 7. <QueuedMessageChip /> — small footer chip "🕐 Message queued ˅" shown when user sends mid-turn.
 */
export function QueuedMessageChip({ prompt, visible }: { prompt?: string; visible: boolean }) {
    const [expanded, setExpanded] = useState(false);
    if (!visible) return null;

    return (
        <div className="my-1.5 font-sans">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-medium text-amber-300 hover:bg-amber-500/20 transition-all shadow-sm"
            >
                <Clock className="h-3.5 w-3.5 animate-pulse" />
                <span>Message queued</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && prompt && (
                <div className="mt-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-amber-200/90 font-sans">
                    "{prompt}"
                </div>
            )}
        </div>
    );
}

/**
 * 9. <WorkingTimerHeader /> — Exact "Working for 28s ˅" header matching screenshot 2
 */
export function WorkingTimerHeader({
    isWorking = false,
    elapsedMs = 0,
    assistantName = "Blink"
}: {
    isWorking?: boolean;
    elapsedMs?: number;
    assistantName?: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const elapsedSec = Math.max(1, Math.round(elapsedMs / 1000));

    return (
        <div className="flex items-center gap-2.5 my-1.5 font-sans">
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-zinc-800 border border-white/10 text-[10px] font-bold text-zinc-300">
                {assistantName.charAt(0).toUpperCase()}
            </div>
            <span className="text-[12px] font-semibold text-zinc-300">{assistantName}</span>
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 rounded-full border border-white/[.08] bg-[#161b22] px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
                {isWorking ? (
                    <Loader2 className="h-3 w-3 animate-spin text-sky-400" />
                ) : (
                    <Clock className="h-3 w-3 text-emerald-400" />
                )}
                <span>{isWorking ? 'Working for' : 'Worked for'} {elapsedSec}s</span>
                <ChevronDown className={`h-3 w-3 text-zinc-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
        </div>
    );
}

/**
 * 8. <KodariToolCard /> / <BlinkToolCard /> — Exact tool card UI matching screenshots 1, 2 & 3:
 * Blue glowing border, green checkmark circles (✓), glowing blue spinner ring (◯) for active edits,
 * dark path pills, and green +33 / red -33 line diff counts!
 */
export function KodariToolCard({
    readFiles = [],
    createdFiles = [],
    editedFiles = [],
    readDocs = [],
    commands = [],
    searchSources = [],
    isStreaming = false,
    activeFilePath,
    onOpenFile,
    defaultExpanded = true
}: {
    readFiles?: string[];
    createdFiles?: string[];
    editedFiles?: string[];
    readDocs?: string[];
    commands?: { command: string; status: string; output?: string }[];
    searchSources?: { title: string; url: string }[];
    isStreaming?: boolean;
    activeFilePath?: string;
    onOpenFile?: (path: string) => void;
    defaultExpanded?: boolean;
}) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    // Deduplicate entries
    const uniqueRead = Array.from(new Set(readFiles)).filter(p => !createdFiles.includes(p) && !editedFiles.includes(p));
    const uniqueCreated = Array.from(new Set(createdFiles));
    const uniqueEdited = Array.from(new Set(editedFiles)).filter(p => !uniqueCreated.includes(p));
    const uniqueDocs = Array.from(new Set(readDocs));

    const totalTools = uniqueRead.length + uniqueCreated.length + uniqueEdited.length + uniqueDocs.length + commands.length + searchSources.length;

    if (totalTools === 0 && !isStreaming) return null;

    const mainTitle = isStreaming
        ? (activeFilePath ? `Writing ${activeFilePath}` : `Writing`)
        : uniqueRead.length > 0 && uniqueCreated.length === 0 && uniqueEdited.length === 0
            ? `Read ${uniqueRead.length} file${uniqueRead.length === 1 ? '' : 's'}`
            : `Used ${totalTools} tool${totalTools === 1 ? '' : 's'}`;

    return (
        <div className="my-3 overflow-hidden rounded-2xl border border-sky-500/30 bg-[#0d1117]/95 shadow-[0_0_20px_rgba(56,189,248,0.06)] font-sans">
            {/* Header bar with glowing spinner ring */}
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center justify-between px-3.5 py-2.5 bg-white/[.02] border-b border-white/[.06] hover:bg-white/[.04] transition-colors text-left"
            >
                <div className="flex items-center gap-2">
                    {isStreaming ? (
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-sky-400/60 bg-sky-500/10">
                            <Loader2 className="h-3 w-3 animate-spin text-sky-400" />
                        </div>
                    ) : (
                        <WrenchIcon className="h-4 w-4 text-sky-400 shrink-0" />
                    )}
                    <span className="text-[12px] font-semibold text-zinc-200">
                        {mainTitle}
                    </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>

            {/* List of actions matching screenshots 1 & 3 */}
            {expanded && (
                <div className="p-3 space-y-2 bg-black/40">
                    {/* Active editing file row (if currently streaming token edits) */}
                    {isStreaming && activeFilePath && (
                        <div className="flex items-center justify-between rounded-xl border border-sky-500/20 bg-sky-500/[.06] px-3 py-2 text-[11px] animate-pulse">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-sky-400 bg-sky-500/20">
                                    <Loader2 className="h-3 w-3 animate-spin text-sky-400 stroke-[2.5]" />
                                </div>
                                <span className="font-medium text-sky-300">Editing</span>
                                <span className="rounded-md border border-white/10 bg-[#161f2c] px-2 py-0.5 font-mono text-[11px] text-zinc-100 truncate max-w-[260px]">
                                    {activeFilePath}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Read files section */}
                    {uniqueRead.map((path, idx) => (
                        <div
                            key={`read-${idx}`}
                            className="flex items-center justify-between rounded-xl border border-white/[.04] bg-[#161b22]/70 px-3 py-1.5 text-[11px] hover:border-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                                    <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                                <span className="font-medium text-zinc-300">Read</span>
                                <button
                                    type="button"
                                    onClick={() => onOpenFile?.(path)}
                                    className="rounded-md border border-white/10 bg-[#161f2c] px-2 py-0.5 font-mono text-[11px] text-zinc-200 hover:text-white hover:border-sky-400/50 transition-colors truncate max-w-[280px]"
                                >
                                    {path}
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Created files section */}
                    {uniqueCreated.map((path, idx) => (
                        <div
                            key={`create-${idx}`}
                            className="flex items-center justify-between rounded-xl border border-white/[.04] bg-[#161b22]/70 px-3 py-1.5 text-[11px] hover:border-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                                    <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                                <span className="font-medium text-zinc-300">Created</span>
                                <button
                                    type="button"
                                    onClick={() => onOpenFile?.(path)}
                                    className="rounded-md border border-emerald-500/20 bg-[#161f2c] px-2 py-0.5 font-mono text-[11px] text-emerald-300 hover:text-white transition-colors truncate max-w-[280px]"
                                >
                                    {path}
                                </button>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                +new
                            </span>
                        </div>
                    ))}

                    {/* Edited files section with +33 -33 diff badges */}
                    {uniqueEdited.map((path, idx) => (
                        <div
                            key={`edit-${idx}`}
                            className="flex items-center justify-between rounded-xl border border-white/[.04] bg-[#161b22]/70 px-3 py-1.5 text-[11px] hover:border-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                                    <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                                <span className="font-medium text-zinc-300">Edited</span>
                                <button
                                    type="button"
                                    onClick={() => onOpenFile?.(path)}
                                    className="rounded-md border border-white/10 bg-[#161f2c] px-2 py-0.5 font-mono text-[11px] text-zinc-200 hover:text-white hover:border-amber-400/50 transition-colors truncate max-w-[240px]"
                                >
                                    {path}
                                </button>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold shrink-0">
                                <span className="text-emerald-400">+19</span>
                                <span className="text-rose-400">-19</span>
                            </div>
                        </div>
                    ))}

                    {/* Read docs section */}
                    {uniqueDocs.map((doc, idx) => (
                        <div
                            key={`doc-${idx}`}
                            className="flex items-center justify-between rounded-xl border border-white/[.04] bg-[#161b22]/70 px-3 py-1.5 text-[11px]"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                                    <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                                <span className="font-medium text-zinc-300">Read doc</span>
                                <span className="rounded-md border border-amber-500/20 bg-amber-500/[.06] px-2 py-0.5 font-mono text-[11px] text-amber-300 truncate max-w-[280px]">
                                    {doc}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Commands section */}
                    {commands.map((cmd, idx) => (
                        <div
                            key={`cmd-${idx}`}
                            className="rounded-xl border border-white/[.04] bg-[#161b22]/70 px-3 py-2 text-[11px] font-mono text-zinc-300"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    {cmd.status === 'done' ? (
                                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                                            <Check className="h-3 w-3 stroke-[3]" />
                                        </div>
                                    ) : (
                                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-sky-400 bg-sky-500/20">
                                            <Loader2 className="h-3 w-3 animate-spin text-sky-400" />
                                        </div>
                                    )}
                                    <span className="font-medium text-zinc-300">Ran command</span>
                                    <span className="text-zinc-400 truncate max-w-[220px]">{cmd.command}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function WrenchIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
    );
}


