"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    ArrowLeft, BookOpen, Notebook, FilePlus, FilePlus2, FolderPlus,
    Globe, ChevronRight, Trash2, Save, Eye, EyeOff, X, Loader2, Play,
    ExternalLink, Link2, Unlink, Check, AlertCircle
} from 'lucide-react';
import { wikiApi, gitbookApi, type WikiPage } from '@/lib/api';
import { useNotification } from './Notification';

type WikiType = 'getting-started' | 'api-docs' | 'tutorial' | 'config' | 'faq' | 'changelog';

interface GitBookOrg {
    id: string;
    name: string;
}

interface WikiModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId: string;
}

export function WikiModal({ isOpen, onClose, sessionId }: WikiModalProps) {
    const { showNotification } = useNotification();
    const [pages, setPages] = useState<WikiPage[]>([]);
    const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [activeCommand, setActiveCommand] = useState<WikiType | null>(null);
    const [saving, setSaving] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const editorRef = useRef<HTMLTextAreaElement>(null);

    const [gitbookConnected, setGitbookConnected] = useState(false);
    const [gitbookUserName, setGitbookUserName] = useState('');
    const [gitbookOrgs, setGitbookOrgs] = useState<GitBookOrg[]>([]);
    const [selectedOrg, setSelectedOrg] = useState('');
    const [gitbookToken, setGitbookToken] = useState('');
    const [gitbookLoading, setGitbookLoading] = useState(false);
    const [gitbookError, setGitbookError] = useState('');
    const [gitbookPushing, setGitbookPushing] = useState(false);
    const [showGitbookPanel, setShowGitbookPanel] = useState(false);

    const commands: { type: WikiType; label: string }[] = [
        { type: 'getting-started', label: 'getting-started' },
        { type: 'api-docs', label: 'api-docs' },
        { type: 'tutorial', label: 'tutorial' },
        { type: 'config', label: 'config' },
        { type: 'faq', label: 'faq' },
        { type: 'changelog', label: 'changelog' }
    ];

    const loadPages = useCallback(async () => {
        try {
            const data = await wikiApi.getPages(sessionId);
            if (Array.isArray(data)) setPages(data);
        } catch (err) {
            console.error('Failed to load wiki pages:', err);
        }
    }, [sessionId]);

    const checkGitbookStatus = useCallback(async () => {
        try {
            const status = await gitbookApi.getStatus();
            setGitbookConnected(status.connected);
            setGitbookUserName(status.gitbook_user_name || '');
            if (status.connected) {
                const orgData = await gitbookApi.getOrganizations();
                if (Array.isArray(orgData.organizations)) {
                    setGitbookOrgs(orgData.organizations);
                    if (orgData.organizations.length > 0 && !selectedOrg) {
                        setSelectedOrg(orgData.organizations[0].id);
                    }
                }
            }
        } catch {
            setGitbookConnected(false);
        }
    }, [selectedOrg]);

    useEffect(() => {
        if (isOpen) {
            loadPages();
            checkGitbookStatus();
            setSelectedPage(null);
            setEditContent('');
            setEditTitle('');
            setPrompt('');
            setActiveCommand(null);
            setShowGitbookPanel(false);
            setGitbookToken('');
            setGitbookError('');
        }
    }, [isOpen, loadPages, checkGitbookStatus]);

    const handleSelectPage = (page: WikiPage) => {
        setSelectedPage(page);
        setEditContent(page.content || '');
        setEditTitle(page.title);
    };

    const handleNewPage = async () => {
        try {
            const page = await wikiApi.createPage(sessionId, 'Untitled Page');
            await loadPages();
            setSelectedPage(page);
            setEditContent('');
            setEditTitle('Untitled Page');
        } catch (err) {
            console.error('Failed to create page:', err);
        }
    };

    const handleSave = async () => {
        if (!selectedPage) return;
        setSaving(true);
        try {
            await wikiApi.updatePage(selectedPage.id, {
                title: editTitle,
                content: editContent
            });
            setSelectedPage({ ...selectedPage, title: editTitle, content: editContent });
        } catch (err) {
            console.error('Failed to save page:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (pageId: string) => {
        try {
            await wikiApi.deletePage(pageId);
            if (selectedPage?.id === pageId) {
                setSelectedPage(null);
                setEditContent('');
                setEditTitle('');
            }
            await loadPages();
        } catch (err) {
            console.error('Failed to delete page:', err);
        }
    };

    const handleTogglePublic = async (page: WikiPage) => {
        try {
            await wikiApi.toggleVisibility(page.id, !page.is_public);
            await loadPages();
            if (selectedPage?.id === page.id) {
                setSelectedPage({ ...page, is_public: page.is_public ? 0 : 1 });
            }
        } catch (err) {
            console.error('Failed to toggle visibility:', err);
        }
    };

    const handleGenerate = async (wikiType?: WikiType) => {
        if (!prompt.trim() && !wikiType) return;
        setGenerating(true);
        try {
            const typeLabel = wikiType || 'custom';
            const genPrompt = prompt.trim() || `Generate ${typeLabel} documentation`;
            const result = await wikiApi.generate(sessionId, genPrompt, wikiType);
            if (result.error) {
                showNotification(result.error, 'error');
                return;
            }
            if (result.page) {
                await loadPages();
                setSelectedPage(result.page);
                setEditContent(result.rawResponse || result.page.content);
                setEditTitle(result.page.title);
                showNotification('Wiki generated successfully!', 'success');
            }
            setPrompt('');
            setActiveCommand(null);
        } catch (err: any) {
            console.error('Failed to generate wiki:', err);
            showNotification(err.message || 'Failed to generate wiki', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleGitbookConnect = async () => {
        if (!gitbookToken.trim()) return;
        setGitbookLoading(true);
        setGitbookError('');
        try {
            const result = await gitbookApi.connect(gitbookToken.trim());
            if (result.error) {
                setGitbookError(result.error);
                return;
            }
            setGitbookConnected(true);
            setGitbookUserName(result.user?.name || '');
            setGitbookToken('');
            showNotification('GitBook connected!', 'success');
            const orgData = await gitbookApi.getOrganizations();
            if (Array.isArray(orgData.organizations)) {
                setGitbookOrgs(orgData.organizations);
                if (orgData.organizations.length > 0) setSelectedOrg(orgData.organizations[0].id);
            }
        } catch (err: any) {
            setGitbookError(err.message || 'Failed to connect');
        } finally {
            setGitbookLoading(false);
        }
    };

    const handleGitbookDisconnect = async () => {
        try {
            await gitbookApi.disconnect();
            setGitbookConnected(false);
            setGitbookUserName('');
            setGitbookOrgs([]);
            setSelectedOrg('');
            showNotification('GitBook disconnected', 'success');
        } catch {
            showNotification('Failed to disconnect', 'error');
        }
    };

    const handleGitbookPush = async () => {
        if (pages.length === 0) return;
        setGitbookPushing(true);
        try {
            const result = await gitbookApi.generateWiki(sessionId, undefined, selectedOrg || undefined);
            if (result.error) {
                showNotification(result.error, 'error');
                return;
            }
            showNotification(`Pushed ${result.pagesImported} pages to GitBook!`, 'success');
            if (result.spaceUrl) {
                window.open(result.spaceUrl, '_blank');
            }
        } catch (err: any) {
            if (err.message?.includes('GITBOOK_AUTH_EXPIRED') || err.message?.includes('token expired')) {
                showNotification('GitBook connection expired. Please reconnect.', 'error');
                setGitbookConnected(false);
            } else {
                showNotification(err.message || 'Failed to push to GitBook', 'error');
            }
        } finally {
            setGitbookPushing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleGenerate(activeCommand || undefined);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex bg-background text-foreground">
            {/* Left Panel: Wiki Generator */}
            <aside className="flex flex-col border-r border-white/5 w-[420px] shrink-0">
                <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                        <Notebook className="w-3.5 h-3.5 text-primary" />
                        <span className="font-medium">Wiki</span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary font-mono">
                            {pages.length}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-muted hover:text-foreground transition-colors"
                    >
                        <X className="w-3 h-3" />
                        Close
                    </button>
                </div>

                <div className="flex flex-1 flex-col p-5 overflow-y-auto">
                    {/* GitBook Connection Section */}
                    <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Link2 className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-semibold">GitBook</span>
                                {gitbookConnected && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-1.5 py-0.5 text-[10px] text-success">
                                        <Check className="w-2.5 h-2.5" /> Connected
                                    </span>
                                )}
                            </div>
                            {gitbookConnected ? (
                                <button
                                    onClick={() => setShowGitbookPanel(!showGitbookPanel)}
                                    className="text-[10px] text-muted hover:text-foreground transition-colors"
                                >
                                    {showGitbookPanel ? 'Hide' : 'Manage'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowGitbookPanel(!showGitbookPanel)}
                                    className="text-[10px] text-primary hover:text-primary/80 transition-colors"
                                >
                                    Connect
                                </button>
                            )}
                        </div>

                        {gitbookConnected ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[11px] text-muted">
                                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary">
                                        {gitbookUserName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="truncate">{gitbookUserName}</span>
                                </div>

                                {showGitbookPanel && (
                                    <>
                                        {gitbookOrgs.length > 0 && (
                                            <div className="mt-2">
                                                <label className="text-[10px] text-muted mb-1 block">Organization</label>
                                                <select
                                                    value={selectedOrg}
                                                    onChange={e => setSelectedOrg(e.target.value)}
                                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary/40"
                                                >
                                                    {gitbookOrgs.map(org => (
                                                        <option key={org.id} value={org.id}>{org.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={handleGitbookPush}
                                                disabled={gitbookPushing || pages.length === 0}
                                                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary/20 px-3 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/30 transition-all disabled:opacity-50"
                                            >
                                                {gitbookPushing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                                                {gitbookPushing ? 'Pushing...' : `Push ${pages.length} pages`}
                                            </button>
                                            <button
                                                onClick={handleGitbookDisconnect}
                                                className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-muted hover:text-danger hover:border-danger/30 transition-all"
                                            >
                                                <Unlink className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            showGitbookPanel && (
                                <div className="mt-3 space-y-2">
                                    <div className="text-[10px] text-muted leading-relaxed">
                                        Go to{' '}
                                        <a href="https://app.gitbook.com/account/developer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            GitBook Developer Settings
                                        </a>
                                        {' '}and generate a Personal Access Token.
                                    </div>
                                    <input
                                        type="password"
                                        value={gitbookToken}
                                        onChange={e => { setGitbookToken(e.target.value); setGitbookError(''); }}
                                        placeholder="Paste your GitBook access token..."
                                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground outline-none focus:border-primary/40 placeholder:text-faint"
                                    />
                                    {gitbookError && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-danger">
                                            <AlertCircle className="w-3 h-3" />
                                            {gitbookError}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleGitbookConnect}
                                        disabled={gitbookLoading || !gitbookToken.trim()}
                                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-background hover:opacity-90 transition-all disabled:opacity-50"
                                    >
                                        {gitbookLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                                        {gitbookLoading ? 'Validating...' : 'Connect GitBook'}
                                    </button>
                                </div>
                            )
                        )}
                    </div>

                    {/* Generator - always visible */}
                    <>
                            {/* Generator */}
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-primary">
                                    <Notebook className="w-5 h-5" />
                                </div>
                                <div className="mt-3 text-base font-semibold">Generate Documentation</div>
                                <div className="text-xs text-muted">Describe what you want to create</div>
                            </div>

                            <div className="mt-6 text-[11px] text-muted">
                                <span className="text-foreground">$</span> velix wiki{' '}
                                <span className="text-primary">--generate</span>
                                <span className="float-right inline-flex items-center gap-1 text-foreground">
                                    5 credits
                                </span>
                            </div>

                            <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3">
                                <div className="text-[11px] text-muted">
                                    <ChevronRight className="mr-1 inline h-3 w-3" />
                                    Create a getting started guide for my plugin...
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    rows={4}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="mt-1 w-full resize-none bg-transparent text-sm outline-none placeholder:text-faint"
                                    placeholder="Describe what documentation to generate..."
                                />
                                <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                                    <span>{prompt.length}/2000</span>
                                    <div className="flex items-center gap-2">
                                        <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">Ctrl+Enter</kbd>
                                        <span>to run</span>
                                        <button
                                            onClick={() => handleGenerate(activeCommand || undefined)}
                                            disabled={generating || (!prompt.trim() && !activeCommand)}
                                            className="ml-2 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-xs hover:bg-white/15 transition-colors disabled:opacity-50"
                                        >
                                            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Run
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 text-[11px] text-muted"># quick commands</div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                {commands.map((c) => (
                                    <button
                                        key={c.type}
                                        onClick={() => {
                                            setActiveCommand(activeCommand === c.type ? null : c.type);
                                            setPrompt(`Generate ${c.label} documentation for my project`);
                                        }}
                                        className={`rounded-md border px-3 py-2 text-left transition-all ${
                                            activeCommand === c.type
                                                ? 'border-primary/40 bg-primary/10 text-foreground'
                                                : 'border-white/10 bg-white/5 text-foreground/90 hover:bg-white/10'
                                        }`}
                                    >
                                        <Globe className="mr-2 inline h-3 w-3 text-primary" />
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                    </>
                </div>

                <div className="border-t border-white/5 px-4 py-2 text-[11px] text-muted">
                    {pages.length} pages
                </div>
            </aside>

            {/* Center Panel: Wiki Files */}
            <div className="flex flex-col border-r border-white/5 w-[260px] shrink-0">
                <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 text-xs">
                    <span className="flex items-center gap-1.5 text-muted">
                        <FilePlus2 className="w-3.5 h-3.5" /> Wiki Files
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {pages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
                                <FolderPlus className="w-6 h-6 text-muted/70" />
                            </div>
                            <div className="text-sm font-medium">No files yet</div>
                            <div className="text-xs text-muted">Start by creating your first file</div>
                            <div className="mt-2 flex w-full flex-col gap-2">
                                <button
                                    onClick={handleNewPage}
                                    className="flex items-center justify-center gap-2 rounded-md bg-success/90 px-3 py-1.5 text-xs font-medium text-background hover:bg-success transition-colors"
                                >
                                    <FilePlus className="w-3.5 h-3.5" /> New File
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-2 space-y-0.5">
                            {pages.map((page) => (
                                <div
                                    key={page.id}
                                    onClick={() => handleSelectPage(page)}
                                    className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all ${
                                        selectedPage?.id === page.id
                                            ? 'bg-primary/10 text-foreground'
                                            : 'text-muted hover:bg-white/5 hover:text-foreground'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Notebook className="w-3.5 h-3.5 shrink-0" />
                                        <span className="text-xs truncate">{page.title}</span>
                                        {page.is_public ? (
                                            <Globe className="w-3 h-3 text-success shrink-0" />
                                        ) : null}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleTogglePublic(page); }}
                                            className="p-1 rounded hover:bg-white/10 transition-colors"
                                            title={page.is_public ? 'Make private' : 'Make public'}
                                        >
                                            {page.is_public ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(page.id); }}
                                            className="p-1 rounded hover:bg-white/10 text-danger transition-colors"
                                            title="Delete page"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Wiki Editor */}
            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 text-xs">
                    <span className="flex items-center gap-1.5 text-muted">
                        <BookOpen className="w-3.5 h-3.5" /> Wiki Editor
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted">{pages.length} pages</span>
                        {selectedPage && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-1 rounded-md bg-primary/20 px-2 py-1 text-[11px] text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        )}
                    </div>
                </div>

                {selectedPage ? (
                    <div className="flex flex-col flex-1 min-h-0">
                        <div className="border-b border-white/5 px-4 py-2">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-faint"
                                placeholder="Page title..."
                            />
                        </div>
                        <div className="flex-1 min-h-0">
                            <textarea
                                ref={editorRef}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full h-full resize-none bg-transparent p-4 text-sm font-mono leading-relaxed outline-none placeholder:text-faint"
                                placeholder="Write your documentation in Markdown..."
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted">
                        <Notebook className="w-8 h-8 opacity-50" />
                        <div className="text-sm">Select a file to edit</div>
                    </div>
                )}
            </div>
        </div>
    );
}
