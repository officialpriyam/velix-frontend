"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    ArrowLeft, BookOpen, Notebook, FilePlus, FilePlus2, FolderPlus,
    FolderOpen, Globe, ChevronRight, ChevronDown, Trash2, Save, Eye, EyeOff,
    X, Loader2, Play, ExternalLink, Link2, Unlink, Check, AlertCircle, FileCode
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

interface FileTreeNode {
    name: string;
    type: 'folder' | 'file';
    page?: WikiPage;
    children?: FileTreeNode[];
    path?: string;
}

function buildFileTree(pages: WikiPage[]): FileTreeNode[] {
    const folders: Record<string, FileTreeNode> = {};
    const root: FileTreeNode[] = [];

    for (const page of pages) {
        const pagePath: string = (page as any).path || '';

        if (pagePath === '_wiki.yml') {
            root.unshift({ name: '_wiki.yml', type: 'file', page });
            continue;
        }
        if (pagePath === 'index.md') {
            root.push({ name: 'index.md', type: 'file', page });
            continue;
        }

        if (pagePath) {
            const parts = pagePath.split('/');
            if (parts.length >= 2) {
                const folderName = parts[0];
                if (!folders[folderName]) {
                    folders[folderName] = { name: folderName, type: 'folder', children: [] };
                }
                folders[folderName].children!.push({
                    name: `${page.slug}.md`,
                    type: 'file',
                    page,
                    path: pagePath
                });
            } else {
                root.push({ name: `${page.slug}.md`, type: 'file', page, path: pagePath });
            }
        } else {
            root.push({ name: `${page.slug}.md`, type: 'file', page });
        }
    }

    for (const folder of Object.values(folders)) {
        root.push(folder);
    }

    return root;
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
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

    const [gitbookConnected, setGitbookConnected] = useState(false);
    const [gitbookUserName, setGitbookUserName] = useState('');
    const [gitbookOrgs, setGitbookOrgs] = useState<GitBookOrg[]>([]);
    const [selectedOrg, setSelectedOrg] = useState('');
    const [gitbookToken, setGitbookToken] = useState('');
    const [gitbookLoading, setGitbookLoading] = useState(false);
    const [gitbookError, setGitbookError] = useState('');
    const [gitbookPushing, setGitbookPushing] = useState(false);
    const [showGitbookPanel, setShowGitbookPanel] = useState(false);

    const [gitlabToken, setGitlabToken] = useState('');
    const [gitlabUrl, setGitlabUrl] = useState('https://gitlab.com');
    const [gitlabPushing, setGitlabPushing] = useState(false);
    const [showGitlabPanel, setShowGitlabPanel] = useState(false);
    const [gitlabProjectName, setGitlabProjectName] = useState('');
    const [gitlabConnected, setGitlabConnected] = useState(false);

    // Load saved GitLab token from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('velix_gitlab_token');
        const savedUrl = localStorage.getItem('velix_gitlab_url');
        if (savedToken) {
            setGitlabToken(savedToken);
            setGitlabConnected(true);
        }
        if (savedUrl) setGitlabUrl(savedUrl);
    }, []);

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
            setShowGitlabPanel(false);
            setGitbookToken('');
            setGitbookError('');
            setGitlabToken('');
            setGitlabProjectName('');
        }
    }, [isOpen, loadPages, checkGitbookStatus]);

    const handleSelectPage = (page: WikiPage) => {
        setSelectedPage(page);
        setEditContent(page.content || '');
        setEditTitle(page.title);
    };

    const handleNewPage = async (folder?: string) => {
        try {
            const title = 'Untitled Page';
            const slug = 'untitled-page';
            const path = folder ? `${folder}/${slug}` : '';
            const page = await wikiApi.createPage(sessionId, title, slug, '', path);
            await loadPages();
            setSelectedPage(page);
            setEditContent('');
            setEditTitle(title);
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
            showNotification('Saved!', 'success');
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

    const handleGitlabPush = async () => {
        if (!gitlabToken.trim()) return;
        setGitlabPushing(true);
        try {
            const result = await wikiApi.gitlabPush(sessionId, {
                gitlab_token: gitlabToken.trim(),
                gitlab_url: gitlabUrl.trim() || undefined,
                project_name: gitlabProjectName.trim() || undefined,
            });
            // Save token to localStorage on success
            localStorage.setItem('velix_gitlab_token', gitlabToken.trim());
            localStorage.setItem('velix_gitlab_url', gitlabUrl.trim() || 'https://gitlab.com');
            setGitlabConnected(true);
            if (result.errors && result.errors.length > 0) {
                showNotification(`Pushed ${result.pushed}/${result.total} files (${result.errors.length} failed): ${result.errors[0]}`, 'error');
            } else {
                showNotification(`Pushed ${result.pushed}/${result.total} files to GitLab!`, 'success');
            }
            if (result.projectUrl) {
                window.open(result.projectUrl, '_blank');
            }
        } catch (err: any) {
            showNotification(err.message || 'Failed to push to GitLab', 'error');
        } finally {
            setGitlabPushing(false);
        }
    };

    const handleGitlabDisconnect = () => {
        localStorage.removeItem('velix_gitlab_token');
        localStorage.removeItem('velix_gitlab_url');
        setGitlabToken('');
        setGitlabConnected(false);
        showNotification('GitLab disconnected', 'success');
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

    const toggleFolder = (name: string) => {
        setExpandedFolders(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const fileTree = buildFileTree(pages);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex bg-background text-foreground">
            {/* Left Panel: Wiki Generator */}
            <aside className="flex flex-col border-r border-white/5 w-[320px] md:w-[420px] shrink-0">
                <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                        <Notebook className="w-3.5 h-3.5 text-primary" />
                        <span className="font-medium">Wiki</span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary font-mono">
                            {pages.filter(p => (p as any).path !== '_wiki.yml' && (p as any).path !== 'index.md').length}
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

                <div className="flex flex-1 flex-col p-4 md:p-5 overflow-y-auto">
                    {/* GitBook Connection */}
                    <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Link2 className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-semibold">Hosting</span>
                            </div>
                        </div>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => { setShowGitbookPanel(!showGitbookPanel); setShowGitlabPanel(false); }}
                                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-all border ${
                                    showGitbookPanel ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 bg-white/5 text-muted hover:text-foreground'
                                }`}
                            >
                                {gitbookConnected ? <Check className="w-3 h-3 text-success" /> : <Link2 className="w-3 h-3" />}
                                GitBook
                            </button>
                            <button
                                onClick={() => { setShowGitlabPanel(!showGitlabPanel); setShowGitbookPanel(false); }}
                                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-all border ${
                                    showGitlabPanel ? 'border-orange-400/40 bg-orange-400/10 text-orange-400' : 'border-white/10 bg-white/5 text-muted hover:text-foreground'
                                }`}
                            >
                                <ExternalLink className="w-3 h-3" />
                                GitLab
                            </button>
                        </div>

                        {showGitbookPanel && (
                            <div className="mt-3 space-y-2">
                                {gitbookConnected ? (
                                    <>
                                        <div className="flex items-center gap-2 text-[11px] text-muted">
                                            <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary">
                                                {gitbookUserName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="truncate">{gitbookUserName}</span>
                                        </div>
                                        {gitbookOrgs.length > 0 && (
                                            <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}
                                                className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-foreground outline-none">
                                                {gitbookOrgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                                            </select>
                                        )}
                                        <div className="flex gap-2">
                                            <button onClick={handleGitbookPush} disabled={gitbookPushing || pages.length === 0}
                                                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-primary/20 px-2 py-1.5 text-[10px] font-medium text-primary hover:bg-primary/30 disabled:opacity-50">
                                                {gitbookPushing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                                                {gitbookPushing ? 'Pushing...' : `Push ${pages.length} pages`}
                                            </button>
                                            <button onClick={handleGitbookDisconnect}
                                                className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] text-muted hover:text-danger">
                                                <Unlink className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-[10px] text-muted leading-relaxed">
                                            Go to <a href="https://app.gitbook.com/account/developer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitBook Developer Settings</a> and generate a PAT.
                                        </div>
                                        <input type="password" value={gitbookToken} onChange={e => { setGitbookToken(e.target.value); setGitbookError(''); }}
                                            placeholder="Paste GitBook access token..." className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-foreground outline-none focus:border-primary/40 placeholder:text-faint" />
                                        {gitbookError && <div className="flex items-center gap-1 text-[10px] text-danger"><AlertCircle className="w-3 h-3" />{gitbookError}</div>}
                                        <button onClick={handleGitbookConnect} disabled={gitbookLoading || !gitbookToken.trim()}
                                            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary px-2 py-1.5 text-[11px] font-medium text-background hover:opacity-90 disabled:opacity-50">
                                            {gitbookLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                                            {gitbookLoading ? 'Validating...' : 'Connect'}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {showGitlabPanel && (
                            <div className="mt-3 space-y-2">
                                {gitlabConnected ? (
                                    <>
                                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                                            <Check className="w-3 h-3 text-green-400" />
                                            <span className="text-[10px] text-green-400 font-medium">GitLab Connected</span>
                                        </div>
                                        <input type="text" value={gitlabProjectName} onChange={e => setGitlabProjectName(e.target.value)}
                                            placeholder="Project name (optional)" className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-foreground outline-none focus:border-orange-400/40 placeholder:text-faint" />
                                        <div className="flex gap-2">
                                            <button onClick={handleGitlabPush} disabled={gitlabPushing}
                                                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-all">
                                                {gitlabPushing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                                                {gitlabPushing ? 'Pushing...' : `Push ${pages.length} pages`}
                                            </button>
                                            <button onClick={handleGitlabDisconnect}
                                                className="px-2 py-1.5 text-[10px] text-muted hover:text-red-400 rounded-lg border border-white/10 hover:border-red-500/20 transition-all">
                                                Disconnect
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-[10px] text-muted leading-relaxed">
                                            Enter a GitLab Personal Access Token with <code className="text-primary">api</code> scope.
                                        </div>
                                        <input type="text" value={gitlabUrl} onChange={e => setGitlabUrl(e.target.value)}
                                            placeholder="https://gitlab.com" className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-foreground outline-none focus:border-orange-400/40 placeholder:text-faint" />
                                        <input type="text" value={gitlabProjectName} onChange={e => setGitlabProjectName(e.target.value)}
                                            placeholder="Project name (optional)" className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-foreground outline-none focus:border-orange-400/40 placeholder:text-faint" />
                                        <input type="password" value={gitlabToken} onChange={e => setGitlabToken(e.target.value)}
                                            placeholder="Paste GitLab access token..." className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-foreground outline-none focus:border-orange-400/40 placeholder:text-faint" />
                                        <button onClick={handleGitlabPush} disabled={gitlabPushing || !gitlabToken.trim()}
                                            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-all">
                                            {gitlabPushing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                                            {gitlabPushing ? 'Pushing...' : `Push ${pages.length} pages to GitLab`}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Generator */}
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-primary">
                            <Notebook className="w-4 h-4" />
                        </div>
                        <div className="mt-2 text-sm font-semibold">Generate Documentation</div>
                        <div className="text-[10px] text-muted">Describe what you want to create</div>
                    </div>

                    <div className="mt-4 text-[10px] text-muted">
                        <span className="text-foreground">$</span> velix wiki{' '}
                        <span className="text-primary">--generate</span>
                        <span className="float-right text-primary font-medium">5 credits</span>
                    </div>

                    <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3">
                        <textarea
                            ref={textareaRef}
                            rows={4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full resize-none bg-transparent text-xs outline-none placeholder:text-faint"
                            placeholder="Describe what documentation to generate..."
                        />
                        <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
                            <span>{prompt.length}/2000</span>
                            <div className="flex items-center gap-2">
                                <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px]">Ctrl+Enter</kbd>
                                <button
                                    onClick={() => handleGenerate(activeCommand || undefined)}
                                    disabled={generating || (!prompt.trim() && !activeCommand)}
                                    className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] hover:bg-white/15 disabled:opacity-50"
                                >
                                    {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Run
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-[10px] text-muted"># quick commands</div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                        {commands.map((c) => (
                            <button
                                key={c.type}
                                onClick={() => {
                                    setActiveCommand(activeCommand === c.type ? null : c.type);
                                    setPrompt(`Generate ${c.label} documentation for my project`);
                                }}
                                className={`rounded-md border px-2.5 py-2 text-left transition-all ${
                                    activeCommand === c.type
                                        ? 'border-primary/40 bg-primary/10 text-foreground'
                                        : 'border-white/10 bg-white/5 text-foreground/90 hover:bg-white/10'
                                }`}
                            >
                                <Globe className="mr-1.5 inline h-3 w-3 text-primary" />
                                {c.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-white/5 px-4 py-2 text-[10px] text-muted">
                    {pages.filter(p => (p as any).path !== '_wiki.yml' && (p as any).path !== 'index.md').length} pages
                </div>
            </aside>

            {/* Center Panel: Wiki Files - Tree View */}
            <div className="flex flex-col border-r border-white/5 w-[220px] md:w-[260px] shrink-0">
                <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 text-xs">
                    <span className="flex items-center gap-1.5 text-muted">
                        <FilePlus2 className="w-3.5 h-3.5" /> Wiki Files
                    </span>
                    <button
                        onClick={() => handleNewPage()}
                        className="p-1 rounded hover:bg-white/10 text-muted hover:text-foreground transition-colors"
                        title="New file"
                    >
                        <FilePlus className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {pages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                                <FolderPlus className="w-5 h-5 text-muted/70" />
                            </div>
                            <div className="text-xs font-medium">No files yet</div>
                            <div className="text-[10px] text-muted">Generate documentation to start</div>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {fileTree.map((node) => (
                                <TreeNode
                                    key={node.name}
                                    node={node}
                                    depth={0}
                                    selectedPage={selectedPage}
                                    expandedFolders={expandedFolders}
                                    onToggleFolder={toggleFolder}
                                    onSelectPage={handleSelectPage}
                                    onDeletePage={handleDelete}
                                    onTogglePublic={handleTogglePublic}
                                />
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
                        <span className="text-[10px] text-muted">{pages.length} files</span>
                        {selectedPage && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-1 rounded-md bg-primary/20 px-2 py-1 text-[10px] text-primary hover:bg-primary/30 disabled:opacity-50"
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
                                className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-faint"
                                placeholder="Page title..."
                            />
                        </div>
                        <div className="flex-1 min-h-0">
                            <textarea
                                ref={editorRef}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full h-full resize-none bg-transparent p-4 text-xs font-mono leading-relaxed outline-none placeholder:text-faint"
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

function TreeNode({
    node, depth, selectedPage, expandedFolders, onToggleFolder, onSelectPage, onDeletePage, onTogglePublic
}: {
    node: FileTreeNode;
    depth: number;
    selectedPage: WikiPage | null;
    expandedFolders: Record<string, boolean>;
    onToggleFolder: (name: string) => void;
    onSelectPage: (page: WikiPage) => void;
    onDeletePage: (pageId: string) => void;
    onTogglePublic: (page: WikiPage) => void;
}) {
    const isExpanded = expandedFolders[node.name] !== false;

    if (node.type === 'folder') {
        return (
            <div>
                <div
                    onClick={() => onToggleFolder(node.name)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-muted hover:bg-white/5 hover:text-foreground transition-all"
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                >
                    {isExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                    {isExpanded ? <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" /> : <FolderPlus className="w-3.5 h-3.5 text-primary shrink-0" />}
                    <span className="text-xs font-medium truncate">{node.name}</span>
                </div>
                {isExpanded && node.children && (
                    <div>
                        {node.children.map((child) => (
                            <TreeNode
                                key={child.name}
                                node={child}
                                depth={depth + 1}
                                selectedPage={selectedPage}
                                expandedFolders={expandedFolders}
                                onToggleFolder={onToggleFolder}
                                onSelectPage={onSelectPage}
                                onDeletePage={onDeletePage}
                                onTogglePublic={onTogglePublic}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const isSelected = selectedPage?.id === node.page?.id;
    const isYaml = node.name === '_wiki.yml';
    const isIndex = node.name === 'index.md';

    return (
        <div
            onClick={() => node.page && onSelectPage(node.page)}
            className={`group flex items-center justify-between rounded-md px-2 py-1.5 cursor-pointer transition-all ${
                isSelected ? 'bg-primary/10 text-foreground' : 'text-muted hover:bg-white/5 hover:text-foreground'
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
            <div className="flex items-center gap-1.5 min-w-0">
                <FileCode className={`w-3.5 h-3.5 shrink-0 ${isYaml ? 'text-amber-400' : isIndex ? 'text-blue-400' : ''}`} />
                <span className={`text-xs truncate ${isYaml || isIndex ? 'font-medium' : ''}`}>{node.name}</span>
                {node.page && (node.page as any).is_public ? (
                    <Globe className="w-2.5 h-2.5 text-success shrink-0" />
                ) : null}
            </div>
            {node.page && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onTogglePublic(node.page!); }}
                        className="p-0.5 rounded hover:bg-white/10 transition-colors"
                        title={(node.page as any).is_public ? 'Make private' : 'Make public'}
                    >
                        {(node.page as any).is_public ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeletePage(node.page!.id); }}
                        className="p-0.5 rounded hover:bg-white/10 text-danger transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-2.5 h-2.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
