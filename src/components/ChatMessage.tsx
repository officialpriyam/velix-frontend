import React from 'react';
import { User, Bot, Image, FileCode } from 'lucide-react';

interface Attachment {
  name: string;
  type: string;
  size: number;
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

// Simple size formatter
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, attachments }) => {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''} items-start animate-in fade-in duration-200`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-primary/20' : 'bg-surface/20'}`}>
        {isUser ? <User className="w-4 h-4 text-foreground" /> : <Bot className="w-4 h-4 text-primary" />}
      </div>
      <div className={`max-w-[80%] rounded-xl p-3 text-sm leading-relaxed ${isUser ? 'bg-primary/10 text-foreground' : 'bg-surface/10 text-foreground/90'} shadow-lg backdrop-blur-md`}>
        <p className="whitespace-pre-wrap">{content}</p>
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-muted">
                {att.type.startsWith('image/') ? <Image className="w-2.5 h-2.5" /> : <FileCode className="w-2.5 h-2.5" />}
                <span>{att.name}</span>
                <span className="text-foreground/30">{formatFileSize(att.size)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
