import React, { useState } from 'react';
import { Bot, Check, ChevronLeft, ChevronRight, FileCode, FileText, Loader2, Sparkles } from 'lucide-react';

export interface QuestionItem { id: string; question: string; options: string[]; }
export interface PlanData { title: string; summary: string; components?: { name: string; desc: string }[]; designDirection?: string[]; }
export interface ChatMetadata { plan?: PlanData; questions?: QuestionItem[]; answers?: Record<string, string>; status?: string; files?: { path: string; size?: number }[]; event?: string; }

interface Props {
  id?: number; role: 'user' | 'assistant'; content: string; created_at?: string; messageType?: string;
  metadata?: ChatMetadata; attachments?: { name: string; type: string; size: number }[];
  onSavePlan?: (id: number, answers: Record<string, string>) => void; onApprovePlan?: (id: number) => void; onOpenPlan?: (id: number) => void;
}

export function ChatMessage({ id, role, content, created_at, messageType = 'message', metadata = {}, attachments, onSavePlan, onApprovePlan, onOpenPlan }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(metadata.answers || {});
  const [custom, setCustom] = useState<Record<string, string>>({});
  const question = metadata.questions?.[index];
  const status = metadata.status || 'awaiting_answers';

  if (messageType === 'timeline') return null;
  if (role === 'user') return <div className="my-4 flex items-start gap-2.5 px-5 animate-in fade-in slide-in-from-bottom-1 duration-200">
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-700 text-[9px] font-bold text-zinc-200">YOU</div>
    <div className="min-w-0 pt-0.5 text-[12px] leading-5 text-zinc-200"><p className="whitespace-pre-wrap">{content}</p>
      {attachments?.length ? <div className="mt-2 flex flex-wrap gap-1">{attachments.map((file, i) => <span key={i} className="rounded border border-white/10 bg-white/[.03] px-2 py-1 text-[10px] text-zinc-400">{file.name}</span>)}</div> : null}
    </div>
  </div>;

  const select = (value: string) => question && setAnswers(prev => ({ ...prev, [question.id]: value }));
  const save = () => id && onSavePlan?.(id, answers);
  return <div className="my-4 flex gap-2.5 px-5 animate-in fade-in slide-in-from-bottom-1 duration-200">
    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-sky-400/20 bg-sky-400/10"><Sparkles className="h-3.5 w-3.5 text-sky-300" /></div>
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold text-zinc-400">Velix <span className="font-normal text-zinc-600">{created_at ? new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}</span></div>
      {messageType === 'build' && <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400"><Check className="h-3.5 w-3.5" />Generation complete</div>}
      {messageType === 'plan' && <button onClick={() => id && onOpenPlan?.(id)} className="mb-2 flex items-center gap-1.5 text-left text-[11px] text-sky-300 hover:text-sky-200"><FileText className="h-3.5 w-3.5" />Open plan.md — {metadata.plan?.title || 'Project plan'}</button>}
      <p className="whitespace-pre-wrap text-[12px] leading-5 text-zinc-300">{content}</p>
      {metadata.files?.length ? <div className="mt-3 flex flex-wrap gap-1">{metadata.files.slice(0, 8).map((file, i) => <span key={i} className="flex items-center gap-1 rounded border border-white/[.06] bg-white/[.025] px-1.5 py-1 text-[10px] text-zinc-400"><FileCode className="h-3 w-3" />{file.path}</span>)}</div> : null}

      {messageType === 'plan' && question && status === 'awaiting_answers' && <div className="mt-3 rounded-lg border border-white/10 bg-[#11161d] p-3">
        <p className="mb-2 text-xs font-semibold text-zinc-100">{question.question}</p>
        <div className="space-y-1.5">{question.options.map((option, i) => { const own = option.toLowerCase().startsWith('write your own'); const selected = answers[question.id] === option || (own && answers[question.id]?.startsWith('custom:')); return <div key={i}><button onClick={() => select(own ? `custom:${custom[question.id] || ''}` : option)} className={`flex w-full gap-2 rounded border p-2 text-left text-[11px] ${selected ? 'border-sky-400/50 bg-sky-400/10 text-zinc-100' : 'border-white/[.07] text-zinc-400 hover:bg-white/[.03]'}`}><span className={`mt-0.5 h-3 w-3 rounded-full border ${selected ? 'border-sky-400 bg-sky-400' : 'border-zinc-600'}`} />{option}</button>{own && selected && <input value={custom[question.id] || ''} onChange={e => { setCustom(prev => ({ ...prev, [question.id]: e.target.value })); select(`custom:${e.target.value}`); }} className="mt-1.5 w-full rounded border border-white/10 bg-black/20 px-2 py-1.5 text-xs outline-none" placeholder="Write your requirements..." />}</div>; })}</div>
        <div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-1 text-[10px] text-zinc-500"><button disabled={!index} onClick={() => setIndex(index - 1)}><ChevronLeft className="h-4 w-4" /></button>{index + 1}/{metadata.questions?.length}<button disabled={index === (metadata.questions?.length || 1) - 1} onClick={() => setIndex(index + 1)}><ChevronRight className="h-4 w-4" /></button></div><button onClick={save} className="rounded bg-sky-500 px-2.5 py-1.5 text-[10px] font-semibold text-black">{index < (metadata.questions?.length || 1) - 1 ? 'Save answers' : 'Review plan'}</button></div>
      </div>}
      {messageType === 'plan' && status === 'awaiting_approval' && <button onClick={() => id && onApprovePlan?.(id)} className="mt-3 flex items-center gap-1.5 rounded bg-sky-500 px-3 py-1.5 text-[11px] font-bold text-black"><Check className="h-3.5 w-3.5" />Approve & build</button>}
      {messageType === 'plan' && status === 'approved' && <span className="mt-3 flex items-center gap-1.5 text-[11px] text-sky-300"><Loader2 className="h-3.5 w-3.5 animate-spin" />Building approved plan...</span>}
    </div>
  </div>;
}
