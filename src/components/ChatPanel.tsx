"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import { ModelSelector } from './ModelSelector';
import {
    Send, Sparkles, User, Bot, FileCode, Check, AlertCircle, Loader2, Copy, Hammer, X,
    FileText, File, FileCog, Download, CreditCard, Paperclip, Image, Trash2, Square,
    Globe, Brain, Eye, ChevronDown, TerminalSquare, Circle, CheckCircle2, Clock,
    ChevronRight, ListChecks, Code2, BookOpen, Wrench, PanelRightClose
} from 'lucide-react';
import { aiApi, copyToClipboard } from '../lib/api';
import { useNotification } from './Notification';
import { showConfirm } from './ConfirmDialog';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';

interface Message {
    id?: number;
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
    files?: any[];
    attachments?: { name: string; type: string; size: number }[];
    workingStatus?: string;
    planData?: any;
    questions?: any[];
    message_type?: string;
    metadata?: any;
}

export interface BuildResult {
    success: boolean;
    log: string;
    compiler?: string;
    timestamp?: string;
    historyId?: number;
}

interface ChatPanelProps {
    sessionId?: string | null;
    onCodeGenerated: (sessionId: string, aiResponse: any) => void;
    model?: string;
    language?: string;
    platform?: string;
    compact?: boolean;
    onPromptSubmit?: (prompt: string) => void;
    initialPrompt?: string | null;
    onInitialPromptHandled?: () => void;
    highlight?: string;
    modelDropdown?: React.ReactNode;
    typeDropdown?: React.ReactNode;
    buildResult?: BuildResult | null;
    compiling?: boolean;
    autoCompile?: boolean;
    onClearBuildResult?: () => void;
    onAutoFix?: (error: string) => void;
    onDownloadArtifact?: (historyId: number) => void;
    projectFiles?: Record<string, string>;
    onPlanCreated?: (content: string) => void;
    onOpenPlanFile?: () => void;
    onFileStream?: (file: { path: string; content: string }) => void;
    onOpenFile?: (path: string) => void;
    initialPromptForceBuild?: boolean;
}

function getFileIcon(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['kt', 'kts'].includes(ext)) return <FileCog className="w-3 h-3" />;
    if (['yml', 'yaml'].includes(ext)) return <FileText className="w-3 h-3" />;
    if (['xml', 'gradle', 'json', 'properties'].includes(ext)) return <FileCode className="w-3 h-3" />;
    return <File className="w-3 h-3" />;
}

function getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'kt') return 'Kotlin';
    if (ext === 'kts') return 'Gradle KTS';
    if (ext === 'java') return 'Java';
    if (ext === 'yml' || ext === 'yaml') return 'YAML';
    if (ext === 'xml') return 'XML';
    if (ext === 'json') return 'JSON';
    if (ext === 'gradle') return 'Gradle';
    if (ext === 'properties') return 'Properties';
    if (ext === 'py') return 'Python';
    if (ext === 'js' || ext === 'ts') return 'JavaScript';
    return ext.toUpperCase();
}

function formatPlanMarkdown(plan: any, questions: any[] = []) {
    const lines = [`# ${plan?.title || 'Project Plan'}`, '', plan?.summary || ''];
    if (plan?.components?.length) {
        lines.push('', "## What I'll build", '');
        plan.components.forEach((component: any) => lines.push(`- **${component.name}** — ${component.desc}`));
    }
    if (plan?.designDirection?.length) lines.push('', '## Design direction', '', ...plan.designDirection.map((item: string) => `- ${item}`));
    if (questions.length) lines.push('', '## Decisions to confirm', '', ...questions.map((question: any) => `- ${question.question}`));
    return lines.join('\n');
}

function parseMetadata(metadata: any) {
    if (!metadata) return {};
    if (typeof metadata === 'string') {
        try { return JSON.parse(metadata); } catch { return {}; }
    }
    return metadata;
}

function formatElapsed(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

/* ─── Collapsible Section ────────────────────────────────────────────── */
function CollapsibleSection({
    title,
    icon,
    count,
    defaultOpen = true,
    children,
    className = '',
    headerRight,
}: {
    title: string;
    icon: React.ReactNode;
    count?: number;
    defaultOpen?: boolean;
    children: React.ReactNode;
    className?: string;
    headerRight?: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className={`border border-white/[.08] rounded-lg overflow-hidden bg-[#10151b]/80 ${className}`}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center w-full px-3 py-2 text-left hover:bg-white/[.03] transition-colors"
            >
                {icon}
                <span className="ml-2 text-[11px] font-semibold text-zinc-300">{title}</span>
                {count !== undefined && (
                    <span className="ml-1.5 text-[10px] text-zinc-500">{count}</span>
                )}
                {headerRight}
                <ChevronDown className={`ml-auto w-3.5 h-3.5 text-zinc-500 transition-transform duration-150 ${open ? '' : '-rotate-90'}`} />
            </button>
            {open && <div className="px-3 pb-2">{children}</div>}
        </div>
    );
}

/* ─── File Badge (EDITED / CREATED) ──────────────────────────────────── */
function FileBadge({ path, edited }: { path: string; edited?: boolean }) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-white/[.06] bg-white/[.02]">
            {getFileIcon(path)}
            <span className="text-[11px] text-zinc-400 font-mono truncate">{path}</span>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 font-medium shrink-0">
                {edited ? 'EDITED' : 'CREATED'}
                <Check className="w-3 h-3" />
            </span>
        </div>
    );
}

/* ─── Running Tool Indicator ─────────────────────────────────────────── */
function RunningToolIndicator({ label, elapsed }: { label: string; elapsed: number }) {
    return (
        <div className="flex items-center gap-3 px-3 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
            <span className="text-[11px] font-semibold text-zinc-200">{label}</span>
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full animate-[indeterminate_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
            </div>
            <span className="text-[10px] text-zinc-500 tabular-nums shrink-0">{formatElapsed(elapsed)}</span>
        </div>
    );
}

/* ─── Streaming Output Indicator ─────────────────────────────────────── */
function StreamingIndicator({ elapsed }: { elapsed: number }) {
    return (
        <div className="flex items-center gap-3 px-3 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
            <span className="text-[11px] text-zinc-300">
                <span className="font-semibold">Writing response</span>
                <span className="text-zinc-500 mx-1.5">·</span>
                <span className="text-zinc-500">streaming output</span>
            </span>
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full animate-[indeterminate_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
            </div>
            <span className="text-[10px] text-zinc-500 tabular-nums shrink-0">{formatElapsed(elapsed)}</span>
        </div>
    );
}

/* ─── To-Dos Checklist ───────────────────────────────────────────────── */
function TodosChecklist({ todos, completedCount }: { todos: string[]; completedCount: number }) {
    const [expanded, setExpanded] = useState(true);
    if (!todos.length) return null;
    return (
        <div className="border border-white/[.08] rounded-lg overflow-hidden bg-[#10151b]/80">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center w-full px-3 py-2 text-left hover:bg-white/[.03] transition-colors"
            >
                <ListChecks className="w-3.5 h-3.5 text-zinc-400" />
                <span className="ml-2 text-[11px] font-semibold text-zinc-300">To-dos</span>
                <span className="ml-1.5 text-[10px] text-zinc-500">{completedCount}/{todos.length}</span>
                <ChevronDown className={`ml-auto w-3.5 h-3.5 text-zinc-500 transition-transform duration-150 ${expanded ? '' : '-rotate-90'}`} />
            </button>
            {expanded && (
                <div className="px-3 pb-2 space-y-1">
                    {todos.map((todo, i) => {
                        const done = i < completedCount;
                        return (
                            <div key={i} className="flex items-start gap-2 py-1">
                                {done ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                    <Circle className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                                )}
                                <span className={`text-[11px] leading-relaxed ${done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                                    {todo}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ─── Steps Counter ──────────────────────────────────────────────────── */
function StepsCounter({ count }: { count: number }) {
    const [expanded, setExpanded] = useState(false);
    if (count === 0) return null;
    return (
        <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
            <span>Worked {count} step{count !== 1 ? 's' : ''}</span>
            <ChevronRight className={`w-3 h-3 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} />
        </button>
    );
}

/* ─── Message Queued Bar ─────────────────────────────────────────────── */
function MessageQueuedBar() {
    return (
        <div className="flex items-center gap-2 px-3 py-2 border border-white/[.06] rounded-lg bg-[#10151b]/60">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px] text-zinc-500">Message queued</span>
        </div>
    );
}

export const ChatPanel = ({
    sessionId,
    onCodeGenerated,
    compact = false,
    onPromptSubmit,
    projectFiles,
    platform = 'minecraft',
    language = 'java',
    model = 'priyx-ultra',
    modelDropdown,
    typeDropdown,
    highlight = '',
    autoCompile = true,
    buildResult,
    compiling = false,
    onClearBuildResult,
    onAutoFix,
    onDownloadArtifact,
    initialPrompt,
    onInitialPromptHandled,
    onPlanCreated,
    onOpenPlanFile,
    onFileStream,
    onOpenFile,
    initialPromptForceBuild
}: ChatPanelProps) => {
    const { showNotification } = useNotification();
    const router = useRouter();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusLog, setStatusLog] = useState<{ message: string; type: 'pending' | 'done' | 'error' }[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [generatedFiles, setGeneratedFiles] = useState<{ created: string[]; edited: string[] }>({ created: [], edited: [] });
    const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: string; content: string; size: number }[]>([]);
    const [enableWebSearch, setEnableWebSearch] = useState(false);
    const [chatMode, setChatMode] = useState(false);
    const [planPrompt, setPlanPrompt] = useState('');
    const [execMode, setExecMode] = useState<'build' | 'plan' | 'chat'>('plan');
    const [showExecModeDropdown, setShowExecModeDropdown] = useState(false);

    const [planningData, setPlanningData] = useState<{ questions: any[]; plan: any } | null>(null);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [customAnswerText, setCustomAnswerText] = useState('');
    const [planApproved, setPlanApproved] = useState(false);

    const [searchStatus, setSearchStatus] = useState<{ queries: string[]; sources: { title: string; url: string }[] } | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const autoSubmittedPromptRef = useRef<string | null>(null);
    const { user } = useAuth();

    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [agentCount, setAgentCount] = useState(0);
    const [runningTool, setRunningTool] = useState<string | null>(null);
    const [todos, setTodos] = useState<string[]>([]);
    const [completedTodos, setCompletedTodos] = useState(0);
    const [stepCount, setStepCount] = useState(0);
    const [activeSection, setActiveSection] = useState<'reasoning' | 'todos' | 'files' | 'read'>('reasoning');

    const statusLogKey = sessionId ? `velix_status_log_${sessionId}` : '';
    const generatedFilesKey = sessionId ? `velix_generated_files_${sessionId}` : '';
    const messagesKey = sessionId ? `velix_messages_${sessionId}` : '';

    const isConfig = language?.startsWith('config-');
    const isDatapack = language?.startsWith('datapack-');
    const isScripting = language?.startsWith('scripting-');

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const MAX_FILES = 5;

    const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1] || result;
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const newFiles = Array.from(files).slice(0, MAX_FILES - attachedFiles.length);
        const processed: { name: string; type: string; content: string; size: number }[] = [];
        for (const file of newFiles) {
            if (file.size > MAX_FILE_SIZE) {
                showNotification(`File "${file.name}" exceeds 10MB limit`, 'error');
                continue;
            }
            try {
                const isImage = file.type.startsWith('image/');
                const content = isImage ? await readFileAsBase64(file) : await readFileAsText(file);
                processed.push({ name: file.name, type: file.type, content, size: file.size });
            } catch {
                showNotification(`Failed to read "${file.name}"`, 'error');
            }
        }
        setAttachedFiles(prev => [...prev, ...processed].slice(0, MAX_FILES));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;
        const newFiles = Array.from(files).slice(0, MAX_FILES - attachedFiles.length);
        const processed: { name: string; type: string; content: string; size: number }[] = [];
        for (const file of newFiles) {
            if (file.size > MAX_FILE_SIZE) {
                showNotification(`File "${file.name}" exceeds 10MB limit`, 'error');
                continue;
            }
            try {
                const isImage = file.type.startsWith('image/');
                const content = isImage ? await readFileAsBase64(file) : await readFileAsText(file);
                processed.push({ name: file.name, type: file.type, content, size: file.size });
            } catch {
                showNotification(`Failed to read "${file.name}"`, 'error');
            }
        }
        setAttachedFiles(prev => [...prev, ...processed].slice(0, MAX_FILES));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setLoading(false);
        setStatusLog([{ message: 'Generation stopped by user', type: 'error' }]);
    };

    // Timer for elapsed seconds
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (loading) {
            setElapsedSeconds(0);
            interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [loading]);

    useEffect(() => {
        if (messagesKey && messages.length > 0) {
            try { localStorage.setItem(messagesKey, JSON.stringify(messages)); } catch {}
        }
    }, [messages, messagesKey]);

    useEffect(() => {
        if (messagesKey) {
            try {
                const saved = localStorage.getItem(messagesKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
                }
            } catch {}
        }
    }, [messagesKey]);

    useEffect(() => {
        if (statusLogKey && statusLog.length > 0) {
            try { localStorage.setItem(statusLogKey, JSON.stringify(statusLog)); } catch {}
        }
    }, [statusLog, statusLogKey]);

    useEffect(() => {
        if (statusLogKey) {
            try {
                const saved = localStorage.getItem(statusLogKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) setStatusLog(parsed);
                }
            } catch {}
        }
    }, [statusLogKey]);

    useEffect(() => {
        if (generatedFilesKey && (generatedFiles.created.length > 0 || generatedFiles.edited.length > 0)) {
            try { localStorage.setItem(generatedFilesKey, JSON.stringify(generatedFiles)); } catch {}
        }
    }, [generatedFiles, generatedFilesKey]);

    useEffect(() => {
        if (generatedFilesKey) {
            try {
                const saved = localStorage.getItem(generatedFilesKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && (parsed.created?.length > 0 || parsed.edited?.length > 0)) setGeneratedFiles(parsed);
                }
            } catch {}
        }
    }, [generatedFilesKey]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (initialPrompt && !loading && !compact) {
            if (autoSubmittedPromptRef.current === initialPrompt) return;
            autoSubmittedPromptRef.current = initialPrompt;
            setPrompt(initialPrompt);
            setTimeout(() => {
                handleSend(initialPrompt);
                if (onInitialPromptHandled) onInitialPromptHandled();
            }, 100);
        }
    }, [initialPrompt]);

    useEffect(() => {
        if (sessionId) {
            aiApi.getMessages(sessionId).then(data => {
                if (Array.isArray(data)) {
                    setMessages(data.map((message: any) => {
                        const metadata = parseMetadata(message.metadata);
                        return {
                            ...message,
                            message_type: message.message_type || 'message',
                            metadata,
                            planData: metadata.plan,
                            questions: metadata.questions
                        };
                    }));
                    setTimeout(scrollToBottom, 100);
                }
            }).catch(err => console.error('Failed to fetch messages:', err));
        } else {
            setMessages([]);
        }
    }, [sessionId]);

    useEffect(() => { scrollToBottom(); }, [messages, statusLog, buildResult]);

    const handleEnhance = async () => {
        if (!prompt.trim() || loading) return;
        setLoading(true);
        setStatusLog([{ message: 'Refining prompt...', type: 'pending' }]);
        try {
            const result = await aiApi.enhancePrompt(prompt, platform);
            if (result.enhanced) {
                setPrompt(result.enhanced);
                setStatusLog([{ message: 'Prompt enhanced!', type: 'done' }]);
            }
        } catch (err) {
            console.error("Enhancement failed", err);
            setStatusLog([{ message: 'Enhancement failed', type: 'error' }]);
            showNotification('Unable to enhance prompt. AI might be offline.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (messageOverride?: string) => {
        const userMsg = messageOverride || prompt.trim();
        if ((!userMsg && attachedFiles.length === 0) || loading) return;

        const credits = user?.credits ?? 0;
        if (credits < 20) {
            setStatusLog([{ message: `Out of credits. You have ${credits} credits. 20 credits required to generate.`, type: 'error' }]);
            showNotification(`Out of credits! You have ${credits}. Buy more credits to continue generating.`, 'error');
            setLoading(false);
            return;
        }

        if (compact && onPromptSubmit) {
            onPromptSubmit(userMsg);
            return;
        }

        let finalPrompt = userMsg || 'Please analyze the uploaded files and help me with the following:';
        if (highlight && highlight.length > 0) {
            finalPrompt = `[PRIORITY CONTEXT: User highlighted the following code in the editor. Focus on this or use it for reference:]\n\`\`\`\n${highlight}\n\`\`\`\n\n${userMsg}`;
        }

        if (attachedFiles.length > 0) {
            const fileSections: string[] = [];
            for (const f of attachedFiles) {
                if (f.type.startsWith('image/')) {
                    fileSections.push(`[Attached image: ${f.name} (${f.type}, ${formatFileSize(f.size)}) — base64 data available for vision models]`);
                } else {
                    const ext = f.name.split('.').pop()?.toLowerCase() || '';
                    fileSections.push(`[Attached file: ${f.name}]\n\`\`\`${ext}\n${f.content}\n\`\`\``);
                }
            }
            finalPrompt = `${fileSections.join('\n\n')}\n\n${finalPrompt}`;
        }

        setPrompt('');
        setAttachedFiles([]);
        setLoading(true);
        setGeneratedFiles({ created: [], edited: [] });
        setSearchStatus(null);
        setTodos([]);
        setCompletedTodos(0);
        setStepCount(0);
        setRunningTool(null);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setMessages(prev => {
            const isDuplicate = prev.length > 0 && prev[prev.length - 1].role === 'user' && prev[prev.length - 1].content === userMsg;
            if (isDuplicate) return prev;
            const attachments = attachedFiles.map(f => ({ name: f.name, type: f.type, size: f.size }));
            return [...prev, { role: 'user', content: userMsg, attachments: attachments.length > 0 ? attachments : undefined }];
        });

        if (execMode === 'plan') {
            setStatusLog([{ message: 'Analyzing request parameters & goals...', type: 'pending' }]);
            try {
                if (!sessionId) throw new Error('Create or open a project before planning.');
                const planRes = await aiApi.getPlan(finalPrompt, sessionId, platform, language, model, controller.signal, enableWebSearch);
                if (planRes?.error) throw new Error(planRes.error);
                const messageMetadata = parseMetadata(planRes?.message?.metadata);
                const normalizedPlan = planRes?.plan?.title && planRes?.plan?.summary
                    ? planRes.plan
                    : messageMetadata.plan?.title && messageMetadata.plan?.summary
                        ? messageMetadata.plan
                        : null;
                const normalizedQuestions = Array.isArray(planRes?.questions)
                    ? planRes.questions
                    : Array.isArray(messageMetadata.questions)
                        ? messageMetadata.questions
                        : [];
                if (!normalizedPlan) throw new Error('AI did not return a usable plan. Please try again.');
                const normalizedMetadata = {
                    plan: normalizedPlan,
                    questions: normalizedQuestions,
                    answers: messageMetadata.answers || {},
                    status: messageMetadata.status || 'awaiting_answers'
                };
                if (planRes) {
                    setPlanningData({ plan: normalizedPlan, questions: normalizedQuestions });
                    setActiveQuestionIndex(0);
                    setPlanApproved(false);
                    setPlanPrompt(finalPrompt);
                    setStatusLog([{ message: 'Plan & clarifying questions generated', type: 'done' }]);
                    if (planRes.searchQueries?.length) setSearchStatus({ queries: planRes.searchQueries, sources: planRes.searchSources || [] });

                    const savedMessage = planRes.message ? {
                        ...planRes.message,
                        id: planRes.message.id || -Date.now(),
                        message_type: 'plan', metadata: normalizedMetadata,
                        planData: normalizedPlan, questions: normalizedQuestions
                    } : { id: -Date.now(), role: 'assistant' as const, content: normalizedPlan.summary || '', message_type: 'plan', metadata: normalizedMetadata };
                    setMessages(prev => [...prev, savedMessage]);
                    onPlanCreated?.(formatPlanMarkdown(normalizedPlan, normalizedQuestions));
                }
            } catch (planErr: any) {
                console.error('Plan failed:', planErr);
                setStatusLog([{ message: planErr?.message || 'Unable to create a plan. Please try again.', type: 'error' }]);
                showNotification(planErr?.message || 'Unable to create a plan.', 'error');
                return;
            } finally {
                setLoading(false);
            }
            return;
        }

        runBuildGeneration(finalPrompt);
    };

    const runBuildGeneration = async (finalPromptOverride?: string, approvedPlanId?: number) => {
        const effectiveChatMode = execMode === 'chat' || chatMode;
        const userMsg = messages[messages.length - 1]?.content || prompt;
        let finalPrompt = finalPromptOverride || userMsg;

        if (planningData && planningData.plan) {
            const answersSummary = Object.entries(selectedAnswers).map(([qId, ans]) => `- ${qId}: ${ans}`).join('\n');
            finalPrompt = `[PROJECT BLUEPRINT]:\nTitle: ${planningData.plan.title}\nSummary: ${planningData.plan.summary}\nSelected Preferences:\n${answersSummary}\n\n[USER REQUEST]:\n${finalPrompt}`;
        }

        setLoading(true);
        setGeneratedFiles({ created: [], edited: [] });
        setSearchStatus(null);
        setStepCount(0);
        setRunningTool(null);
        setTodos([]);
        setCompletedTodos(0);

        if (typeof window !== 'undefined' && window.location.search) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
        }

        const skillLabel = platform === 'minecraft' ? 'Minecraft' : platform === 'discord' ? 'Discord' : platform === 'hytale' ? 'Hytale' : platform;

        let platformLabel = 'Minecraft Plugin';
        let modeLabel = 'Plugin';
        if (isConfig) {
            const pluginName = language?.replace('config-', '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Plugin';
            platformLabel = `${pluginName} Config`;
            modeLabel = 'Configuration';
        } else if (isDatapack) {
            platformLabel = 'Minecraft Datapack';
            modeLabel = 'Datapack';
        } else if (isScripting) {
            platformLabel = 'Minecraft Commands';
            modeLabel = 'Scripting';
        } else if (platform === 'discord') {
            platformLabel = 'Discord Bot';
            modeLabel = 'Bot';
        } else if (platform === 'hytale') {
            platformLabel = 'Hytale Plugin';
            modeLabel = 'Plugin';
        }

        setStatusLog([{ message: 'Analyzing request...', type: 'pending' }]);
        await new Promise(r => setTimeout(r, 500));

        const logs: { message: string; type: 'pending' | 'done' | 'error' }[] = [
            { message: 'Analyzing request...', type: 'done' }
        ];
        setStepCount(1);

        if (!effectiveChatMode) {
            setStatusLog([...logs, { message: `Loading ${skillLabel} ${modeLabel.toLowerCase()} skills...`, type: 'pending' }]);
            setRunningTool('Loading skills');
            await new Promise(r => setTimeout(r, 400));

            const skillDetails: Record<string, string[]> = {
                minecraft: isConfig
                    ? ['EssentialsX Ops', 'Server Admin', 'Config Generation']
                    : isDatapack
                        ? ['Datapack Dev', 'Commands/Scripting', 'World Generation']
                        : isScripting
                            ? ['Commands/Scripting', 'Scoreboard', 'Execute Chains']
                            : ['Plugin Dev (Paper/Spigot)', 'Modding (NeoForge/Fabric)', 'Datapacks', 'Commands/Scripting'],
                hytale: ['Plugin Basics', 'Custom Blocks', 'Custom Items', 'Custom Entities', 'Events API'],
                discord: ['Bot Framework', 'Commands', 'Events']
            };
            const skills = skillDetails[platform] || [];

            logs.push({ message: `Loading ${skillLabel} ${modeLabel.toLowerCase()} skills...`, type: 'done' });
            setStepCount(2);
            setRunningTool(null);

            for (const skill of skills.slice(0, 3)) {
                logs.push({ message: `  ${skill}`, type: 'pending' });
                setStatusLog([...logs]);
                await new Promise(r => setTimeout(r, 200));
                if (abortControllerRef.current?.signal.aborted) { setLoading(false); return; }
                logs[logs.length - 1] = { message: `  ${skill}`, type: 'done' };
                setStatusLog([...logs]);
            }
            if (skills.length > 3) {
                logs.push({ message: `  +${skills.length - 3} more skills`, type: 'done' });
                setStatusLog([...logs]);
            }
        } else {
            setStatusLog([...logs, { message: 'Chat mode — just talking, no code gen', type: 'done' }]);
        }

        const hasImages = attachedFiles.some(f => f.type.startsWith('image/'));
        const fileContextCount = projectFiles ? Object.keys(projectFiles).filter(p => !p.startsWith('.')).length : 0;

        if (!effectiveChatMode) {
            if (hasImages) {
                logs.push({ message: `Vision: ${attachedFiles.filter(f => f.type.startsWith('image/')).length} image(s) attached`, type: 'done' });
                setStatusLog([...logs]);
            }
            if (enableWebSearch) {
                logs.push({ message: 'Web search enabled', type: 'done' });
                setStatusLog([...logs]);
            }
            if (fileContextCount > 0) {
                logs.push({ message: `Project context: ${fileContextCount} file(s)`, type: 'done' });
                setStatusLog([...logs]);
            }
        }

        logs.push({ message: `Optimizing prompt...`, type: 'pending' });
        setRunningTool('Optimizing prompt');
        setStatusLog([...logs]);

        let optimizedPrompt = finalPrompt;
        try {
            const enhanceResult = await aiApi.enhancePrompt(finalPrompt, platform, language, abortControllerRef.current?.signal);
            if (enhanceResult.enhanced && enhanceResult.enhanced !== finalPrompt) {
                optimizedPrompt = enhanceResult.enhanced;
                logs[logs.length - 1] = { message: `Prompt optimized`, type: 'done' };
            } else {
                logs[logs.length - 1] = { message: `Prompt ready`, type: 'done' };
            }
        } catch (enhanceErr: any) {
            if (enhanceErr.name === 'AbortError') { setLoading(false); return; }
            logs[logs.length - 1] = { message: `Using original prompt`, type: 'done' };
        }
        setRunningTool(null);
        setStatusLog([...logs]);

        const genLabel = effectiveChatMode ? 'Thinking...' : isConfig ? 'Generating config...' : isDatapack ? 'Generating datapack...' : isScripting ? 'Generating commands...' : 'Generating code...';
        logs.push({ message: genLabel, type: 'pending' });
        setRunningTool(genLabel.replace('...', ''));
        setStatusLog([...logs]);

        // Set up todos based on mode
        if (!effectiveChatMode) {
            const newTodos = [
                `Analyze request for ${platformLabel}`,
                `Load ${skillLabel} skills`,
                `Generate ${modeLabel.toLowerCase()} code`,
                `Verify and optimize`
            ];
            setTodos(newTodos);
            setCompletedTodos(0);
        }

        let result: any;
        try {
            const imageAttachments = attachedFiles
                .filter(f => f.type.startsWith('image/'))
                .map(f => ({ data: f.content, mimeType: f.type }));

            const fileContextEntries = projectFiles
                ? Object.entries(projectFiles)
                    .filter(([path]) => !path.startsWith('.') && !path.includes('node_modules'))
                    .slice(0, 20)
                    .map(([path, content]) => ({
                        path,
                        content: content.length > 2000 ? content.slice(0, 2000) + '\n[...truncated...]' : content
                    }))
                : [];

            const onProgress = (ev: { event?: string; type?: string; query?: string; title?: string; url?: string; path?: string; op?: string; model?: string; docs?: string[]; command?: string; status?: string; output?: string; success?: boolean; content?: string }) => {
                const evType = ev.event || ev.type || '';
                if (evType === 'model' && ev.model) {
                    setStatusLog(prev => [...prev, { message: `Using model: ${ev.model}`, type: 'done' }]);
                } else if (evType === 'searching' && ev.query) {
                    setStatusLog(prev => [...prev, { message: `Searching: ${ev.query}`, type: 'pending' }]);
                } else if (evType === 'search' && ev.title) {
                    setStatusLog(prev => [...prev, { message: `Found: ${ev.title}`, type: 'done' }]);
                } else if (evType === 'docs' && ev.docs && ev.docs.length > 0) {
                    setStatusLog(prev => [...prev, { message: `Read ${ev.docs!.length} doc(s)`, type: 'done' }]);
                } else if (evType === 'file' && ev.path) {
                    const isEdit = ev.op === 'edited';
                    setGeneratedFiles(prev => {
                        if (isEdit) return { created: prev.created, edited: [...prev.edited, ev.path!] };
                        return { created: [...prev.created, ev.path!], edited: prev.edited };
                    });
                    setStatusLog(prev => [...prev, { message: `${isEdit ? '~ Edited' : '+ Created'} ${ev.path}`, type: 'done' }]);
                    setStepCount(s => s + 1);
                } else if (evType === 'command' && ev.command) {
                    setStatusLog(prev => [...prev, { message: `Run: ${ev.command}`, type: ev.status === 'error' ? 'error' : 'done' }]);
                }
            };

            result = await aiApi.generate(
                optimizedPrompt, language, model, sessionId || undefined, platform, abortControllerRef.current?.signal,
                enableWebSearch,
                imageAttachments.length > 0 ? imageAttachments : undefined,
                fileContextEntries.length > 0 ? fileContextEntries : undefined,
                effectiveChatMode,
                Boolean(approvedPlanId),
                approvedPlanId,
                onProgress
            );
        } catch (fetchErr: any) {
            if (fetchErr.name === 'AbortError') {
                setStatusLog([{ message: 'Generation stopped by user', type: 'error' }]);
            } else {
                setStatusLog([{ message: `Error: ${fetchErr.message || 'Network error'}`, type: 'error' }]);
                showNotification(fetchErr.message || 'Failed to connect to server', 'error');
            }
            setLoading(false);
            setRunningTool(null);
            return;
        }

        setRunningTool(null);

        if (result.error) {
            setStatusLog([{ message: `Error: ${result.error}`, type: 'error' }]);
            showNotification(result.error, 'error');
            setLoading(false);
            return;
        }

        if (result.imageWarning) {
            showNotification(result.imageWarning, 'info');
            logs.push({ message: result.imageWarning, type: 'done' });
            setStatusLog([...logs]);
        }

        if (result.creditsUsed !== undefined && result.creditsRemaining !== undefined) {
            if (result.creditsUsed > 0) {
                showNotification(`Used ${result.creditsUsed} credits. Remaining: ${result.creditsRemaining} credits.`, 'success');
            }
        }

        if (result.searchQueries && result.searchQueries.length > 0) {
            setSearchStatus({
                queries: result.searchQueries,
                sources: result.searchSources || []
            });
        }

        if (effectiveChatMode) {
            logs[logs.length - 1] = { message: 'Response ready', type: 'done' };
            setStatusLog([...logs]);
            setCompletedTodos(todos.length || 1);
            setStepCount(s => s + 1);
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: result.rawResponse }
            ]);
        } else if (result.files && result.files.length > 0) {
            const created: string[] = [];
            const edited: string[] = [];

            for (const file of result.files) {
                const isNew = file.content && !file.content.startsWith('// Edit');
                if (isNew) created.push(file.path);
                else edited.push(file.path);
            }

            const fileLogs: { message: string; type: 'pending' | 'done' | 'error' }[] = [
                { message: 'Request analyzed', type: 'done' },
                { message: `Documentation matched (${skillLabel})`, type: 'done' },
                { message: 'Architecture planned', type: 'done' }
            ];
            setStatusLog([...fileLogs]);
            setCompletedTodos(2);
            setStepCount(3);

            const revealCreated: string[] = [];
            const revealEdited: string[] = [];

            for (let i = 0; i < result.files.length; i++) {
                const file = result.files[i];
                const isNew = file.content && !file.content.startsWith('// Edit');
                const opLabel = isNew ? 'Created' : 'Edited';

                if (isNew) revealCreated.push(file.path);
                else revealEdited.push(file.path);

                setGeneratedFiles({ created: [...revealCreated], edited: [...revealEdited] });

                setRunningTool(`${opLabel} ${file.path.split('/').pop()}`);
                fileLogs.push({ message: `${isNew ? '+' : '~'} ${opLabel} ${file.path}`, type: 'pending' });
                setStatusLog([...fileLogs]);
                await new Promise(r => setTimeout(r, 120));
                fileLogs[fileLogs.length - 1] = { message: `${isNew ? '+' : '~'} ${opLabel} ${file.path}`, type: 'done' };
                setStatusLog([...fileLogs]);
                setStepCount(4 + i);
            }

            setRunningTool(null);
            fileLogs.push({ message: `${platformLabel} ${modeLabel} assembly complete!`, type: 'done' });
            setStatusLog([...fileLogs]);
            setCompletedTodos(4);

            const createdCount = revealCreated.length;
            const editedCount = revealEdited.length;
            let summaryParts: string[] = [];
            if (createdCount > 0) summaryParts.push(`${createdCount} file${createdCount > 1 ? 's' : ''} created`);
            if (editedCount > 0) summaryParts.push(`${editedCount} file${editedCount > 1 ? 's' : ''} edited`);
            const summaryText = `Done! I ${summaryParts.join(' and ')}. Check the files panel to see the generated code.`;

            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: summaryText, files: result.files, message_type: 'build', metadata: { files: result.files.map((file: any) => ({ path: file.path, size: file.content?.length || 0 })), status: 'completed' } }
            ]);

            await new Promise(r => setTimeout(r, 400));
            onCodeGenerated(result.sessionId, result);
        } else {
            setStatusLog([{ message: 'Response received (no files)', type: 'done' }]);
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: result.rawResponse }
            ]);
        }
        setLoading(false);
    };

    const handleSavePlan = async (messageId: number, answers: Record<string, string>) => {
        if (!sessionId) return;
        if (messageId > 0) {
            const result = await aiApi.updatePlan(messageId, sessionId, answers, 'awaiting_approval');
            if (result.error) return showNotification(result.error, 'error');
        }
        setSelectedAnswers(answers);
        setMessages(prev => prev.map(message => message.id === messageId ? {
            ...message,
            metadata: { ...(message.metadata || {}), answers, status: 'awaiting_approval' }
        } : message).concat({ role: 'assistant', content: 'Answers saved. Plan ready for approval.', message_type: 'timeline', metadata: { event: 'awaiting_approval' } }));
    };

    const handleApprovePlan = async (messageId: number) => {
        if (!sessionId || loading) return;
        const planMessage = messages.find(message => message.id === messageId);
        const answers = planMessage?.metadata?.answers || selectedAnswers;
        if (messageId > 0) {
            const update = await aiApi.updatePlan(messageId, sessionId, answers, 'approved');
            if (update.error) return showNotification(update.error, 'error');
        }
        setMessages(prev => prev.map(message => message.id === messageId ? {
            ...message, metadata: { ...(message.metadata || {}), answers, status: 'approved' }
        } : message).concat({ role: 'assistant', content: 'Plan approved. Building your project now.', message_type: 'timeline', metadata: { event: 'approved' } }));
        setPlanningData({ plan: planMessage?.metadata?.plan || planMessage?.planData, questions: planMessage?.metadata?.questions || [] });
        setSelectedAnswers(answers);
        setPlanApproved(true);
        await runBuildGeneration(planPrompt || messages.filter(message => message.role === 'user').slice(-1)[0]?.content || '', messageId > 0 ? messageId : undefined);
    };

    const handleClearLog = () => {
        setStatusLog([]);
        setGeneratedFiles({ created: [], edited: [] });
        setTodos([]);
        setCompletedTodos(0);
        setStepCount(0);
        setRunningTool(null);
        if (statusLogKey) try { localStorage.removeItem(statusLogKey); } catch {}
        if (generatedFilesKey) try { localStorage.removeItem(generatedFilesKey); } catch {}
    };

    if (compact) {
        return (
            <div className="relative flex flex-col min-h-[150px] justify-between" onDragOver={handleDragOver} onDrop={handleDrop}>
                {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-5 pt-3">
                        {attachedFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-muted group">
                                {f.type.startsWith('image/') ? <Image className="w-2.5 h-2.5" /> : <FileCode className="w-2.5 h-2.5" />}
                                <span className="truncate max-w-[80px]">{f.name}</span>
                                <button onClick={() => removeAttachedFile(i)} className="p-0.5 rounded hover:bg-white/10 text-muted hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                                    <X className="w-2 h-2" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.txt,.md,.log,.csv,.mcfunction,.js,.jsx,.mjs,.ts,.tsx,.java,.kt,.kts,.py,.yml,.yaml,.json,.xml,.gradle,.properties,.toml,.sh,.cfg,.conf,.ini"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    disabled={loading}
                    className="w-full bg-transparent border-0 px-5 pt-5 text-sm focus:outline-none resize-none h-[80px] placeholder:text-foreground/30 text-foreground"
                    placeholder={chatMode ? "Ask me anything..." : isConfig ? "Describe the plugin config you need..." : isDatapack ? "Describe the datapack you need..." : isScripting ? "Describe the commands you need..." : attachedFiles.length > 0 ? "Add a message about the uploaded files..." : "Ask Velix to create a plugin about..."}
                />
                {statusLog.length > 0 && (
                    <div className="px-5 pb-3 space-y-1">
                        {statusLog.map((log, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                                {log.type === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--text))] animate-pulse" />}
                                {log.type === 'done' && <Check className="w-3 h-3 text-green-500" />}
                                {log.type === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                                <span className={log.type === 'done' ? 'text-green-500' : log.type === 'error' ? 'text-red-500' : 'text-foreground/40'}>
                                    {log.message}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-[hsl(var(--surface-sunk))]/40">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={attachedFiles.length >= MAX_FILES}
                            className="w-7 h-7 rounded-full border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface-sunk))] flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
                            title="Attach files"
                        >
                            <Paperclip className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setEnableWebSearch(!enableWebSearch)}
                            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${enableWebSearch
                                ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                                : 'border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface-sunk))] text-foreground/50 hover:text-foreground'
                                }`}
                            title={enableWebSearch ? 'Web search ON' : 'Web search OFF'}
                        >
                            <Globe className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setChatMode(!chatMode)}
                            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${chatMode
                                ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                                : 'border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface-sunk))] text-foreground/50 hover:text-foreground'
                                }`}
                            title={chatMode ? 'Chat mode ON — conversational, no code gen' : 'Chat mode OFF — generates code'}
                        >
                            <Bot className="w-3.5 h-3.5" />
                        </button>
                        {modelDropdown}
                        {typeDropdown}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleEnhance}
                            disabled={loading || !prompt.trim()}
                            className="w-7 h-7 flex items-center justify-center text-foreground/40 hover:text-foreground disabled:opacity-40 disabled:hover:text-foreground/40 transition-colors"
                            title="Magic Prompt Enhancer"
                        >
                            <Sparkles className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleSend()}
                            disabled={loading || !prompt.trim()}
                            className="w-7 h-7 rounded-full bg-foreground hover:opacity-90 disabled:opacity-30 flex items-center justify-center transition-colors"
                        >
                            {loading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-background" />
                            ) : (
                                <Send className="w-3.5 h-3.5 text-background" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex-1 flex flex-col h-full overflow-hidden">
            {/* Header bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                    {agentCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-violet-500/20 text-violet-300 rounded-full border border-violet-500/30">
                            {agentCount} agent{agentCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <button
                    onClick={async () => {
                        if (sessionId && window.confirm('Clear this project conversation? This cannot be undone.')) {
                            const result = await aiApi.clearMessages(sessionId);
                            if (!result.error) {
                                setMessages([]);
                                setPlanningData(null);
                                handleClearLog();
                            }
                        }
                    }}
                    className="rounded-lg px-2 py-1 text-[10px] text-zinc-500 hover:text-red-300 transition-colors"
                >
                    Clear
                </button>
            </div>

            {/* Messages area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto mb-2 space-y-2 px-1">
                {messages.length === 0 && statusLog.length === 0 && !buildResult && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <Sparkles className="w-5 h-5 text-muted mb-2" />
                        <p className="text-xs text-muted">Describe what you want to build</p>
                        <p className="text-[10px] text-faint mt-1">or toggle chat mode to just talk</p>
                    </div>
                )}

                {/* Web search status */}
                {false && (searchStatus?.queries.length || 0) > 0 && (
                    <div className="mx-2 mb-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[11px] font-bold text-blue-400">Web Search</span>
                        </div>
                        <div className="space-y-1.5">
                            {searchStatus!.queries.map((q, i) => (
                                <div key={i} className="flex items-center gap-2 text-[10px]">
                                    <span className="text-foreground/40">Searched:</span>
                                    <span className="text-foreground/70 font-medium">"{q}"</span>
                                </div>
                            ))}
                        </div>
                        {searchStatus!.sources.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {searchStatus!.sources.slice(0, 5).map((s, i) => (
                                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                                        className="px-1.5 py-0.5 text-[9px] rounded bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-colors truncate max-w-[150px]"
                                        title={s.title}
                                    >
                                        {s.title.slice(0, 30)}{s.title.length > 30 ? '...' : ''}
                                    </a>
                                ))}
                                {searchStatus!.sources.length > 5 && (
                                    <span className="px-1.5 py-0.5 text-[9px] text-foreground/30">+{searchStatus!.sources.length - 5} more</span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Messages */}
                {messages.map((msg, i) => {
                    const isLast = i === messages.length - 1;
                    const showFileChips = isLast && msg.role === 'assistant' && generatedFiles.created.length + generatedFiles.edited.length > 0;
                    return (
                        <React.Fragment key={i}>
                            <ChatMessage
                                id={msg.id}
                                role={msg.role}
                                content={msg.content}
                                created_at={msg.created_at}
                                attachments={msg.attachments}
                                messageType={msg.message_type}
                                metadata={msg.metadata || { plan: msg.planData, questions: msg.questions }}
                                onSavePlan={handleSavePlan}
                                onApprovePlan={handleApprovePlan}
                                onOpenPlan={onOpenPlanFile}
                            />
                            {showFileChips && (
                                <FileChipsSummary created={generatedFiles.created} edited={generatedFiles.edited} />
                            )}
                        </React.Fragment>
                    );
                })}

                {/* Loading state: Live streaming view */}
                {loading && (
                    <div className="mx-3 space-y-2 animate-in fade-in duration-200">
                        {/* Live status log - shows each step as it happens */}
                        {statusLog.length > 0 && (
                            <div className="rounded-lg border border-white/[.08] bg-[#10151b]/80 overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-3 py-2 border-b border-white/[.06]">
                                    <div className="flex items-center gap-2">
                                        <Brain className="h-3.5 w-3.5 animate-pulse text-violet-300" />
                                        <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-300">AI reasoning</span>
                                        {agentCount > 0 && (
                                            <span className="px-1.5 py-0.5 text-[8px] font-bold bg-violet-500/20 text-violet-300 rounded-full border border-violet-500/30">
                                                {agentCount} agent{agentCount !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-zinc-500">Working...</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 tabular-nums">{formatElapsed(elapsedSeconds)}</span>
                                </div>

                                {/* Live log entries - each appears as it's added */}
                                <div className="divide-y divide-white/[.04]">
                                    {statusLog.map((log, i) => (
                                        <div key={`${log.message}-${i}`} className="flex items-center gap-2 px-3 py-1.5 text-[11px]">
                                            {log.type === 'done' ? (
                                                <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                                            ) : log.type === 'error' ? (
                                                <AlertCircle className="h-3 w-3 shrink-0 text-red-400" />
                                            ) : (
                                                <Loader2 className="h-3 w-3 shrink-0 animate-spin text-sky-400" />
                                            )}
                                            <span className={log.type === 'error' ? 'text-red-300' : log.type === 'done' ? 'text-zinc-500' : 'text-zinc-300'}>
                                                {log.message}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Live file creation - shows files as they appear */}
                                {(generatedFiles.created.length > 0 || generatedFiles.edited.length > 0) && (
                                    <div className="px-3 py-2 border-t border-white/[.06]">
                                        <div className="text-[9px] font-semibold uppercase tracking-[.12em] text-zinc-500 mb-1.5">Files changed</div>
                                        <div className="space-y-1">
                                            {generatedFiles.created.map((path, i) => (
                                                <div key={`c-${i}`} className="flex items-center gap-2 text-[10px] animate-in fade-in duration-150">
                                                    <FileCode className="h-3 w-3 text-sky-300 shrink-0" />
                                                    <span className="text-zinc-400 font-mono truncate">{path}</span>
                                                    <span className="ml-auto text-emerald-400 shrink-0">CREATED</span>
                                                </div>
                                            ))}
                                            {generatedFiles.edited.map((path, i) => (
                                                <div key={`e-${i}`} className="flex items-center gap-2 text-[10px] animate-in fade-in duration-150">
                                                    <FileCode className="h-3 w-3 text-sky-300 shrink-0" />
                                                    <span className="text-zinc-400 font-mono truncate">{path}</span>
                                                    <span className="ml-auto text-emerald-400 shrink-0">EDITED</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Running tool at bottom */}
                                {runningTool && (
                                    <RunningToolIndicator label={runningTool} elapsed={elapsedSeconds} />
                                )}
                            </div>
                        )}

                        {/* Streaming indicator when no logs yet */}
                        {statusLog.length === 0 && (
                            <StreamingIndicator elapsed={elapsedSeconds} />
                        )}
                    </div>
                )}

                {/* Completed state: Collapsible sections */}
                {!loading && statusLog.length > 0 && (
                    <div className="mx-3 space-y-2 animate-in fade-in duration-200">
                        {/* Steps counter */}
                        {stepCount > 0 && <StepsCounter count={stepCount} />}

                        {/* To-dos section (collapsible) */}
                        {todos.length > 0 && (
                            <CollapsibleSection
                                title="To-dos"
                                icon={<ListChecks className="w-3.5 h-3.5 text-zinc-400" />}
                                count={completedTodos}
                                defaultOpen={false}
                            >
                                <TodosChecklist todos={todos} completedCount={completedTodos} />
                            </CollapsibleSection>
                        )}

                        {/* File changes section */}
                        {(generatedFiles.created.length > 0 || generatedFiles.edited.length > 0) && (
                            <CollapsibleSection
                                title="File changes"
                                icon={<FileCode className="w-3.5 h-3.5 text-zinc-400" />}
                                count={generatedFiles.created.length + generatedFiles.edited.length}
                                defaultOpen={false}
                            >
                                <div className="space-y-1">
                                    {generatedFiles.created.map((path, i) => (
                                        <FileBadge key={`c-${i}`} path={path} />
                                    ))}
                                    {generatedFiles.edited.map((path, i) => (
                                        <FileBadge key={`e-${i}`} path={path} edited />
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Reasoning section */}
                        {statusLog.length > 0 && (
                            <CollapsibleSection
                                title="Reasoning"
                                icon={<Brain className="w-3.5 h-3.5 text-zinc-400" />}
                                defaultOpen={false}
                            >
                                <div className="space-y-1">
                                    {statusLog.map((log, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[11px]">
                                            {log.type === 'done' && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                                            {log.type === 'error' && <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />}
                                            {log.type === 'pending' && <Loader2 className="w-3 h-3 animate-spin text-sky-400 shrink-0" />}
                                            <span className={log.type === 'error' ? 'text-red-300' : log.type === 'done' ? 'text-zinc-500' : 'text-zinc-400'}>
                                                {log.message}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}
                    </div>
                )}

                {/* Build result */}
                {compiling && !buildResult && (
                    <div className="mx-3 animate-in fade-in duration-200 rounded-lg border border-white/[.08] overflow-hidden bg-[#10151b]/80">
                        <div className="flex items-center gap-2 px-3 py-2">
                            <Hammer className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-[11px] font-semibold text-zinc-300">build</span>
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400 rounded animate-pulse">RUNNING</span>
                        </div>
                        <div className="px-3 pb-2 space-y-1">
                            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                                <span className="text-emerald-400">$</span>
                                <span>{language === 'kotlin' ? 'gradle build --no-daemon' : language === 'java' ? 'mvn clean package -DskipTests' : 'compile --target plugin'}</span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden mt-2">
                                <div className="h-full bg-emerald-500 rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
                            </div>
                        </div>
                    </div>
                )}

                {buildResult && (
                    <div className="mx-3 animate-in fade-in duration-200 rounded-lg border border-white/[.08] overflow-hidden bg-[#10151b]/80">
                        <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-2">
                                <Hammer className="w-3.5 h-3.5 text-zinc-400" />
                                <span className="text-[11px] font-semibold text-zinc-300">Build</span>
                                {buildResult.success ? (
                                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400 rounded">OK</span>
                                ) : (
                                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-red-500/15 text-red-400 rounded">FAIL</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={async () => { if (await copyToClipboard(buildResult.log || '')) showNotification('Copied.', 'success'); else showNotification('Copy failed', 'error'); }} className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors" title="Copy log">
                                    <Copy className="w-3 h-3" />
                                </button>
                                <button onClick={onClearBuildResult} className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        {buildResult.log && (
                            <div className="px-3 pb-2 max-h-[150px] overflow-y-auto">
                                <pre className="text-[10px] font-mono leading-relaxed text-zinc-500 whitespace-pre-wrap break-words">{buildResult.log}</pre>
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-2 border-t border-white/[.06]">
                            {buildResult.success && buildResult.historyId && onDownloadArtifact && (
                                <button onClick={() => onDownloadArtifact(buildResult.historyId!)} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-zinc-900 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-all">
                                    <Download className="w-3 h-3" /> JAR
                                </button>
                            )}
                            {!buildResult.success && onAutoFix && (
                                <button onClick={() => onAutoFix(buildResult.log)} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-zinc-900 bg-amber-400 rounded-lg hover:bg-amber-300 transition-all">
                                    <Sparkles className="w-3 h-3" /> Auto-fix
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Message queued */}
                {loading && (
                    <div className="mx-3">
                        <MessageQueuedBar />
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="mt-auto px-1 pb-1">
                <div className={`relative rounded-2xl transition-all duration-500 ${loading ? 'p-[1px]' : ''}`} onDragOver={handleDragOver} onDrop={handleDrop}>
                    {loading && (
                        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                            <div className="absolute inset-[-50%] animate-[spin_3s_linear_infinite]" style={{
                                background: 'conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent, hsl(var(--primary)), transparent)',
                            }} />
                        </div>
                    )}
                    <div className={`relative ${loading ? 'm-[1px] rounded-[15px] bg-[hsl(var(--surface))]' : ''}`}>
                        {attachedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2 px-2">
                                {attachedFiles.map((f, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-foreground group">
                                        {f.type.startsWith('image/') ? <Image className="w-3 h-3 text-primary shrink-0" /> : <FileCode className="w-3 h-3 text-primary shrink-0" />}
                                        <span className="truncate max-w-[120px]">{f.name}</span>
                                        <span className="text-muted text-[10px]">{formatFileSize(f.size)}</span>
                                        <button onClick={() => removeAttachedFile(i)} className="p-0.5 rounded hover:bg-white/10 text-muted hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.txt,.md,.log,.csv,.mcfunction,.js,.jsx,.mjs,.ts,.tsx,.java,.kt,.kts,.py,.yml,.yaml,.json,.xml,.gradle,.properties,.toml,.sh,.cfg,.conf,.ini"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={execMode === 'chat' ? "Ask me anything..." : isConfig ? "Describe the plugin config you need..." : isDatapack ? "Describe the datapack you need..." : isScripting ? "Describe the commands you need..." : attachedFiles.length > 0 ? "Add a message about the uploaded files..." : "Describe what you want to build..."}
                            className="neu-input w-full text-xs text-foreground rounded-2xl p-4 pr-20 outline-none transition-all resize-none h-20"
                        />
                        <div className="absolute right-3 bottom-3 flex items-center gap-1.5 z-20">
                            {modelDropdown ? modelDropdown : (
                                <ModelSelector selectedModel={model} onSelectModel={() => {}} />
                            )}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowExecModeDropdown(!showExecModeDropdown)}
                                    className="rounded-full border border-white/10 bg-[hsl(var(--surface-sunk))] px-2.5 py-1 text-[11px] text-foreground/80 flex items-center gap-1 hover:bg-white/10 hover:text-foreground transition-all font-semibold"
                                    title="Execution mode"
                                >
                                    <span className="capitalize">{execMode === 'build' ? 'Build' : execMode === 'plan' ? 'Plan' : 'Chat'}</span>
                                    <ChevronDown className="w-3 h-3 text-muted" />
                                </button>
                                {showExecModeDropdown && (
                                    <div className="absolute bottom-full right-0 mb-2 w-36 rounded-xl border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface))] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                                        <button
                                            type="button"
                                            onClick={() => { setExecMode('build'); setChatMode(false); setShowExecModeDropdown(false); }}
                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${execMode === 'build' ? 'bg-primary/10 text-primary font-bold' : 'text-foreground/80 hover:bg-[hsl(var(--surface-sunk))]'}`}
                                        >
                                            <span>Build Mode</span>
                                            {execMode === 'build' && <Check className="w-3.5 h-3.5 text-primary" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setExecMode('plan'); setChatMode(false); setShowExecModeDropdown(false); }}
                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${execMode === 'plan' ? 'bg-purple-500/10 text-purple-400 font-bold' : 'text-foreground/80 hover:bg-[hsl(var(--surface-sunk))]'}`}
                                        >
                                            <span>Plan Mode</span>
                                            {execMode === 'plan' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setExecMode('chat'); setChatMode(true); setShowExecModeDropdown(false); }}
                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${execMode === 'chat' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-foreground/80 hover:bg-[hsl(var(--surface-sunk))]'}`}
                                        >
                                            <span>Chat Mode</span>
                                            {execMode === 'chat' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading || attachedFiles.length >= MAX_FILES}
                                className={`p-1.5 rounded-lg transition-all ${loading || attachedFiles.length >= MAX_FILES ? 'text-faint' : 'text-muted hover:text-primary active:scale-95'}`}
                                title="Attach files (images, code, text)"
                            >
                                <Paperclip className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setEnableWebSearch(!enableWebSearch)}
                                className={`p-1.5 rounded-lg transition-all ${enableWebSearch ? 'text-blue-400 bg-blue-500/10 border border-blue-500/30' : 'text-muted hover:text-primary active:scale-95'}`}
                                title={enableWebSearch ? 'Web search ON' : 'Web search OFF'}
                            >
                                <Globe className="w-3.5 h-3.5" />
                            </button>
                            {attachedFiles.some(f => f.type.startsWith('image/')) && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px]">
                                    <Eye className="w-2.5 h-2.5" />
                                    <span>{attachedFiles.filter(f => f.type.startsWith('image/')).length}</span>
                                </div>
                            )}
                            <button
                                onClick={handleEnhance}
                                disabled={loading || !prompt.trim()}
                                className={`p-1.5 rounded-lg transition-all ${loading || !prompt.trim() ? 'text-faint' : 'text-muted hover:text-primary active:scale-95'}`}
                                title="Enhance prompt"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={loading ? handleStop : () => handleSend()}
                                disabled={!loading && (!prompt.trim() && attachedFiles.length === 0)}
                                className={`p-1.5 rounded-lg transition-all ${loading
                                    ? 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
                                    : (!prompt.trim() && attachedFiles.length === 0)
                                        ? 'text-faint bg-[hsl(var(--surface-sunk))]'
                                        : 'bg-foreground text-background hover:opacity-90 active:scale-95'
                                    }`}
                                title={loading ? 'Stop generation' : 'Send'}
                            >
                                {loading ? (
                                    <Square className="w-3.5 h-3.5 fill-white" />
                                ) : (
                                    <Send className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FileChipsSummary = ({ created, edited }: { created: string[]; edited: string[] }) => {
    const total = created.length + edited.length;
    if (total === 0) return null;

    return (
        <div data-file-chips className="mx-3 mt-2 rounded-lg border border-white/[.08] bg-[#10151b]/80 overflow-hidden animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[.06]">
                <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[11px] font-semibold text-zinc-300">Used {total} tool{total !== 1 ? 's' : ''}</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        const el = e.currentTarget.closest('[data-file-chips]') as HTMLElement;
                        if (el) el.style.display = 'none';
                    }}
                    className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
            {created.length > 0 && (
                <div className="px-3 py-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Created</div>
                    <div className="space-y-1">
                        {created.map((path, idx) => (
                            <FileBadge key={`c-${idx}`} path={path} />
                        ))}
                    </div>
                </div>
            )}
            {edited.length > 0 && (
                <div className={`px-3 py-2 ${created.length > 0 ? 'border-t border-white/[.06]' : ''}`}>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Edited</div>
                    <div className="space-y-1">
                        {edited.map((path, idx) => (
                            <FileBadge key={`e-${idx}`} path={path} edited />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const AssistantMessageContent = ({ content }: { content: string }) => {
    if (!content) return null;
    const fileRegex = /`([^`]+\.(?:java|kt|xml|json|gradle|kts|yml|yaml|txt|properties|py|js|ts|rb))`|([\/\\]?[\w\-\.\/\\]+\.(?:java|kt|xml|json|gradle|kts|yml|yaml|txt|properties|py|js|ts|rb))/g;
    const paths = new Set<string>();
    let match;
    while ((match = fileRegex.exec(content)) !== null) {
        const path = (match[1] || match[2]).replace(/\\/g, '/');
        if (!path.startsWith('.') && path.length > 3) {
            paths.add(path);
        }
    }
    if (paths.size === 0 && content.includes('```')) {
        return (
            <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-success" />
                <span className="text-success text-[10px] font-bold uppercase">Code Generated</span>
            </div>
        );
    }
    if (paths.size === 0) {
        return <span className="text-foreground/60">{content.length > 200 ? content.substring(0, 200) + '...' : content}</span>;
    }
    return null;
};
