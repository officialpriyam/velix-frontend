"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, Bot, FileCode, Check, AlertCircle, Loader2, Copy, Hammer, X, FileText, File, FileCog, Download, CreditCard } from 'lucide-react';
import { aiApi, copyToClipboard } from '../lib/api';
import { useNotification } from './Notification';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';

interface Message {
    id?: number;
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
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
    onClearBuildResult?: () => void;
    onAutoFix?: (error: string) => void;
    onDownloadArtifact?: (historyId: number) => void;
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

export const ChatPanel = ({
    sessionId,
    onCodeGenerated,
    model = 'anthropic/claude-3-sonnet',
    language = 'java',
    platform = 'minecraft',
    compact = false,
    onPromptSubmit,
    initialPrompt,
    onInitialPromptHandled,
    highlight = '',
    modelDropdown,
    typeDropdown,
    buildResult,
    onClearBuildResult,
    onAutoFix,
    onDownloadArtifact
}: ChatPanelProps) => {
    const { showNotification } = useNotification();
    const router = useRouter();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusLog, setStatusLog] = useState<{ message: string; type: 'pending' | 'done' | 'error' }[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [generatedFiles, setGeneratedFiles] = useState<{ created: string[]; edited: string[] }>({ created: [], edited: [] });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    const statusLogKey = sessionId ? `velix_status_log_${sessionId}` : '';
    const generatedFilesKey = sessionId ? `velix_generated_files_${sessionId}` : '';

    useEffect(() => {
        if (statusLogKey && statusLog.length > 0) {
            try {
                localStorage.setItem(statusLogKey, JSON.stringify(statusLog));
            } catch {}
        }
    }, [statusLog, statusLogKey]);

    useEffect(() => {
        if (statusLogKey) {
            try {
                const saved = localStorage.getItem(statusLogKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setStatusLog(parsed);
                    }
                }
            } catch {}
        }
    }, [statusLogKey]);

    useEffect(() => {
        if (generatedFilesKey && (generatedFiles.created.length > 0 || generatedFiles.edited.length > 0)) {
            try {
                localStorage.setItem(generatedFilesKey, JSON.stringify(generatedFiles));
            } catch {}
        }
    }, [generatedFiles, generatedFilesKey]);

    useEffect(() => {
        if (generatedFilesKey) {
            try {
                const saved = localStorage.getItem(generatedFilesKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && (parsed.created?.length > 0 || parsed.edited?.length > 0)) {
                        setGeneratedFiles(parsed);
                    }
                }
            } catch {}
        }
    }, [generatedFilesKey]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (initialPrompt && !loading && !compact) {
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
                    setMessages(data);
                    setTimeout(scrollToBottom, 100);
                }
            }).catch(err => console.error('Failed to fetch messages:', err));
        } else {
            setMessages([]);
        }
    }, [sessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, statusLog, buildResult]);

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
        if (!userMsg || loading) return;

        // Check credits before generating
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

        let finalPrompt = userMsg;
        if (highlight && highlight.length > 0) {
            finalPrompt = `[PRIORITY CONTEXT: User highlighted the following code in the editor. Focus on this or use it for reference:]\n\`\`\`\n${highlight}\n\`\`\`\n\n${userMsg}`;
        }

        setPrompt('');
        setLoading(true);
        setGeneratedFiles({ created: [], edited: [] });

        setMessages(prev => {
            const isDuplicate = prev.length > 0 && prev[prev.length - 1].role === 'user' && prev[prev.length - 1].content === userMsg;
            if (isDuplicate) return prev;
            return [...prev, { role: 'user', content: userMsg }];
        });

        if (typeof window !== 'undefined' && window.location.search) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
        }

        const skillLabel = platform === 'minecraft' ? 'Minecraft' : platform === 'discord' ? 'Discord' : platform === 'hytale' ? 'Hytale' : platform;
        const platformLabel = platform === 'discord' ? 'Discord bot' : platform === 'hytale' ? 'Hytale Plugin' : 'Minecraft Plugin';

        setStatusLog([
            { message: 'Analyzing request...', type: 'pending' }
        ]);
        await new Promise(r => setTimeout(r, 500));

        setStatusLog([
            { message: 'Analyzing request...', type: 'done' },
            { message: `Loading ${skillLabel} skills...`, type: 'pending' }
        ]);
        await new Promise(r => setTimeout(r, 400));

        const skillDetails: Record<string, string[]> = {
            minecraft: ['Plugin Dev (Paper/Spigot)', 'Modding (NeoForge/Fabric)', 'Datapacks', 'Commands/Scripting'],
            hytale: ['Plugin Basics', 'Custom Blocks', 'Custom Items', 'Custom Entities', 'Events API'],
            discord: ['Bot Framework', 'Commands', 'Events']
        };
        const skills = skillDetails[platform] || [];

        const logs: { message: string; type: 'pending' | 'done' | 'error' }[] = [
            { message: 'Analyzing request...', type: 'done' },
            { message: `Loading ${skillLabel} skills...`, type: 'done' }
        ];
        for (const skill of skills.slice(0, 3)) {
            logs.push({ message: `  ${skill}`, type: 'pending' });
            setStatusLog([...logs]);
            await new Promise(r => setTimeout(r, 200));
            logs[logs.length - 1] = { message: `  ${skill}`, type: 'done' };
            setStatusLog([...logs]);
        }
        if (skills.length > 3) {
            logs.push({ message: `  +${skills.length - 3} more skills`, type: 'done' });
            setStatusLog([...logs]);
        }

        logs.push({ message: `Optimizing prompt...`, type: 'pending' });
        setStatusLog([...logs]);

        let optimizedPrompt = finalPrompt;
        try {
            const enhanceResult = await aiApi.enhancePrompt(finalPrompt, platform);
            if (enhanceResult.enhanced && enhanceResult.enhanced !== finalPrompt) {
                optimizedPrompt = enhanceResult.enhanced;
                logs[logs.length - 1] = { message: `Prompt optimized`, type: 'done' };
            } else {
                logs[logs.length - 1] = { message: `Prompt ready`, type: 'done' };
            }
        } catch {
            logs[logs.length - 1] = { message: `Using original prompt`, type: 'done' };
        }
        setStatusLog([...logs]);

        logs.push({ message: `Generating code...`, type: 'pending' });
        setStatusLog([...logs]);

        let result: any;
        try {
            result = await aiApi.generate(optimizedPrompt, language, model, sessionId || undefined, platform);
        } catch (fetchErr: any) {
            setStatusLog([{ message: `Error: ${fetchErr.message || 'Network error'}`, type: 'error' }]);
            showNotification(fetchErr.message || 'Failed to connect to server', 'error');
            setLoading(false);
            return;
        }

        if (result.error) {
            setStatusLog([{ message: `Error: ${result.error}`, type: 'error' }]);
            showNotification(result.error, 'error');
            setLoading(false);
            return;
        }

        if (result.creditsUsed !== undefined && result.creditsRemaining !== undefined) {
            showNotification(`Used ${result.creditsUsed} credits. Remaining: ${result.creditsRemaining} credits.`, 'success');
        }

        if (result.files && result.files.length > 0) {
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

            // Progressively reveal files one by one
            const revealCreated: string[] = [];
            const revealEdited: string[] = [];

            for (let i = 0; i < result.files.length; i++) {
                const file = result.files[i];
                const isNew = file.content && !file.content.startsWith('// Edit');
                const opLabel = isNew ? 'Created' : 'Edited';
                const opIcon = isNew ? '+' : '~';

                if (isNew) revealCreated.push(file.path);
                else revealEdited.push(file.path);

                setGeneratedFiles({ created: [...revealCreated], edited: [...revealEdited] });

                fileLogs.push({ message: `${opIcon} ${opLabel} ${file.path}`, type: 'pending' });
                setStatusLog([...fileLogs]);
                await new Promise(r => setTimeout(r, 120));
                fileLogs[fileLogs.length - 1] = { message: `${opIcon} ${opLabel} ${file.path}`, type: 'done' };
                setStatusLog([...fileLogs]);
            }

            fileLogs.push({ message: `${platformLabel} assembly complete!`, type: 'done' });
            setStatusLog([...fileLogs]);

            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: result.rawResponse, files: result.files }
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
    };

    if (compact) {
        return (
            <div className="relative flex flex-col min-h-[150px] justify-between">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    disabled={loading}
                    className="w-full bg-transparent border-0 px-5 pt-5 text-sm focus:outline-none resize-none h-[80px] placeholder:text-foreground/30 text-foreground"
                    placeholder="Ask Velix to create a config about..."
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
                            className="w-7 h-7 rounded-full border border-[hsl(var(--surface-sunk))] bg-[hsl(var(--surface-sunk))] flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
                        >
                            <span className="text-xs font-bold font-sans">+</span>
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
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto mb-2 space-y-2">
                {messages.length === 0 && statusLog.length === 0 && !buildResult && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <Sparkles className="w-5 h-5 text-muted mb-2" />
                        <p className="text-xs text-muted">Describe what you want to build</p>
                    </div>
                )}

                {messages.map((msg, i) => {
                    const isLast = i === messages.length - 1;
                    const showFileChips = isLast && msg.role === 'assistant' && generatedFiles.created.length + generatedFiles.edited.length > 0;
                    return (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in duration-200`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'neu-raised' : 'bg-primary/10 border border-primary/20'}`}>
                            {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-muted" /> : <Bot className="w-3.5 h-3.5 text-primary" />}
                        </div>
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === 'user'
                            ? 'neu-raised text-foreground'
                            : 'text-foreground/90'
                            }`}>
                            {msg.role === 'user' ? (
                                <p className="font-medium">{msg.content}</p>
                            ) : (
                                <AssistantMessageContent content={msg.content} />
                            )}
                            {showFileChips && (
                                <FileChipsSummary created={generatedFiles.created} edited={generatedFiles.edited} />
                            )}
                        </div>
                    </div>
                    );
                })}

                {buildResult && (
                    <div className="animate-in fade-in duration-200 rounded-xl border border-[hsl(var(--surface-sunk))] overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-[hsl(var(--surface-sunk))]">
                            <div className="flex items-center gap-2">
                                <Hammer className="w-3 h-3 text-muted" />
                                <span className="text-[11px] font-medium text-muted">Build</span>
                                {buildResult.success ? (
                                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-green-500/15 text-success rounded">OK</span>
                                ) : (
                                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-red-500/15 text-danger rounded">FAIL</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={async () => { if (await copyToClipboard(buildResult.log || '')) showNotification('Copied.', 'success'); else showNotification('Copy failed', 'error'); }} className="p-1 rounded text-muted hover:text-foreground transition-colors" title="Copy log">
                                    <Copy className="w-3 h-3" />
                                </button>
                                <button onClick={onClearBuildResult} className="p-1 rounded text-muted hover:text-foreground transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        {buildResult.log && (
                            <div className="px-3 py-2 max-h-[150px] overflow-y-auto bg-[hsl(var(--surface))]/50">
                                <pre className="text-[10px] font-mono leading-relaxed text-muted whitespace-pre-wrap break-words">{buildResult.log}</pre>
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-2 border-t border-[hsl(var(--surface-sunk))]">
                            {buildResult.success && buildResult.historyId && onDownloadArtifact && (
                                <button onClick={() => onDownloadArtifact(buildResult.historyId!)} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-background bg-foreground rounded-lg hover:opacity-90 transition-all">
                                    <Download className="w-3 h-3" /> JAR
                                </button>
                            )}
                            {!buildResult.success && onAutoFix && (
                                <button onClick={() => onAutoFix(buildResult.log)} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-background bg-foreground rounded-lg hover:opacity-90 transition-all">
                                    <Sparkles className="w-3 h-3" /> Auto-fix
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {statusLog.length > 0 && (
                    <div className="px-3 py-2 space-y-1 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                                <Loader2 className={`w-3 h-3 text-primary ${loading ? 'animate-spin' : ''}`} />
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                                    {loading ? 'Working...' : 'Done'}
                                </span>
                            </div>
                            {!loading && (
                                <button onClick={() => { setStatusLog([]); setGeneratedFiles({ created: [], edited: [] }); if (statusLogKey) try { localStorage.removeItem(statusLogKey); } catch {} if (generatedFilesKey) try { localStorage.removeItem(generatedFilesKey); } catch {} }} className="text-[10px] text-muted hover:text-foreground transition-colors px-1.5 py-0.5 rounded">
                                    Clear
                                </button>
                            )}
                        </div>
                        {statusLog.map((log, i) => (
                            <div key={i} className="flex items-center gap-2 py-0.5">
                                <div className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 ${log.type === 'done' ? 'bg-green-500/15' :
                                    log.type === 'error' ? 'bg-red-500/15' :
                                        'bg-primary/10'
                                    }`}>
                                    {log.type === 'done' && <Check className="w-2 h-2 text-success" />}
                                    {log.type === 'error' && <AlertCircle className="w-2 h-2 text-danger" />}
                                    {log.type === 'pending' && (
                                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                    )}
                                </div>
                                <span className={`text-[11px] ${log.type === 'done' ? 'text-success/80' :
                                    log.type === 'error' ? 'text-danger' :
                                        'text-muted'
                                    }`}>
                                    {log.message}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="mt-auto px-1 pb-1">
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Describe what you want to build..."
                        className="neu-input w-full text-xs text-foreground rounded-2xl p-4 pr-12 outline-none transition-all resize-none h-20"
                    />
                    <div className="absolute right-3 bottom-3 flex items-center gap-1.5 z-20">
                        <button
                            onClick={handleEnhance}
                            disabled={loading || !prompt.trim()}
                            className={`p-1.5 rounded-lg transition-all ${loading || !prompt.trim()
                                ? 'text-faint'
                                : 'text-muted hover:text-primary active:scale-95'
                                }`}
                            title="Enhance prompt"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => handleSend()}
                            disabled={loading || !prompt.trim()}
                            className={`p-1.5 rounded-lg transition-all ${loading || !prompt.trim()
                                ? 'text-faint bg-[hsl(var(--surface-sunk))]'
                                : 'bg-foreground text-background hover:opacity-90 active:scale-95'
                                }`}
                        >
                            {loading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Send className="w-3.5 h-3.5" />
                            )}
                        </button>
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
        <div data-file-chips className="mt-2 rounded-xl border border-white/10 bg-[#1a1a1a] overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-semibold text-zinc-200">Used {total} tool{total !== 1 ? 's' : ''}</span>
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

            {/* Created files */}
            {created.length > 0 && (
                <div className="px-4 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Created</div>
                    <div className="flex flex-wrap gap-1.5">
                        {created.map((path, idx) => (
                            <div
                                key={`c-${idx}`}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[11px] text-zinc-300 hover:bg-white/10 transition-colors cursor-default animate-in fade-in duration-150 fill-mode-both"
                                style={{ animationDelay: `${idx * 60}ms` }}
                            >
                                {getFileIcon(path)}
                                <span className="truncate max-w-[140px]">{path.split('/').pop()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Edited files */}
            {edited.length > 0 && (
                <div className={`px-4 py-3 ${created.length > 0 ? 'border-t border-white/5' : ''}`}>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Edited</div>
                    <div className="flex flex-wrap gap-1.5">
                        {edited.map((path, idx) => (
                            <div
                                key={`e-${idx}`}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[11px] text-zinc-400 hover:bg-white/10 transition-colors cursor-default animate-in fade-in duration-150 fill-mode-both"
                                style={{ animationDelay: `${(created.length + idx) * 60}ms` }}
                            >
                                {getFileIcon(path)}
                                <span className="truncate max-w-[140px]">{path.split('/').pop()}</span>
                            </div>
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
