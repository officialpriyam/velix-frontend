"use client";

import React from 'react';
import { Save, X } from 'lucide-react';

interface EditorProps {
    file: string | null;
    content: string;
    onChange: (content: string) => void;
    onSelectionChange?: (selectedText: string) => void;
    onSave?: () => void;
    onClose?: () => void;
}

export const Editor = ({ file, content, onChange, onSelectionChange, onSave, onClose }: EditorProps) => {
    if (!file) {
        return (
            <div className="flex-1 flex items-center justify-center text-faint font-medium italic text-sm">
                Select a file to edit
            </div>
        );
    }

    const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;
        const selectedText = textarea.value.substring(
            textarea.selectionStart,
            textarea.selectionEnd
        );
        if (onSelectionChange) {
            onSelectionChange(selectedText);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="px-4 py-2 border-b border-[hsl(var(--surface-sunk))] bg-surface flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider shrink-0">Editing:</span>
                    <span className="text-xs text-primary font-mono truncate">{file}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {onSave && (
                        <button
                            onClick={onSave}
                            className="p-1.5 hover:bg-[hsl(var(--surface-sunk))] rounded-lg text-muted hover:text-success transition-all flex items-center gap-1.5"
                            title="Save File"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Save</span>
                        </button>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-[hsl(var(--surface-sunk))] rounded-lg text-muted hover:text-danger transition-all"
                            title="Close tab"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
            <textarea
                value={content}
                onChange={(e) => onChange(e.target.value)}
                onSelect={handleSelect}
                className="flex-1 w-full min-h-0 p-6 text-sm font-mono text-foreground bg-[hsl(var(--surface-sunk))] border border-[hsl(var(--surface-sunk))] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none spellcheck-false leading-relaxed overflow-auto"
                spellCheck={false}
            />
        </div>
    );
};
