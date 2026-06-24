"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Settings as SettingsIcon,
    Package,
    X,
    Copy,
    Check,
    Download,
    Eye,
    Globe,
    Lock,
    Database,
    Cpu,
    FileText,
    FolderOpen,
    Code2,
    Hammer,
    Grid3x3,
    FileEdit,
    Users,
    Sparkles,
    Clock,
    MessageSquare,
    Wrench,
    ArrowDownToLine,
    Info,
    Zap,
    AlertCircle,
    Circle,
    Trash2,
    RefreshCw,
    Link2,
    RotateCcw,
    Terminal,
    Play,
    Square as StopIcon,
    Bot,
    ChevronDown,
} from 'lucide-react';
import { fileApi, compilerApi, aiApi, versionsApi, dependenciesApi, copyToClipboard } from '@/lib/api';
import { ChatPanel, BuildResult } from '@/components/ChatPanel';
import { FileTree } from '@/components/FileTree';
import { Editor } from '@/components/Editor';
import { useNotification } from '@/components/Notification';
import { WikiModal } from '@/components/WikiModal';
import { BotConsole } from '@/components/BotConsole';

interface WorkspaceViewProps {
    sessionId: string;
    initialLanguage?: string;
    initialPrompt?: string | null;
    initialModel?: string | null;
    initialPlatform?: string;
    onExit: () => void;
    activeModal?: ModalKind;
    onSetActiveModal?: (modal: ModalKind) => void;
}

type ModalKind = null | 'settings' | 'history' | 'deps' | 'share' | 'compile' | 'clone' | 'wiki' | 'botconsole';
type SettingsTab = 'overview' | 'details' | 'team' | 'ai-model' | 'generation' | 'history' | 'knowledge' | 'compilation' | 'download';

const COMPILERS = [
    { id: 'javac', label: 'Javac', icon: Circle, desc: 'Standard Java compiler' },
    { id: 'gradle', label: 'Gradle', icon: Wrench, desc: 'Build automation tool' },
    { id: 'maven', label: 'Maven', icon: Package, desc: 'Project management & build' },
];

const SETTINGS_NAV = [
    { group: 'GENERAL', items: [
        { id: 'overview' as SettingsTab, label: 'Overview', icon: Grid3x3 },
        { id: 'details' as SettingsTab, label: 'Details', icon: FileEdit },
        { id: 'team' as SettingsTab, label: 'Team', icon: Users },
    ]},
    { group: 'CONFIGURATION', items: [
        { id: 'ai-model' as SettingsTab, label: 'AI Model', icon: Cpu },
        { id: 'generation' as SettingsTab, label: 'Generation', icon: Sparkles },
        { id: 'history' as SettingsTab, label: 'History', icon: Clock },
        { id: 'knowledge' as SettingsTab, label: 'Knowledge', icon: MessageSquare },
    ]},
    { group: 'BUILD', items: [
        { id: 'compilation' as SettingsTab, label: 'Compilation', icon: Hammer },
        { id: 'download' as SettingsTab, label: 'Download', icon: ArrowDownToLine },
    ]},
];

interface VersionStats {
    totalCommits: number;
    totalFilesChanged: number;
    lastCommit: string | null;
    aiCommits: number;
    userCommits: number;
    versions: any[];
}

interface DepsData {
    dependencies: any[];
    totalSize: number;
    maxSize: number;
    maxFiles: number;
}

export const WorkspaceView = ({ sessionId, initialLanguage: incomingLanguage = 'java', initialPrompt: incomingPrompt = null, initialModel: incomingModel = null, initialPlatform: incomingPlatform = 'minecraft', onExit, activeModal: propActiveModal, onSetActiveModal }: WorkspaceViewProps) => {
    const { showNotification } = useNotification();
    const [files, setFiles] = useState<{ [path: string]: string }>({});
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [compiling, setCompiling] = useState(false);

    // Restore platform/language from localStorage if URL params missing
    const savedPrefs = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('velix_session_prefs') || '{}') : {};
    const [language, setLanguage] = useState(incomingLanguage !== 'java' ? incomingLanguage : (savedPrefs.language || incomingLanguage));
    const [platform, setPlatform] = useState(incomingPlatform !== 'minecraft' ? incomingPlatform : (savedPrefs.platform || incomingPlatform));
    const [initialPrompt, setInitialPrompt] = useState<string | null>(incomingPrompt);
    const [model, setModel] = useState<string>(incomingModel || 'anthropic/claude-3-sonnet');
    const [models, setModels] = useState<{ id: string; name: string }[]>([]);
    const [compileHistory, setCompileHistory] = useState<any[]>([]);
    const [highlight, setHighlight] = useState<string>('');
    const [internalModal, setInternalModal] = useState<ModalKind>(null);
    const activeModal = propActiveModal ?? internalModal;
    const setActiveModal = onSetActiveModal ?? setInternalModal;
    const [settingsTab, setSettingsTab] = useState<SettingsTab>('overview');
    const [sessionName, setSessionName] = useState<string>('');
    const [isPublic, setIsPublic] = useState<boolean>(false);
    const [copied, setCopied] = useState(false);
    const [shareToken, setShareToken] = useState<string | null>(null);
    const [shareTokenCopied, setShareTokenCopied] = useState(false);
    const [fileTab, setFileTab] = useState<'files' | 'code'>('files');
    const [selectedCompiler, setSelectedCompiler] = useState<string>('javac');

    // Build result state (shown in chat)
    const [buildResult, setBuildResult] = useState<BuildResult | null>(null);

    // Clone state
    const [cloning, setCloning] = useState(false);
    const [userCredits, setUserCredits] = useState<number>(0);

    // Inline file/folder creation
    const [creatingFile, setCreatingFile] = useState(false);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    // Version history state
    const [versionStats, setVersionStats] = useState<VersionStats>({ totalCommits: 0, totalFilesChanged: 0, lastCommit: null, aiCommits: 0, userCommits: 0, versions: [] });
    const [versionFilter, setVersionFilter] = useState<'all' | 'ai' | 'user'>('all');
    const [versionsLoading, setVersionsLoading] = useState(false);
    const [restoring, setRestoring] = useState<number | null>(null);

    // Dependencies state
    const [depsData, setDepsData] = useState<DepsData>({ dependencies: [], totalSize: 0, maxSize: 5 * 1024 * 1024, maxFiles: 10 });
    const [depsLoading, setDepsLoading] = useState(false);
    const [uploadingDep, setUploadingDep] = useState(false);
    const [depsDragOver, setDepsDragOver] = useState(false);
    const depsFileInputRef = useRef<HTMLInputElement>(null);

    // Settings sub-states
    const [autoCompile, setAutoCompile] = useState(false);
    const [stopOnError, setStopOnError] = useState(true);
    const [useBuildVersion, setUseBuildVersion] = useState(false);
    const [javaVersion, setJavaVersion] = useState('21');
    const [javaVersions, setJavaVersions] = useState<{ id: string; name: string; default?: boolean }[]>([]);
    const [filenamePattern, setFilenamePattern] = useState('{name}-{version}');
    const [autoVerify, setAutoVerify] = useState(true);
    const [fixedHistory, setFixedHistory] = useState(false);
    const [knowledgeText, setKnowledgeText] = useState('');

    const loadCompileHistory = async (id: string) => {
        try {
            const history = await compilerApi.getHistory(id);
            setCompileHistory(Array.isArray(history) ? history : []);
        } catch (err) {
            console.error("Failed to load compile history", err);
            setCompileHistory([]);
        }
    };

    const loadVersionStats = async () => {
        setVersionsLoading(true);
        try {
            const stats = await versionsApi.getStats(sessionId);
            setVersionStats(stats);
        } catch (err) {
            console.error("Failed to load version stats", err);
        } finally {
            setVersionsLoading(false);
        }
    };

    const loadDeps = async () => {
        setDepsLoading(true);
        try {
            const data = await dependenciesApi.getDependencies(sessionId);
            setDepsData(data);
        } catch (err) {
            console.error("Failed to load dependencies", err);
        } finally {
            setDepsLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const { settings } = await aiApi.getProjectSettings(sessionId);
            if (settings) {
                if (settings.autoCompile !== undefined) setAutoCompile(settings.autoCompile);
                if (settings.stopOnError !== undefined) setStopOnError(settings.stopOnError);
                if (settings.useBuildVersion !== undefined) setUseBuildVersion(settings.useBuildVersion);
                if (settings.javaVersion) setJavaVersion(settings.javaVersion);
                if (settings.filenamePattern) setFilenamePattern(settings.filenamePattern);
                if (settings.autoVerify !== undefined) setAutoVerify(settings.autoVerify);
                if (settings.fixedHistory !== undefined) setFixedHistory(settings.fixedHistory);
                if (settings.knowledgeText) setKnowledgeText(settings.knowledgeText);
                if (settings.selectedCompiler) setSelectedCompiler(settings.selectedCompiler);
            }
        } catch (err) {
            console.error("Failed to load settings", err);
        }
    };

    useEffect(() => {
        aiApi.getModels().then(data => {
            if (Array.isArray(data)) setModels(data);
        }).catch(err => console.error("Failed to fetch models", err));
    }, []);

    // Persist platform/language to localStorage so refresh doesn't reset them
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('velix_session_prefs', JSON.stringify({ platform, language }));
        }
    }, [platform, language]);

    useEffect(() => {
        const jvs = compilerApi.getJavaVersions();
        if (jvs) {
            jvs.then((data: any) => {
                if (data?.versions) setJavaVersions(data.versions);
            }).catch(() => {});
        }
    }, []);

    useEffect(() => {
        if (sessionId) {
            loadFiles(sessionId);
            loadCompileHistory(sessionId);
            loadVersionStats();
            loadDeps();
            loadSettings();
            fileApi.listSessions().then(sessions => {
                const project = sessions.find((s: any) => s.id === sessionId);
                if (project) {
                    if (project.model) setModel(project.model);
                    else if (incomingModel) setModel(incomingModel);
                    if (project.name) setSessionName(project.name);
                    setIsPublic(project.is_public === 1 || project.is_public === true);
                    if (project.share_token) setShareToken(project.share_token);
                } else if (incomingModel) {
                    setModel(incomingModel);
                }
            });
        } else if (incomingModel) {
            setModel(incomingModel);
        }
    }, [sessionId, incomingModel]);

    useEffect(() => {
        if (activeModal === 'history') loadVersionStats();
        if (activeModal === 'deps') loadDeps();
        if (activeModal === 'clone') loadUserCredits();
    }, [activeModal]);

    const handleModelChange = async (newModel: string) => {
        setModel(newModel);
        try {
            await aiApi.updateModel(sessionId, newModel);
        } catch (err) {
            showNotification('Failed to save model preference.', 'error');
        }
    };

    const loadFiles = async (id: string) => {
        try {
            const loadedFiles = await fileApi.getFiles(id);
            const normalizedFiles: { [path: string]: string } = {};
            Object.entries(loadedFiles).forEach(([p, c]) => {
                normalizedFiles[p.replace(/\\/g, '/')] = c as string;
            });
            setFiles(normalizedFiles);
            const firstFile = Object.keys(normalizedFiles)[0];
            if (firstFile) setSelectedFile(firstFile);
        } catch (err) {
            showNotification('Failed to load project files.', 'error');
        }
    };

    const handleCodeGenerated = (_: string, result: any) => {
        if (result.files && Array.isArray(result.files)) {
            setFiles(prev => {
                const updated = { ...prev };
                result.files.forEach((f: any) => { updated[f.path.replace(/\\/g, '/')] = f.content; });
                return updated;
            });
            if (result.files?.length > 0 && !selectedFile) setSelectedFile(result.files[0].path);
        }
        setTimeout(() => loadVersionStats(), 1000);
    };

    const selectedFileRef = useRef(selectedFile);
    selectedFileRef.current = selectedFile;

    const handleSaveFile = async (content: string) => {
        const currentFile = selectedFileRef.current;
        if (!currentFile || !sessionId) return;
        setFiles(prev => ({ ...prev, [currentFile]: content }));
        await fileApi.saveFiles(sessionId, { [currentFile]: content }).catch(() => {
            showNotification('Auto-save failed.', 'error');
        });
    };

    const handleRun = async (compiler?: string) => {
        if (!sessionId) return;
        setActiveModal(null);
        setCompiling(true);
        setBuildResult(null);
        try {
            const result = await compilerApi.run(sessionId, language);
            const isSuccess = result.success === true || result.success === 1;
            setBuildResult({
                success: isSuccess,
                log: result.log || (isSuccess ? 'Build completed successfully.' : 'Build failed with errors.'),
                compiler: compiler || selectedCompiler,
                timestamp: new Date().toISOString(),
                historyId: result.historyId || undefined
            });
            loadCompileHistory(sessionId);
            showNotification(isSuccess ? 'Build completed.' : 'Build failed.', isSuccess ? 'success' : 'error');
        } catch (err: any) {
            setBuildResult({
                success: false,
                log: 'Error: ' + err.message,
                compiler: compiler || selectedCompiler,
                timestamp: new Date().toISOString()
            });
            showNotification('Build failed.', 'error');
        } finally {
            setCompiling(false);
        }
    };

    const handleCreateFile = async (parent?: string) => {
        if (!sessionId) return;
        setCreatingFile(true);
        setNewFileName('');
        setTimeout(() => fileInputRef.current?.focus(), 50);
    };

    const confirmCreateFile = async () => {
        const name = newFileName.trim();
        if (!name || !sessionId) { setCreatingFile(false); return; }
        try {
            await fileApi.create(sessionId, name, "");
            setFiles(prev => ({ ...prev, [name]: "" }));
            setSelectedFile(name);
        } catch { showNotification('Failed to create file.', 'error'); }
        setCreatingFile(false);
    };

    const handleCreateFolder = async (parent?: string) => {
        if (!sessionId) return;
        setCreatingFolder(true);
        setNewFolderName('');
        setTimeout(() => folderInputRef.current?.focus(), 50);
    };

    const confirmCreateFolder = async () => {
        const name = newFolderName.trim();
        if (!name || !sessionId) { setCreatingFolder(false); return; }
        try {
            await fileApi.createFolder(sessionId, name);
            setFiles(prev => ({ ...prev, [name + '/']: "" }));
        } catch { showNotification('Failed to create folder.', 'error'); }
        setCreatingFolder(false);
    };

    const handleDeletePath = async (path: string) => {
        if (!sessionId || !confirm(`Delete ${path}?`)) return;
        try {
            await fileApi.delete(sessionId, path);
            setFiles(prev => {
                const n = { ...prev };
                // Remove the file and any children if it's a folder
                Object.keys(n).forEach(key => {
                    if (key === path || key.startsWith(path + '/') || key.startsWith(path + '\\')) {
                        delete n[key];
                    }
                });
                return n;
            });
            if (selectedFile === path || selectedFile?.startsWith(path + '/') || selectedFile?.startsWith(path + '\\')) {
                setSelectedFile(null);
            }
        } catch { alert("Failed to delete"); }
    };

    const handleRenamePath = async (oldPath: string) => {
        if (!sessionId) return;
        const newName = prompt("Enter new name:", oldPath);
        if (!newName || newName === oldPath) return;
        try {
            await fileApi.rename(sessionId, oldPath, newName);
            setFiles(prev => {
                const n: Record<string, string> = {};
                Object.entries(prev).forEach(([key, val]) => {
                    if (key === oldPath) n[newName] = val;
                    else if (key.startsWith(oldPath + '/') || key.startsWith(oldPath + '\\')) {
                        n[key.replace(oldPath, newName)] = val;
                    } else {
                        n[key] = val;
                    }
                });
                return n;
            });
            if (selectedFile === oldPath) setSelectedFile(newName);
            else if (selectedFile?.startsWith(oldPath + '/') || selectedFile?.startsWith(oldPath + '\\')) {
                setSelectedFile(selectedFile.replace(oldPath, newName));
            }
        } catch { alert("Failed to rename"); }
    };

    const handleAutoFix = (error: string) => {
        setBuildResult(null);
        const fileContext = Object.entries(files)
            .filter(([path, content]) => content && !path.endsWith('/'))
            .slice(0, 10)
            .map(([path, content]) => `=== FILE: ${path} ===\n${content}`)
            .join('\n\n');
        const prompt = fileContext
            ? `The following code has a compilation error. Analyze the error and fix ALL files so it compiles correctly.\n\nCOMPILATION ERROR:\n\`\`\`\n${error}\n\`\`\`\n\nEXISTING SOURCE FILES:\n\`\`\`\n${fileContext}\n\`\`\`\n\nFix the code and regenerate all files. Do NOT change the project structure or features — only fix compilation errors.`
            : `The following code has a compilation error. Analyze the error and fix the code so it compiles correctly.\n\nCOMPILATION ERROR:\n\`\`\`\n${error}\n\`\`\`\n\nFix the code and regenerate all files.`;
        setInitialPrompt(prompt);
    };

    const handleBotFix = (error: string) => {
        setActiveModal(null);
        const fileContext = Object.entries(files)
            .filter(([path, content]) => content && !path.endsWith('/'))
            .slice(0, 10)
            .map(([path, content]) => `=== FILE: ${path} ===\n${content}`)
            .join('\n\n');
        const prompt = fileContext
            ? `My Discord bot failed to start with the following error. Analyze the error and fix ALL files so the bot runs correctly.\n\nBOT ERROR:\n\`\`\`\n${error}\n\`\`\`\n\nEXISTING SOURCE FILES:\n\`\`\`\n${fileContext}\n\`\`\`\n\nFix the code and regenerate all files. Do NOT change the project structure or features — only fix the error.`
            : `My Discord bot failed to start with the following error. Analyze the error and fix the code so the bot runs correctly.\n\nBOT ERROR:\n\`\`\`\n${error}\n\`\`\`\n\nFix the code and regenerate all files.`;
        setInitialPrompt(prompt);
    };

    const handleClone = async () => {
        if (!sessionId || cloning) return;
        setCloning(true);
        try {
            const result = await aiApi.fork(sessionId);
            if (result.success && result.newSessionId) {
                showNotification('Project cloned! Opening new session...', 'success');
                window.location.href = `/ide/${result.newSessionId}`;
            } else {
                showNotification(result.error || 'Failed to clone project.', 'error');
            }
        } catch {
            showNotification('Failed to clone project.', 'error');
        } finally {
            setCloning(false);
        }
    };

    const loadUserCredits = async () => {
        try {
            const res = await aiApi.getModels?.() || {};
        } catch {}
        try {
            const { authApi } = await import('@/lib/api');
            const me = await authApi.me();
            if (me?.user?.credits !== undefined) setUserCredits(me.user.credits);
        } catch {}
    };

    const handleRenameSession = async () => {
        const newName = prompt("Session name:", sessionName);
        if (!newName || newName === sessionName) return;
        try { await aiApi.renameProject(sessionId, newName); setSessionName(newName); showNotification('Session renamed.', 'success'); } catch { showNotification('Failed to rename.', 'error'); }
    };

    const handleToggleVisibility = async () => {
        const next = !isPublic;
        setIsPublic(next);
        try { await aiApi.toggleVisibility(sessionId, next); } catch { setIsPublic(!next); showNotification('Failed to update visibility.', 'error'); }
    };

    const handleToggleShareToken = async () => {
        if (shareToken) {
            try {
                await aiApi.removeShareToken(sessionId);
                setShareToken(null);
                showNotification('Private link removed.', 'success');
            } catch {
                showNotification('Failed to remove link.', 'error');
            }
        } else {
            try {
                const res = await aiApi.generateShareToken(sessionId);
                if (res.token) {
                    setShareToken(res.token);
                    showNotification('Private link generated.', 'success');
                }
            } catch {
                showNotification('Failed to generate link.', 'error');
            }
        }
    };

    const handleCopyShareToken = async () => {
        if (!shareToken) return;
        const url = `${window.location.origin}/s/${shareToken}`;
        if (await copyToClipboard(url)) {
            setShareTokenCopied(true);
            setTimeout(() => setShareTokenCopied(false), 1500);
        }
    };

    const handleSaveSettings = async () => {
        try {
            await aiApi.updateProjectSettings(sessionId, {
                autoCompile, stopOnError, useBuildVersion, javaVersion,
                filenamePattern, autoVerify, fixedHistory, knowledgeText, selectedCompiler
            });
            showNotification('Settings saved.', 'success');
            setActiveModal(null);
        } catch {
            showNotification('Failed to save settings.', 'error');
        }
    };

    const handleRestoreVersion = async (versionId: number) => {
        if (!confirm('Restore files to this version? Current changes will be overwritten.')) return;
        setRestoring(versionId);
        try {
            const result = await versionsApi.restore(sessionId, versionId);
            if (result.files) {
                const normalizedFiles: { [path: string]: string } = {};
                Object.entries(result.files).forEach(([p, c]) => {
                    normalizedFiles[p.replace(/\\/g, '/')] = c as string;
                });
                setFiles(normalizedFiles);
                const firstFile = Object.keys(normalizedFiles)[0];
                if (firstFile) setSelectedFile(firstFile);
                showNotification('Version restored.', 'success');
                loadVersionStats();
            }
        } catch {
            showNotification('Failed to restore version.', 'error');
        } finally {
            setRestoring(null);
        }
    };

    const handleDepUpload = async (file: File) => {
        if (!sessionId) return;
        setUploadingDep(true);
        try {
            const result = await dependenciesApi.upload(sessionId, file);
            if (result.success) {
                showNotification(`${file.name} uploaded.`, 'success');
                loadDeps();
            } else {
                showNotification(result.error || 'Upload failed.', 'error');
            }
        } catch {
            showNotification('Upload failed.', 'error');
        } finally {
            setUploadingDep(false);
        }
    };

    const handleDepDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDepsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.jar')) {
            handleDepUpload(file);
        } else {
            showNotification('Only JAR files are allowed.', 'error');
        }
    }, [sessionId]);

    const handleDepDelete = async (depId: number) => {
        if (!confirm('Remove this dependency?')) return;
        try {
            await dependenciesApi.remove(sessionId, depId);
            showNotification('Dependency removed.', 'success');
            loadDeps();
        } catch {
            showNotification('Failed to remove dependency.', 'error');
        }
    };

    const shareLink = typeof window !== 'undefined'
        ? isPublic
            ? `${window.location.origin}/pub/${sessionId}`
            : `${window.location.origin}/ide/${sessionId}`
        : '';
    const handleCopyLink = async () => { if (await copyToClipboard(shareLink)) { setCopied(true); setTimeout(() => setCopied(false), 1500); } };

    const fileCount = Object.keys(files).length;
    const depsSizeMB = (depsData.totalSize / (1024 * 1024)).toFixed(1);
    const maxSizeMB = (depsData.maxSize / (1024 * 1024)).toFixed(0);
    const filteredVersions = versionFilter === 'all' ? versionStats.versions : versionStats.versions.filter(v => v.commit_type === versionFilter);

    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Left: Chat */}
            <div className="w-[380px] lg:w-[420px] flex flex-col border-r border-[hsl(var(--surface-sunk))] shrink-0">
                <div className="flex-1 overflow-hidden">
                    <ChatPanel
                        sessionId={sessionId}
                        onCodeGenerated={handleCodeGenerated}
                        language={language}
                        platform={platform}
                        model={model}
                        initialPrompt={initialPrompt}
                        onInitialPromptHandled={() => setInitialPrompt(null)}
                        highlight={highlight}
                        buildResult={buildResult}
                        compiling={compiling}
                        onClearBuildResult={() => setBuildResult(null)}
                        onAutoFix={handleAutoFix}
                        onDownloadArtifact={(historyId) => compilerApi.downloadArtifact(historyId)}
                    />
                </div>
            </div>

            {/* Middle: Files */}
            <div className="w-64 lg:w-72 flex flex-col border-r border-[hsl(var(--surface-sunk))] shrink-0">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--surface-sunk))]">
                    <div className="flex items-center gap-1">
                        <button onClick={() => setFileTab('files')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${fileTab === 'files' ? 'bg-[hsl(var(--surface-sunk))] text-foreground font-bold' : 'text-muted hover:text-foreground hover:bg-[hsl(var(--surface-sunk))]'}`}>
                            <FolderOpen className="w-3.5 h-3.5" /> Files {fileCount > 0 && <span className="text-[10px] text-muted ml-0.5">{fileCount}</span>}
                        </button>
                        <button onClick={() => setFileTab('code')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${fileTab === 'code' ? 'bg-[hsl(var(--surface-sunk))] text-foreground font-bold' : 'text-muted hover:text-foreground hover:bg-[hsl(var(--surface-sunk))]'}`}>
                            <Code2 className="w-3.5 h-3.5" /> Code
                        </button>
                    </div>
                    {!language?.startsWith('config-') && !language?.startsWith('datapack-') && !language?.startsWith('scripting-') && (
                        platform === 'discord' ? (
                            <button onClick={() => setActiveModal('botconsole')}
                                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all bg-foreground text-background hover:opacity-90">
                                <Terminal className="w-3.5 h-3.5" /> Terminal
                            </button>
                        ) : (
                            <button onClick={() => setActiveModal('compile')} disabled={compiling}
                                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all disabled:opacity-50 bg-foreground text-background hover:opacity-90">
                                {compiling ? (<><div className="w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin" /> Building...</>) : (<><Hammer className="w-3.5 h-3.5" /> Compile</>)}
                            </button>
                        )
                    )}
                </div>
                {fileCount > 0 || creatingFile || creatingFolder ? (
                    <div className="flex-1 overflow-hidden flex flex-col">
                        {/* Inline file creation input */}
                        {creatingFile && (
                            <div className="px-3 py-2 border-b border-[hsl(var(--surface-sunk))] flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                                <input ref={fileInputRef} value={newFileName} onChange={e => setNewFileName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') confirmCreateFile(); if (e.key === 'Escape') setCreatingFile(false); }}
                                    className="flex-1 bg-transparent text-xs text-foreground focus:outline-none font-mono" placeholder="File name" />
                                <button onClick={confirmCreateFile} className="p-1 rounded text-success hover:bg-success/10 transition-all"><Check className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setCreatingFile(false)} className="p-1 rounded text-muted hover:bg-[hsl(var(--surface-sunk))] transition-all"><X className="w-3.5 h-3.5" /></button>
                            </div>
                        )}
                        {/* Inline folder creation input */}
                        {creatingFolder && (
                            <div className="px-3 py-2 border-b border-[hsl(var(--surface-sunk))] flex items-center gap-2">
                                <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                                <input ref={folderInputRef} value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') confirmCreateFolder(); if (e.key === 'Escape') setCreatingFolder(false); }}
                                    className="flex-1 bg-transparent text-xs text-foreground focus:outline-none font-mono" placeholder="Folder name" />
                                <button onClick={confirmCreateFolder} className="p-1 rounded text-success hover:bg-success/10 transition-all"><Check className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setCreatingFolder(false)} className="p-1 rounded text-muted hover:bg-[hsl(var(--surface-sunk))] transition-all"><X className="w-3.5 h-3.5" /></button>
                            </div>
                        )}
                        <div className="flex-1 overflow-hidden">
                            <FileTree sessionId={sessionId} files={Object.keys(files)} selectedFile={selectedFile} onSelect={setSelectedFile} onCreateFile={handleCreateFile} onCreateFolder={handleCreateFolder} onDelete={handleDeletePath} onRename={handleRenamePath} onRefresh={() => loadFiles(sessionId)} />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--surface-sunk))] border border-[hsl(var(--surface-sunk))] flex items-center justify-center mb-4">
                            <FolderOpen className="w-7 h-7 text-muted" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground mb-1">No files yet</h3>
                        <p className="text-[11px] text-muted mb-5">Start by creating your first file</p>
                        <div className="flex flex-col gap-2 w-full max-w-[180px]">
                            <button onClick={() => handleCreateFile()} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-foreground bg-success/20 hover:bg-success/30 border border-success/30 rounded-lg transition-all"><FileText className="w-3.5 h-3.5" /> New File</button>
                            <button onClick={() => handleCreateFolder()} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-muted hover:text-foreground neu-card border-[hsl(var(--surface-sunk))] rounded-lg transition-all"><FolderOpen className="w-3.5 h-3.5" /> New Folder</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Code */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 relative overflow-hidden">
                    {selectedFile ? (
                        <Editor file={selectedFile} content={files[selectedFile] || ''} onChange={handleSaveFile} onSelectionChange={setHighlight} onSave={() => selectedFile && handleSaveFile(files[selectedFile])} onClose={() => setSelectedFile(null)} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--surface-sunk))] border border-[hsl(var(--surface-sunk))] flex items-center justify-center mb-4"><FileText className="w-6 h-6 text-muted" /></div>
                            <p className="text-sm font-semibold text-muted">Select a file to edit</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ════════════════════════ MODALS ════════════════════════ */}

            {/* Compile Modal */}
            {activeModal === 'compile' && (
                <ModalOverlay onClose={() => setActiveModal(null)}>
                    <div className="w-full max-w-lg neu-card p-5 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <ModalHeader title="Build History" onClose={() => setActiveModal(null)} />
                        <div className="neu-inset rounded-xl p-5 mb-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center"><Cpu className="w-5 h-5 text-primary" /></div>
                                <div>
                                    <div className="text-sm font-bold text-foreground">Ready to build?</div>
                                    <div className="text-[11px] text-muted">Choose your compilation method</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {COMPILERS.map(c => {
                                    const Icon = c.icon;
                                    return (
                                        <button key={c.id} onClick={() => setSelectedCompiler(c.id)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${selectedCompiler === c.id ? 'bg-primary/20 text-primary border border-primary/30' : 'neu-card border-[hsl(var(--surface-sunk))] text-muted hover:text-foreground hover:border-[hsl(var(--surface-sunk))]'}`}>
                                            <Icon className="w-4 h-4" /> {c.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <button onClick={() => handleRun(selectedCompiler)} disabled={compiling}
                                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-background bg-foreground hover:opacity-90 rounded-xl transition-all disabled:opacity-50">
                                {compiling ? (<><div className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" /> Building...</>) : (<><Hammer className="w-3.5 h-3.5" /> Compile & Run</>)}
                            </button>
                        </div>
                        {compileHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="neu-inset w-14 h-14 flex items-center justify-center mb-3 rounded-xl"><Database className="w-6 h-6 text-faint" /></div>
                                <p className="text-sm font-semibold text-foreground">No builds yet</p>
                                <p className="text-xs text-muted mt-1">Your compilation history will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {compileHistory.map((h, i) => (
                                    <div key={h.id ?? i} className="neu-inset p-3 rounded-xl flex items-center justify-between">
                                        <div className="text-xs font-semibold text-foreground">
                                            {h.success ? <span className="text-success">Success</span> : <span className="text-danger">Failed</span>}
                                            <span className="text-muted ml-2 font-mono">{h.created_at ? new Date(h.created_at).toLocaleString() : `Build #${i + 1}`}</span>
                                            {h.artifact_path && <span className="text-faint ml-2 font-mono text-[10px]">.jar</span>}
                                        </div>
                                            {h.id && <button onClick={() => compilerApi.downloadArtifact(h.id)} className="neu-button px-2.5 py-1 text-[11px] text-primary flex items-center gap-1 rounded-lg"><Download className="w-3 h-3" /> Download</button>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ModalOverlay>
            )}

            {/* Bot Console Modal */}
            {activeModal === 'botconsole' && (
                <ModalOverlay onClose={() => setActiveModal(null)}>
                    <div className="w-full max-w-3xl neu-card animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
                        <BotConsole sessionId={sessionId} language={language || 'python'} onClose={() => setActiveModal(null)} onFixWithAI={handleBotFix} />
                    </div>
                </ModalOverlay>
            )}

            {/* Version History Modal */}
            {activeModal === 'history' && (
                <ModalOverlay onClose={() => setActiveModal(null)}>
                    <div className="w-full max-w-2xl max-h-[85vh] neu-card flex flex-col overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--surface-sunk))]">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                Version History
                            </h3>
                            <div className="flex items-center gap-2">
                                <button onClick={loadVersionStats} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-[hsl(var(--surface-sunk))] transition-all" title="Refresh">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-[hsl(var(--surface-sunk))] transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b border-[hsl(var(--surface-sunk))]">
                            <div className="neu-inset rounded-xl p-3 text-center">
                                <div className="text-2xl font-black text-foreground">{versionStats.totalCommits}</div>
                                <div className="text-[10px] text-muted uppercase font-bold">Total Commits</div>
                            </div>
                            <div className="neu-inset rounded-xl p-3 text-center">
                                <div className="text-2xl font-black text-foreground">{versionStats.totalFilesChanged}</div>
                                <div className="text-[10px] text-muted uppercase font-bold">Files Changed</div>
                            </div>
                            <div className="neu-inset rounded-xl p-3 text-center">
                                <div className="text-2xl font-black text-foreground">{versionStats.lastCommit ? formatTimeAgo(versionStats.lastCommit) : 'Never'}</div>
                                <div className="text-[10px] text-muted uppercase font-bold">Last Commit</div>
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-[hsl(var(--surface-sunk))]">
                            {[
                                { id: 'all' as const, label: 'All', count: versionStats.totalCommits },
                                { id: 'ai' as const, label: 'Velix', count: versionStats.aiCommits },
                                { id: 'user' as const, label: 'User', count: versionStats.userCommits },
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setVersionFilter(tab.id)}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${versionFilter === tab.id ? 'bg-primary/20 text-primary border border-primary/30' : 'neu-card border-[hsl(var(--surface-sunk))] text-muted hover:text-foreground'}`}>
                                    {tab.id === 'ai' ? <Sparkles className="w-3 h-3" /> : tab.id === 'user' ? <Users className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Version List */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {versionsLoading ? (
                                <div className="flex items-center justify-center py-10">
                                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                </div>
                            ) : filteredVersions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="neu-inset w-16 h-16 flex items-center justify-center mb-3 rounded-2xl">
                                        <Clock className="w-7 h-7 text-faint" />
                                    </div>
                                    <p className="text-sm font-semibold text-foreground mb-1">No version history yet</p>
                                    <p className="text-[11px] text-muted">Your changes are automatically saved as versions.</p>
                                    <p className="text-[11px] text-muted">Start coding and your progress will be tracked here.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredVersions.map((v, i) => {
                                        const changedFiles = Array.isArray(v.files_changed) ? v.files_changed : [];
                                        return (
                                            <div key={v.id} className="neu-inset rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        {v.commit_type === 'ai' ? (
                                                            <span className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center"><Sparkles className="w-3 h-3 text-primary" /></span>
                                                        ) : (
                                                            <span className="w-6 h-6 rounded-lg bg-success/15 flex items-center justify-center"><Users className="w-3 h-3 text-success" /></span>
                                                        )}
                                                        <div>
                                                            <span className="text-xs font-bold text-foreground">{v.commit_type === 'ai' ? 'AI Generated' : 'User Edit'}</span>
                                                            {v.message && <span className="text-[10px] text-muted ml-2 truncate max-w-[200px] inline-block">{v.message}</span>}
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] text-muted font-mono">{formatTimeAgo(v.created_at)}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        {changedFiles.slice(0, 3).map((f: string, fi: number) => (
                                                            <span key={fi} className="px-2 py-0.5 text-[9px] font-mono bg-[hsl(var(--surface))] rounded-md text-muted">{f.split('/').pop()}</span>
                                                        ))}
                                                        {changedFiles.length > 3 && <span className="text-[9px] text-muted">+{changedFiles.length - 3} more</span>}
                                                    </div>
                                                    <button onClick={() => handleRestoreVersion(v.id)} disabled={restoring === v.id}
                                                        className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50">
                                                        {restoring === v.id ? <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                                                        Restore
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Dependencies Modal */}
            {activeModal === 'deps' && (
                <ModalOverlay onClose={() => setActiveModal(null)}>
                    <div className="w-full max-w-2xl max-h-[85vh] neu-card flex flex-col overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--surface-sunk))]">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                Manage Dependencies
                            </h3>
                            <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-[hsl(var(--surface-sunk))] transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            {/* Info Banner */}
                            <div className="neu-inset p-3 rounded-xl mb-4 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                                    <Info className="w-4 h-4 text-primary" />
                                </div>
                                <p className="text-xs text-muted leading-relaxed">
                                    Dependencies are saved in your session and will persist across refreshes.
                                    Maximum {depsData.maxFiles} JARs, {maxSizeMB}MB total.
                                </p>
                            </div>

                            {/* Upload Section */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Add JAR Dependencies</h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${depsData.totalSize >= depsData.maxSize ? 'bg-danger/15 text-danger' : 'bg-primary/15 text-primary'}`}>
                                        {depsSizeMB}MB / {maxSizeMB}MB
                                    </span>
                                </div>

                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDepsDragOver(true); }}
                                    onDragLeave={() => setDepsDragOver(false)}
                                    onDrop={handleDepDrop}
                                    onClick={() => depsFileInputRef.current?.click()}
                                    className={`neu-inset rounded-xl p-8 text-center cursor-pointer transition-all border-2 border-dashed ${depsDragOver ? 'border-primary bg-primary/5' : 'border-[hsl(var(--surface-sunk))] hover:border-[hsl(var(--surface-sunk))]'}`}
                                >
                                    <input ref={depsFileInputRef} type="file" accept=".jar" className="hidden" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleDepUpload(file);
                                        e.target.value = '';
                                    }} />
                                    {uploadingDep ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
                                            <p className="text-sm font-semibold text-foreground">Uploading...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--surface))] border border-[hsl(var(--surface-sunk))] flex items-center justify-center mx-auto mb-3">
                                                <Package className="w-6 h-6 text-primary" />
                                            </div>
                                            <p className="text-sm font-semibold text-foreground mb-1">Drop JAR files here</p>
                                            <p className="text-[11px] text-muted mb-2">or <span className="text-primary font-bold underline">browse</span> to select</p>
                                            <p className="text-[10px] text-muted">Maximum {depsData.maxFiles} files &middot; {maxSizeMB}MB total &middot; Session only</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* How It Works */}
                            <div className="neu-inset rounded-xl p-4 mb-4">
                                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">How It Works</h4>
                                <ul className="space-y-2">
                                    {[
                                        'Upload JAR files to include them as dependencies during compilation',
                                        'Dependencies are compile-only by default, used to build but not included in the download',
                                        'Enable Shade on a JAR to include it inside your final download, relocated to avoid conflicts',
                                        'Files are stored in your session and persist across refreshes'
                                    ].map((text, i) => (
                                        <li key={i} className="flex items-start gap-2 text-[11px] text-muted">
                                            <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Plan Limits */}
                            <div className="neu-inset rounded-xl p-4 mb-4">
                                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Your Plan Limits</h4>
                                <div className="space-y-1 text-[11px]">
                                    <div className="flex justify-between"><span className="text-muted">Plan:</span><span className="font-bold text-foreground">Free</span></div>
                                    <div className="flex justify-between"><span className="text-muted">Size Limit:</span><span className="font-bold text-foreground">{maxSizeMB}MB</span></div>
                                    <div className="flex justify-between"><span className="text-muted">Next Upgrade:</span><span className="font-bold text-primary">Enterprise (10MB)</span></div>
                                </div>
                            </div>

                            {/* Dependency List */}
                            {depsData.dependencies.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                                        Installed <span className="text-muted font-normal">({depsData.dependencies.length})</span>
                                    </h4>
                                    <div className="space-y-2">
                                        {depsData.dependencies.map(dep => (
                                            <div key={dep.id} className="neu-card rounded-xl p-3 flex items-center justify-between border border-[hsl(var(--surface-sunk))]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                                                        <Package className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-foreground">{dep.file_name}</div>
                                                        <div className="text-[10px] text-muted">{(dep.file_size / 1024).toFixed(1)} KB</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => dependenciesApi.download(sessionId, dep.id)}
                                                        className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-[hsl(var(--surface-sunk))] transition-all" title="Download">
                                                        <Download className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDepDelete(dep.id)}
                                                        className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-all" title="Remove">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-4 border-t border-[hsl(var(--surface-sunk))] flex justify-end">
                            <button onClick={() => setActiveModal(null)} className="px-6 py-2.5 text-xs font-bold text-background bg-primary rounded-xl hover:opacity-90 transition-all">
                                Done
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Share Modal */}
            {activeModal === 'share' && (
                <ModalOverlay onClose={() => setActiveModal(null)}>
                    <div className="w-full max-w-md neu-card p-5 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <ModalHeader title="Project Visibility" onClose={() => setActiveModal(null)} />
                        <div className="space-y-4">
                            {/* Public Toggle */}
                            <div className="neu-inset p-4 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {isPublic ? <Globe className="w-4 h-4 text-success" /> : <Lock className="w-4 h-4 text-muted" />}
                                        <div>
                                            <div className="text-xs font-semibold text-foreground">Public</div>
                                            <div className="text-[11px] text-muted">{isPublic ? 'Anyone with the link can view & fork.' : 'Only you can access this session.'}</div>
                                        </div>
                                    </div>
                                    <button onClick={handleToggleVisibility} className={`relative h-6 w-11 rounded-full transition-all ${isPublic ? 'bg-primary' : 'neu-inset border border-[hsl(var(--surface-sunk))]'}`}>
                                        <span className={`absolute top-0.5 h-5 w-5 neu-raised rounded-full transition-all ${isPublic ? 'left-[22px]' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Share Link */}
                            {isPublic && (
                                <div className="neu-inset p-3 rounded-xl flex items-center gap-2">
                                    <span className="flex-1 truncate font-mono text-[11px] text-muted">{shareLink}</span>
                                    <button onClick={handleCopyLink} className="neu-button px-2.5 py-1.5 text-[11px] text-foreground flex items-center gap-1 rounded-lg shrink-0">
                                        {copied ? <><Check className="w-3 h-3 text-success" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                                    </button>
                                </div>
                            )}

                            {/* Private Link */}
                            <div className="neu-inset p-4 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Link2 className="w-4 h-4 text-muted" />
                                        <div>
                                            <div className="text-xs font-semibold text-foreground">Private Link</div>
                                            <div className="text-[11px] text-muted">{shareToken ? 'Anyone with this link can view' : 'Generate a private sharing link'}</div>
                                        </div>
                                    </div>
                                    <button onClick={handleToggleShareToken} className={`relative h-6 w-11 rounded-full transition-all ${shareToken ? 'bg-primary' : 'neu-inset border border-[hsl(var(--surface-sunk))]'}`}>
                                        <span className={`absolute top-0.5 h-5 w-5 neu-raised rounded-full transition-all ${shareToken ? 'left-[22px]' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                {shareToken && (
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="flex-1 truncate font-mono text-[11px] text-muted">{`${typeof window !== 'undefined' ? window.location.origin : ''}/s/${shareToken}`}</span>
                                        <button onClick={handleCopyShareToken} className="neu-button px-2.5 py-1.5 text-[11px] text-foreground flex items-center gap-1 rounded-lg shrink-0">
                                            {shareTokenCopied ? <><Check className="w-3 h-3 text-success" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Clone Project Modal */}
            {activeModal === 'clone' && (
                <ModalOverlay onClose={() => setActiveModal(null)}>
                    <div className="w-full max-w-md neu-card p-6 animate-scale-in text-center" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-[hsl(var(--surface-sunk))] transition-all">
                            <X className="w-4 h-4" />
                        </button>

                        <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
                            <Copy className="w-7 h-7 text-primary" />
                        </div>
                        <h3 className="text-lg font-extrabold text-foreground mb-1">Clone Your Project</h3>
                        <p className="text-xs text-muted mb-6">Create a complete copy in a new session</p>

                        {/* Stats */}
                        <div className="flex items-center justify-center gap-4 mb-5">
                            <div className="neu-inset rounded-xl px-5 py-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted" />
                                <span className="text-sm font-bold text-foreground">{fileCount}</span>
                                <span className="text-[10px] text-muted uppercase">Files</span>
                            </div>
                            <div className="neu-inset rounded-xl px-5 py-3 flex items-center gap-2">
                                <Database className="w-4 h-4 text-muted" />
                                <span className="text-sm font-bold text-foreground">{formatBytes(depsData.totalSize)}</span>
                                <span className="text-[10px] text-muted uppercase">Size</span>
                            </div>
                        </div>

                        {/* Cost */}
                        <div className="neu-inset rounded-xl p-4 mb-6 text-left">
                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-xs text-muted flex items-center gap-1.5"><Zap className="w-3 h-3 text-primary" /> Credit Cost</span>
                                <span className="text-xs font-bold text-primary">0.1</span>
                            </div>
                            <div className="flex items-center justify-between py-1.5 border-t border-[hsl(var(--surface-sunk))] mt-1.5">
                                <span className="text-xs text-muted">Your Balance</span>
                                <span className="text-xs font-bold text-foreground">{userCredits}</span>
                            </div>
                        </div>

                        <button onClick={handleClone} disabled={cloning || userCredits < 0.1}
                            className="w-full py-3 text-xs font-bold text-background bg-foreground hover:opacity-90 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            {cloning ? (<><div className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" /> Cloning...</>) : (<><Check className="w-4 h-4" /> Clone Project</>)}
                        </button>
                    </div>
                </ModalOverlay>
            )}

            {/* Wiki Modal */}
            {activeModal === 'wiki' && (
                <WikiModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    sessionId={sessionId}
                />
            )}

            {/* Session Settings Modal */}
            {activeModal === 'settings' && (
                <ModalOverlay onClose={() => setActiveModal(null)}>
                    <div className="w-full max-w-4xl max-h-[85vh] neu-card flex overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                        {/* Sidebar */}
                        <div className="w-56 border-r border-[hsl(var(--surface-sunk))] p-4 flex flex-col shrink-0">
                            <h3 className="text-sm font-extrabold text-foreground mb-4 px-2">Session Settings</h3>
                            <div className="flex-1 overflow-y-auto space-y-4">
                                {SETTINGS_NAV.map(group => (
                                    <div key={group.group}>
                                        <div className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-faint">{group.group}</div>
                                        {group.items.map(item => {
                                            const Icon = item.icon;
                                            return (
                                                <button key={item.id} onClick={() => setSettingsTab(item.id)}
                                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${settingsTab === item.id ? 'bg-[hsl(var(--surface-sunk))] text-foreground font-bold border-l-2 border-primary' : 'text-muted hover:text-foreground hover:bg-[hsl(var(--surface-sunk))]'}`}>
                                                    <Icon className="w-4 h-4" /> {item.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-4 pt-4 border-t border-[hsl(var(--surface-sunk))]">
                                <button onClick={() => setActiveModal(null)} className="flex-1 px-3 py-2 text-xs font-bold text-muted border border-[hsl(var(--surface-sunk))] rounded-lg hover:text-foreground transition-all">Cancel</button>
                                <button onClick={handleSaveSettings} className="flex-1 px-3 py-2 text-xs font-bold text-background bg-primary rounded-lg hover:opacity-90 transition-all">Save</button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {settingsTab === 'overview' && (
                                <SettingsContent title="Overview" subtitle="Session statistics and information">
                                    <div className="neu-inset rounded-xl p-5 mb-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center"><Info className="w-5 h-5 text-primary" /></div>
                                                <div><div className="text-sm font-bold text-foreground">Server Monitor</div><div className="text-[11px] text-muted">Live metrics from the session</div></div>
                                            </div>
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase bg-success/15 text-success rounded-md"><span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> Live</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="neu-card rounded-lg p-3 text-center"><div className="text-[10px] text-muted uppercase font-bold mb-1">CPU</div><div className="text-lg font-black text-foreground">0.0%</div></div>
                                            <div className="neu-card rounded-lg p-3 text-center"><div className="text-[10px] text-muted uppercase font-bold mb-1">Memory</div><div className="text-lg font-black text-foreground">21 MB</div></div>
                                            <div className="neu-card rounded-lg p-3 text-center"><div className="text-[10px] text-muted uppercase font-bold mb-1">Files</div><div className="text-lg font-black text-foreground">{fileCount}</div></div>
                                        </div>
                                    </div>
                                    <div className="neu-inset rounded-xl p-5">
                                        <div className="text-sm font-bold text-foreground mb-3">Session Information</div>
                                        <div className="space-y-3 text-xs">
                                            <InfoRow label="Session ID" value={<span className="font-mono">{sessionId.slice(0, 16)}</span>} />
                                            <InfoRow label="Game Type" value={platform === 'minecraft' ? 'Minecraft' : platform === 'discord' ? 'Discord Bot' : platform} />
                                            <InfoRow label="Category" value="Plugin" />
                                            <InfoRow label="Status" value={<span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-success/15 text-success rounded">Active</span>} />
                                        </div>
                                    </div>
                                </SettingsContent>
                            )}

                            {settingsTab === 'details' && (
                                <SettingsContent title="Details" subtitle="Session name and description">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-foreground mb-2 block">Session Name <span className="text-faint font-normal">{sessionName.length}/255</span></label>
                                            <input value={sessionName} onChange={e => setSessionName(e.target.value)} className="w-full neu-input rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none" placeholder="Give your session a memorable name" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-foreground mb-2 block">Session Description <span className="text-faint font-normal">0/1000</span></label>
                                            <textarea className="w-full neu-input rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none resize-none h-32" placeholder="Describe what this session is about..." />
                                            <p className="text-[10px] text-faint mt-1">A brief description of your project (max 1000 characters)</p>
                                        </div>
                                    </div>
                                </SettingsContent>
                            )}

                            {settingsTab === 'team' && (
                                <SettingsContent title="Team" subtitle="Manage collaborators">
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3"><span className="text-xs font-bold text-foreground">Invite</span><span className="text-[10px] text-faint">0 / 1</span></div>
                                        <input className="w-full neu-input rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none mb-3" placeholder="User ID" />
                                        <div className="flex gap-2 mb-3">
                                            <select className="neu-input rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none appearance-none"><option>Viewer</option><option>Editor</option></select>
                                            <select className="neu-input rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none appearance-none"><option>You pay</option><option>They pay</option></select>
                                        </div>
                                        <button className="w-full py-2.5 text-xs font-bold text-primary bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/20 transition-all"><Sparkles className="w-3.5 h-3.5" /> Send Invite</button>
                                    </div>
                                    <div className="text-xs font-bold text-foreground mb-2">Team <span className="text-faint font-normal">1</span></div>
                                    <div className="neu-inset rounded-xl p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">P</div>
                                        <div><div className="text-xs font-bold text-foreground">priyx.me</div><div className="text-[10px] text-primary font-bold uppercase">Owner</div></div>
                                    </div>
                                </SettingsContent>
                            )}

                            {settingsTab === 'ai-model' && (
                                <SettingsContent title="AI Model" subtitle="Configure AI model for generation">
                                    <div className="neu-inset rounded-xl p-4 mb-4">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Current Model</div>
                                        <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /><span className="text-sm font-bold text-foreground">{model}</span><span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-primary/15 text-primary rounded">Active</span></div>
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Select Model</div>
                                    <select value={model} onChange={e => handleModelChange(e.target.value)}
                                        className="w-full neu-input rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none appearance-none cursor-pointer">
                                        {models.length > 0 ? (
                                            models.map(m => <option key={m.id} value={m.id}>{m.name || m.id}</option>)
                                        ) : (
                                            <option value="anthropic/claude-3-sonnet">Loading models...</option>
                                        )}
                                    </select>
                                    {models.length > 0 && (
                                        <p className="text-[10px] text-faint mt-2">{models.length} models available from OpenRouter & NVIDIA</p>
                                    )}
                                </SettingsContent>
                            )}

                            {settingsTab === 'generation' && (
                                <SettingsContent title="Generation" subtitle="Configure generation settings">
                                    <div className="neu-inset rounded-xl p-5">
                                        <div className="text-sm font-bold text-foreground mb-4">Generation Settings</div>
                                        <div className="flex items-center justify-between py-3 border-b border-[hsl(var(--surface-sunk))]">
                                            <div className="flex items-center gap-3"><Sparkles className="w-4 h-4 text-primary" /><div><div className="text-xs font-bold text-foreground">Auto Verify</div><div className="text-[11px] text-muted">Automatically verify your project after each AI response</div></div></div>
                                            <ToggleSwitch checked={autoVerify} onChange={() => setAutoVerify(!autoVerify)} />
                                        </div>
                                    </div>
                                </SettingsContent>
                            )}

                            {settingsTab === 'history' && (
                                <SettingsContent title="History" subtitle="Configure conversation history settings">
                                    <div className="neu-inset rounded-xl p-5 mb-4 border-l-2 border-primary">
                                        <div className="flex items-center gap-2 mb-2"><Info className="w-4 h-4 text-primary" /><span className="text-sm font-bold text-foreground">Conversation History</span></div>
                                        <p className="text-[11px] text-muted leading-relaxed">By default, dynamic history is active. It automatically includes the most relevant recent messages to save tokens while keeping context.</p>
                                    </div>
                                    <div className="neu-inset rounded-xl p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-muted" /><div><div className="text-xs font-bold text-foreground">Enable Fixed History</div><div className="text-[11px] text-muted">Send a fixed number of previous messages to the AI.</div></div></div>
                                            <ToggleSwitch checked={fixedHistory} onChange={() => setFixedHistory(!fixedHistory)} />
                                        </div>
                                    </div>
                                    <div className="mt-3 px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl text-[11px] text-primary flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Dynamic history is active. The AI will automatically include recent context to save credits.</div>
                                </SettingsContent>
                            )}

                            {settingsTab === 'knowledge' && (
                                <SettingsContent title="Knowledge" subtitle="Tell the AI about your preferences, tech stack, and coding style">
                                    <div className="neu-inset rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-bold text-foreground">AI Knowledge Base</span>
                                            <span className="text-[10px] text-faint">{knowledgeText.length}/5000</span>
                                        </div>
                                        <textarea value={knowledgeText} onChange={e => setKnowledgeText(e.target.value.slice(0, 5000))} maxLength={5000}
                                            className="w-full neu-card rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none resize-none h-48 border border-[hsl(var(--surface-sunk))]" placeholder="Tell the AI about your preferences, coding style, tech stack, or any specific requirements..." />
                                        <p className="text-[10px] text-faint mt-2">The AI will use this information to better understand your needs (max 5000 characters)</p>
                                    </div>
                                </SettingsContent>
                            )}

                            {settingsTab === 'compilation' && (
                                <SettingsContent title="Compilation" subtitle="Configure compilation settings">
                                    <div className="neu-inset rounded-xl p-5 space-y-4">
                                        <div className="text-sm font-bold text-foreground">Compilation Settings</div>
                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-3"><Zap className="w-4 h-4 text-primary" /><div><div className="text-xs font-bold text-foreground">Auto Compile</div><div className="text-[11px] text-muted">Automatically compile your plugin when files are saved</div></div></div>
                                            <ToggleSwitch checked={autoCompile} onChange={() => setAutoCompile(!autoCompile)} />
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-3"><AlertCircle className="w-4 h-4 text-warning" /><div><div className="text-xs font-bold text-foreground">Stop on Error</div><div className="text-[11px] text-muted">Stop the compilation process when an error is encountered</div></div></div>
                                            <ToggleSwitch checked={stopOnError} onChange={() => setStopOnError(!stopOnError)} />
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-3"><Wrench className="w-4 h-4 text-muted" /><div><div className="text-xs font-bold text-foreground">Use Build Version</div><div className="text-[11px] text-muted">Add build number: PluginName.jar -&gt; PluginName-42.jar</div></div></div>
                                            <ToggleSwitch checked={useBuildVersion} onChange={() => setUseBuildVersion(!useBuildVersion)} />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="text-xs font-bold text-foreground mb-2 block">Java Version</label>
                                        <select value={javaVersion} onChange={e => setJavaVersion(e.target.value)} className="w-full neu-input rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none appearance-none cursor-pointer">
                                            {javaVersions.length > 0 ? (
                                                javaVersions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)
                                            ) : (
                                                <>
                                                    <option value="21">Java 21 (LTS)</option>
                                                    <option value="17">Java 17 (LTS)</option>
                                                    <option value="16">Java 16</option>
                                                    <option value="11">Java 11 (LTS)</option>
                                                    <option value="8">Java 8 (Legacy)</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </SettingsContent>
                            )}

                            {settingsTab === 'download' && (
                                <SettingsContent title="Download" subtitle="Download compiled artifacts">
                                    <div className="neu-inset rounded-xl p-5 border-l-2 border-primary mb-4">
                                        <div className="flex items-center gap-2 mb-2"><Info className="w-4 h-4 text-primary" /><span className="text-sm font-bold text-foreground">Download Settings</span></div>
                                        <p className="text-[11px] text-muted leading-relaxed">Customize how your compiled JAR files are named when downloaded. Use placeholders: {'{name}'}, {'{version}'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-foreground mb-2 block">Filename Pattern <span className="text-faint font-normal">{filenamePattern.length}/50</span></label>
                                        <input value={filenamePattern} onChange={e => setFilenamePattern(e.target.value.slice(0, 50))} className="w-full neu-input rounded-xl px-4 py-3 text-sm font-mono text-foreground focus:outline-none" />
                                        <p className="text-[10px] text-faint mt-1">Available: {'{name}'}, {'{version}'}</p>
                                        <div className="mt-3 px-4 py-2 bg-success/10 border border-success/20 rounded-xl text-[11px] text-success flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Preview: MyPlugin-1.0.jar</div>
                                    </div>
                                    <div className="mt-6">
                                        <label className="text-xs font-bold text-foreground mb-3 block">Compiled Builds</label>
                                        {compileHistory.length === 0 ? (
                                            <div className="neu-inset rounded-xl p-5 text-center">
                                                <p className="text-xs text-muted">No builds yet. Compile your project first.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {compileHistory.map((h, i) => (
                                                    <div key={h.id ?? i} className="neu-inset p-3 rounded-xl flex items-center justify-between">
                                                        <div>
                                                            <div className="text-xs font-semibold text-foreground">
                                                                {h.success ? <span className="text-success">Success</span> : <span className="text-danger">Failed</span>}
                                                                <span className="text-muted ml-2 font-mono">{h.created_at ? new Date(h.created_at).toLocaleString() : `Build #${i + 1}`}</span>
                                                            </div>
                                                            {h.artifact_path && <div className="text-[10px] text-faint mt-0.5 font-mono">{h.artifact_path.split('/').pop()}</div>}
                                                        </div>
                                                        {h.id && h.success ? (
                                                            <button onClick={() => compilerApi.downloadArtifact(h.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-background bg-foreground rounded-lg hover:opacity-90 transition-all">
                                                                <Download className="w-3 h-3" /> Download JAR
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </SettingsContent>
                            )}
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Dependencies Modal (top bar tab) - redirects to deps */}
            {false && activeModal === 'deps' && null}
        </div>
    );
};

/* ─── Shared Components ─── */

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>{children}</div>;
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
    return (
        <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary rounded-full" />{title}</h3>
            <button onClick={onClose} className="neu-button p-1.5 text-muted hover:text-foreground rounded-lg"><X className="w-4 h-4" /></button>
        </div>
    );
}

function SettingsContent({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div>
            <h2 className="text-lg font-extrabold text-foreground mb-1">{title}</h2>
            <p className="text-xs text-muted mb-5">{subtitle}</p>
            {children}
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return <div className="flex items-center justify-between py-2 border-b border-[hsl(var(--surface-sunk))] last:border-0"><span className="text-xs text-muted">{label}</span><span className="text-xs font-semibold text-foreground">{value}</span></div>;
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button onClick={onChange} className={`relative shrink-0 w-11 h-6 rounded-full transition-all duration-200 ${checked ? 'bg-primary' : 'bg-[hsl(var(--surface-sunk))] border border-[hsl(var(--surface-sunk))]'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-all duration-200 shadow-sm ${checked ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
    );
}

function formatTimeAgo(dateStr: string): string {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
