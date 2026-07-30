import React, { useState } from 'react';
import { Bot, Check, ChevronLeft, ChevronRight, FileCode, FileText, Image, Loader2 } from 'lucide-react';

export interface QuestionItem { id: string; question: string; options: string[]; }
export interface PlanData { title: string; summary: string; components?: { name: string; desc: string }[]; designDirection?: string[]; }
export interface ChatMetadata {
  plan?: PlanData; questions?: QuestionItem[]; answers?: Record<string, string>; status?: string;
  files?: { path: string; size?: number }[]; event?: string;
}

interface Props {
  id?: number; role: 'user' | 'assistant'; content: string; created_at?: string; messageType?: string;
  metadata?: ChatMetadata; attachments?: { name: string; type: string; size: number }[];
  onSavePlan?: (id: number, answers: Record<string, string>) => void; onApprovePlan?: (id: number) => void;
  onOpenPlan?: (id: number) => void;
}

export function ChatMessage({ id, role, content, created_at, messageType = 'message', metadata = {}, attachments, onSavePlan, onApprovePlan, onOpenPlan }: Props) {
  const isUser = role === 'user';
  const questions = metadata.questions || [];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(metadata.answers || {});
  const [custom, setCustom] = useState<Record<string, string>>({});
  const question = questions[index];
  const status = metadata.status || 'awaiting_answers';
  const save = (next = answers) => id && onSavePlan?.(id, next);

  if (messageType === 'timeline') return null;
  if (isUser) return <div className="flex flex-col items-end my-3 animate-in fade-in duration-200">
    {created_at && <span className="mb-1 text-[10px] text-zinc-500">{new Date(created_at).toLocaleString()}</span>}
    <div className="max-w-[85%] rounded-3xl border border-white/10 bg-[#29292e] px-4 py-2.5 text-xs font-medium leading-relaxed text-zinc-100"><p className="whitespace-pre-wrap">{content}</p>
      {attachments?.length ? <div className="mt-2 flex flex-wrap gap-1">{attachments.map((a, i) => <span key={i} className="rounded-full bg-white/10 px-2 py-1 text-[10px]">{a.name}</span>)}</div> : null}
    </div>
  </div>;

  const select = (value: string) => {
    if (!question) return;
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
  };

  return <div className="my-3 flex gap-3 animate-in fade-in duration-200">
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/10"><Bot className="h-4 w-4 text-indigo-300" /></div>
    <div className="min-w-0 max-w-[90%] space-y-3">
      <div className="rounded-2xl border border-white/10 bg-[#1d1d21] p-4 text-xs leading-relaxed text-zinc-300 shadow-xl">
        {messageType === 'build' && <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300"><Check className="h-3.5 w-3.5" /> Build complete</div>}
        {messageType === 'plan' && <button onClick={() => id && onOpenPlan?.(id)} className="mb-2 flex w-full items-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500/5 p-2.5 text-left hover:bg-indigo-500/10"><FileText className="h-4 w-4 text-indigo-300" /><span><b className="text-zinc-100">Plan: </b>{metadata.plan?.title || 'Project plan'}</span></button>}
        <p className="whitespace-pre-wrap">{content}</p>
        {metadata.files?.length ? <div className="mt-3 flex flex-wrap gap-1">{metadata.files.slice(0, 8).map((f, i) => <span key={i} className="flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-1 text-[10px] text-zinc-400"><FileCode className="h-3 w-3" />{f.path}</span>)}</div> : null}
      </div>

      {messageType === 'plan' && question && status === 'awaiting_answers' && <div className="rounded-2xl border border-white/10 bg-[#242429] p-4 shadow-xl">
        <p className="mb-3 text-sm font-semibold text-zinc-100">{question.question}</p>
        <div className="space-y-2">{question.options.map((option, i) => {
          const own = option.toLowerCase().startsWith('write your own'); const selected = answers[question.id] === option || (own && answers[question.id]?.startsWith('custom:'));
          return <div key={i}><button onClick={() => select(own ? `custom:${custom[question.id] || ''}` : option)} className={`flex w-full items-start gap-2 rounded-xl border p-2.5 text-left ${selected ? 'border-blue-400/70 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}><span className={`mt-0.5 h-3.5 w-3.5 rounded-full border ${selected ? 'border-blue-400 bg-blue-400' : 'border-zinc-500'}`} /><span className="text-xs">{option}</span></button>
            {own && selected && <input value={custom[question.id] || ''} onChange={e => { const next = { ...custom, [question.id]: e.target.value }; setCustom(next); select(`custom:${e.target.value}`); }} placeholder="Write your requirements…" className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs outline-none" />}</div>;
        })}</div>
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3"><div className="flex gap-1"><button disabled={!index} onClick={() => setIndex(index - 1)} className="p-1 text-zinc-400 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><span className="py-1 text-[10px] text-zinc-500">{index + 1}/{questions.length}</span><button disabled={index === questions.length - 1} onClick={() => setIndex(index + 1)} className="p-1 text-zinc-400 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div>
          <div className="flex gap-2"><button onClick={() => save({})} className="text-xs text-zinc-400">Skip all</button><button onClick={() => index < questions.length - 1 ? setIndex(index + 1) : save()} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">{index < questions.length - 1 ? 'Next' : 'Review plan'}</button></div></div>
      </div>}
      {messageType === 'plan' && status === 'awaiting_approval' && <button onClick={() => id && onApprovePlan?.(id)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"><Check className="h-3.5 w-3.5" />Approve & build</button>}
      {messageType === 'plan' && status === 'approved' && <div className="flex items-center gap-2 text-xs text-indigo-300"><Loader2 className="h-3.5 w-3.5 animate-spin" />Building approved plan…</div>}
    </div>
  </div>;
}
