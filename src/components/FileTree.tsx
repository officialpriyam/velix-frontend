"use client";

import React, { useState, useMemo } from 'react';
import { File, Folder, ChevronRight, ChevronDown, Plus, Trash2, Edit2, FolderPlus, Upload, Download, ArchiveRestore, FileArchive, Loader2 } from 'lucide-react';
import { fileApi } from '@/lib/api';

interface FileTreeProps {
    sessionId: string;
    files: string[];
    selectedFile: string | null;
    onSelect: (file: string) => void;
    onCreateFile?: (parent?: string) => void;
    onCreateFolder?: (parent?: string) => void;
    onDelete?: (path: string) => void;
    onRename?: (path: string) => void;
    onRefresh?: () => void;
}

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children: FileNode[];
}

export const FileTree = ({
    sessionId,
    files,
    selectedFile,
    onSelect,
    onCreateFile,
    onCreateFolder,
    onDelete,
    onRename,
    onRefresh
}: FileTreeProps) => {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const treeData = useMemo(() => {
        const root: FileNode = { name: 'root', path: '', type: 'folder', children: [] };

        // Patterns to hide (Sync with backend for safety)
        const hidePatterns = ['target/', '.git/', 'node_modules/', '.DS_Store', '.idea/', '.vscode/', 'build/'];

        files.forEach(filePath => {
            const shouldHide = hidePatterns.some(pattern =>
                filePath.startsWith(pattern) || filePath.includes('/' + pattern)
            );
            if (shouldHide) return;

            const parts = filePath.split(/[\\/]/).filter(p => !!p);
            let current = root;
            let currentPath = '';

            parts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                const isLast = index === parts.length - 1;
                let existing = current.children.find(child => child.name === part);

                if (!existing) {
                    existing = {
                        name: part,
                        path: currentPath,
                        type: isLast ? 'file' : 'folder',
                        children: []
                    };
                    current.children.push(existing);
                }
                current = existing;
            });
        });

        const sortNodes = (nodes: FileNode[]) => {
            nodes.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
            nodes.forEach(node => {
                if (node.children.length > 0) sortNodes(node.children);
            });
        };

        sortNodes(root.children);
        return root;
    }, [files]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const targetFiles = e.target.files;
        if (!targetFiles || targetFiles.length === 0) return;

        setUploading(true);
        try {
            await fileApi.upload(sessionId, Array.from(targetFiles));
            onRefresh?.();
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUnzip = async (path: string) => {
        try {
            await fileApi.unzip(sessionId, path);
            onRefresh?.();
        } catch (err) {
            console.error('Unzip failed:', err);
        }
    };

    const toggleFolder = (path: string) => {
        const next = new Set(expandedFolders);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        setExpandedFolders(next);
    };

    const renderNode = (node: FileNode, level: number = 0) => {
        const isSelected = selectedFile === node.path;
        const isExpanded = expandedFolders.has(node.path);
        const paddingLeft = level * 12 + 12;
        const isZip = node.name.toLowerCase().endsWith('.zip');

        return (
            <div key={node.path}>
                <div
                    className={`group flex items-center justify-between py-1.5 px-2.5 rounded-xl transition-all cursor-pointer mx-1 my-0.5 ${isSelected
                        ? 'neu-inset text-primary'
                        : 'hover:bg-[hsl(var(--surface-sunk))] text-muted hover:text-foreground border border-transparent'
                        }`}
                    style={{ paddingLeft: `${paddingLeft}px` }}
                    onClick={() => {
                        if (node.type === 'folder') toggleFolder(node.path);
                        else onSelect(node.path);
                    }}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {node.type === 'folder' ? (
                            <div className="flex items-center">
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0 mr-1 text-muted" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 mr-1 text-muted" />}
                                <Folder className={`w-4 h-4 shrink-0 transition-colors ${isExpanded ? 'text-primary' : 'text-primary/70'}`} />
                            </div>
                        ) : (
                            <div className="flex items-center ml-4.5">
                                {isZip ? <FileArchive className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-orange-400' : 'text-orange-500/70'}`} /> :
                                    <File className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted'}`} />}
                            </div>
                        )}
                        <span className={`truncate text-xs ${isSelected ? 'font-semibold' : 'font-medium'}`}>{node.name}</span>
                    </div>

                    <div className="hidden group-hover:flex items-center gap-0.5 ml-2">
                        {isZip && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleUnzip(node.path); }}
                                className="p-1 hover:bg-orange-500/20 rounded-lg text-orange-500 transition-all"
                                title="Unzip"
                            >
                                <ArchiveRestore className="w-3 h-3" />
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); fileApi.download(sessionId, node.path); }}
                            className="p-1 hover:bg-[hsl(var(--primary)/0.15)] rounded-lg text-muted hover:text-primary transition-all"
                            title="Download"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                        {node.type === 'folder' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onCreateFile?.(node.path); }}
                                className="p-1 hover:bg-[hsl(var(--primary)/0.15)] rounded-lg text-muted hover:text-primary transition-all"
                                title="New File"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); onRename?.(node.path); }}
                            className="p-1 hover:bg-[hsl(var(--primary)/0.15)] rounded-lg text-muted hover:text-primary transition-all"
                            title="Rename"
                        >
                            <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete?.(node.path); }}
                            className="p-1 hover:bg-red-500/20 rounded-lg text-muted hover:text-danger transition-all"
                            title="Delete"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                {node.type === 'folder' && isExpanded && node.children.map(child => renderNode(child, level + 1))}
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--surface-sunk))]">
                <span className="text-[10px] uppercase font-bold text-muted tracking-[0.2em]">Project Files</span>
                <div className="flex gap-1">
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="p-1.5 hover:bg-[hsl(var(--surface-sunk))] rounded-lg text-muted hover:text-primary transition-all"
                        title="Upload Files"
                    >
                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={() => fileApi.downloadAll(sessionId)}
                        className="p-1.5 hover:bg-[hsl(var(--surface-sunk))] rounded-lg text-muted hover:text-success transition-all"
                        title="Download Project ZIP"
                    >
                        <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onCreateFile?.()}
                        className="p-1.5 hover:bg-[hsl(var(--surface-sunk))] rounded-lg text-muted hover:text-primary transition-all"
                        title="New File"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onCreateFolder?.()}
                        className="p-1.5 hover:bg-[hsl(var(--surface-sunk))] rounded-lg text-muted hover:text-primary transition-all"
                        title="New Folder"
                    >
                        <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-1 py-3 custom-scrollbar">
                {treeData.children.length > 0 ? (
                    treeData.children.map(node => renderNode(node))
                ) : (
                    <div className="text-[10px] text-faint px-6 py-10 text-center border border-dashed border-[hsl(var(--surface-sunk))] rounded-2xl mt-4 mx-3 bg-[hsl(var(--surface-sunk))/0.5]">
                        <div className="mb-2 opacity-50">
                            <Plus className="w-6 h-6 mx-auto mb-2" />
                        </div>
                        Describe your project to start generating files.
                    </div>
                )}
            </div>
        </div>
    );
};
