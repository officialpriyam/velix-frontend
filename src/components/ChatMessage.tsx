import React, { useState } from 'react';
import { Bot, Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileCode, FileText, Globe, Loader2, Sparkles, TerminalSquare, Download, AlertCircle } from 'lucide-react';

export interface QuestionItem { id: string; question: string; options: string[]; }
export interface PlanData { title: string; summary: string; components?: { name: string; desc: string }[]; designDirection?: string[]; }
export interface ChatMetadata { plan?: PlanData; questions?: QuestionItem[]; answers?: Record<string, string>; status?: string; files?: { path: string; size?: number }[]; created?: string[]; edited?: string[]; search?: { queries: string[]; sources: { title: string; url: string }[] }; docs?: string[]; commands?: { command: string; status: string; output?: string }[]; downloads?: { url: string; path: string; success: boolean }[]; event?: string; }

interface Props {
  id?: number; role: 'user' | 'assistant'; content: string; created_at?: string; messageType?: string;
  metadata?: ChatMetadata; attachments?: { name: string; type: string; size: number }[];
  onSavePlan?: (id: number, answers: Record<string, string>) => void; onApprovePlan?: (id: number) => void; onOpenPlan?: (id: number) => void;
  onOpenFile?: (path: string) => void;
}

const MAX_CHARS = 400;

function TruncatedContent({ text, className }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > MAX_CHARS;
  const display = isLong && !expanded ? text.slice(0, MAX_CHARS) + '…' : text;
  return <div>
    <p className={`whitespace-pre-wrap text-[12px] leading-5 ${className || 'text-zinc-300'}`}>{display}</p>
    {isLong && <button onClick={() => setExpanded(!expanded)} className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors">{expanded ? <><ChevronUp className="h-3.5 w-3.5" />Show less</> : <><ChevronDown className="h-3.5 w-3.5" />Show more</>}</button>}
  </div>;
}

const boxBase = 'mt-3 overflow-hidden rounded-lg border border-white/[.09] bg-[#10151b]';
const boxHeader = 'flex items-center gap-2 border-b border-white/[.06] px-3 py-2';
const boxTitle = 'text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-300';

export function FilesChangedBox({ files, created, edited, onOpenFile }: { files?: { path: string; size?: number }[]; created?: string[]; edited?: string[]; onOpenFile?: (path: string) => void }) {
  const createdPaths = created && created.length > 0 ? created : (files || []).map(f => f.path);
  const editedPaths = edited || [];
  const chip = (p: string, color: string) => <button key={p} type="button" onClick={() => onOpenFile?.(p)} title={p} className="flex max-w-[260px] items-center gap-1 rounded border border-white/[.06] bg-white/[.025] px-1.5 py-1 text-[10px] text-zinc-400 transition-colors hover:border-sky-400/40 hover:bg-sky-400/[.06]"><FileCode className="h-3 w-3 shrink-0" /><span className={`truncate ${color}`}>{p}</span></button>;
  const list = (paths: string[], color: string) => paths.length > 0 && <div className="flex flex-wrap gap-1">{paths.slice(0, 20).map(p => chip(p, color))}</div>;
  if (!files?.length && !createdPaths.length && !editedPaths.length) return null;
  return <div className={boxBase}>
    <div className={boxHeader}><FileCode className="h-3.5 w-3.5 text-emerald-400" /><span className={boxTitle}>Files changed</span><span className="text-[10px] text-zinc-500">{(createdPaths.length + editedPaths.length)} file{(createdPaths.length + editedPaths.length) === 1 ? '' : 's'}</span></div>
    <div className="space-y-2 px-3 py-2">
      {createdPaths.length > 0 && <div><div className="mb-1 text-[9px] font-semibold uppercase tracking-[.12em] text-emerald-500/70">Created</div>{list(createdPaths, 'text-emerald-300')}</div>}
      {editedPaths.length > 0 && <div><div className="mb-1 text-[9px] font-semibold uppercase tracking-[.12em] text-amber-500/70">Edited</div>{list(editedPaths, 'text-amber-300')}</div>}
    </div>
  </div>;
}

export function SearchBox({ search }: { search?: { queries: string[]; sources: { title: string; url: string }[] } }) {
  if (!search?.queries?.length) return null;
  return <div className={boxBase}>
    <div className={boxHeader}><Globe className="h-3.5 w-3.5 text-sky-400" /><span className={boxTitle}>Web search</span></div>
    <div className="space-y-1.5 px-3 py-2">
      {search.queries.map((q, i) => <div key={i} className="text-[11px] text-zinc-300">Searched the web for <span className="text-sky-300">{q}</span></div>)}
      {search.sources?.length > 0 && <div className="flex flex-wrap gap-1">{search.sources.slice(0, 5).map((s, i) => <a key={i} href={s.url} target="_blank" rel="noreferrer" className="max-w-[200px] truncate rounded border border-sky-400/15 bg-sky-400/[.06] px-1.5 py-1 text-[9px] text-sky-200 hover:bg-sky-400/10">{s.title}</a>)}</div>}
    </div>
  </div>;
}

export function DocsBox({ docs }: { docs?: string[] }) {
  if (!docs?.length) return null;
  return <div className={boxBase}>
    <div className={boxHeader}><FileText className="h-3.5 w-3.5 text-amber-400" /><span className={boxTitle}>Read docs</span></div>
    <div className="flex flex-wrap gap-1 px-3 py-2">{docs.slice(0, 20).map((doc, i) => <span key={i} className="max-w-[200px] truncate rounded border border-amber-400/15 bg-amber-400/[.06] px-1.5 py-1 text-[9px] text-amber-200">{doc}</span>)}</div>
  </div>;
}

export function CommandsBox({ commands }: { commands?: { command: string; status: string; output?: string }[] }) {
  if (!commands?.length) return null;
  return <div className={boxBase}>
    <div className={boxHeader}><TerminalSquare className="h-3.5 w-3.5 text-violet-400" /><span className={boxTitle}>Commands run</span></div>
    <div className="space-y-1.5 px-3 py-2">{commands.map((cmd, i) => <div key={i} className="rounded border border-white/[.06] bg-black/20 px-2 py-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-300">{cmd.status === 'done' ? <Check className="h-3 w-3 shrink-0 text-emerald-400" /> : <AlertCircle className="h-3 w-3 shrink-0 text-red-400" />}{cmd.command}</div>
      {cmd.output && <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap break-all text-[9px] font-mono text-zinc-500">{cmd.output}</pre>}
    </div>)}</div>
  </div>;
}

export function DownloadsBox({ downloads }: { downloads?: { url: string; path: string; success: boolean }[] }) {
  if (!downloads?.length) return null;
  return <div className={boxBase}>
    <div className={boxHeader}><Download className="h-3.5 w-3.5 text-sky-400" /><span className={boxTitle}>Downloads</span></div>
    <div className="space-y-1.5 px-3 py-2">{downloads.map((dl, i) => <div key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-300">{dl.success ? <Check className="h-3 w-3 shrink-0 text-emerald-400" /> : <AlertCircle className="h-3 w-3 shrink-0 text-red-400" />}<span className="truncate">{dl.path || dl.url}</span></div>)}</div>
  </div>;
}

export function ChatMessage({ id, role, content, created_at, messageType = 'message', metadata = {}, attachments, onSavePlan, onApprovePlan, onOpenPlan, onOpenFile }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(metadata.answers || {});
  const [custom, setCustom] = useState<Record<string, string>>({});
  const question = metadata.questions?.[index];
  const status = metadata.status || 'awaiting_answers';

  if (messageType === 'timeline') return null;
  if (role === 'user') return <div className="my-4 flex items-start gap-2.5 px-5 animate-in fade-in slide-in-from-bottom-1 duration-200">
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-700 text-[9px] font-bold text-zinc-200">YOU</div>
    <div className="min-w-0 pt-0.5 text-[12px] leading-5 text-zinc-200"><TruncatedContent text={content} className="text-zinc-200" />
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
      <TruncatedContent text={content} />
      {messageType === 'build' && <>
        <FilesChangedBox files={metadata.files} created={metadata.created} edited={metadata.edited} onOpenFile={onOpenFile} />
        <SearchBox search={metadata.search} />
        <DocsBox docs={metadata.docs} />
        <CommandsBox commands={metadata.commands} />
        <DownloadsBox downloads={metadata.downloads} />
      </>}

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
