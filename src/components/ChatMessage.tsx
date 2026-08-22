import React, { useState } from 'react';
import { Bot, Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileCode, FileText, Globe, Loader2, Sparkles, TerminalSquare, Download, AlertCircle, Clock, FileEdit } from 'lucide-react';

export interface QuestionItem { id: string; question: string; options: string[]; }
export interface PlanData { title: string; summary: string; components?: { name: string; desc: string }[]; designDirection?: string[]; }
export interface ChatMetadata { plan?: PlanData; questions?: QuestionItem[]; answers?: Record<string, string>; status?: string; files?: { path: string; size?: number }[]; created?: string[]; edited?: string[]; search?: { queries: string[]; sources: { title: string; url: string }[] }; docs?: string[]; commands?: { command: string; status: string; output?: string }[]; downloads?: { url: string; path: string; success: boolean }[]; event?: string; stepsCount?: number; elapsed?: number; }

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
    <p className={`whitespace-pre-wrap text-[13px] leading-relaxed ${className || 'text-zinc-300'}`}>{display}</p>
    {isLong && <button onClick={() => setExpanded(!expanded)} className="mt-2 flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors">{expanded ? <><ChevronUp className="h-3.5 w-3.5" />Show less</> : <><ChevronDown className="h-3.5 w-3.5" />Show more</>}</button>}
  </div>;
}

function CollapsibleSection({ title, icon: Icon, count, defaultOpen = false, children }: { title: string; icon: any; count?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return <div className="my-1.5 overflow-hidden rounded-lg border border-white/[.06] bg-[#161b22]">
    <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-white/[.02] transition-colors">
      <Icon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
      <span className="text-[11px] font-semibold text-zinc-300">{title}</span>
      {count && <span className="text-[10px] text-zinc-500">{count}</span>}
      <ChevronDown className={`h-3 w-3 text-zinc-500 ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="border-t border-white/[.04] px-3 py-2">{children}</div>}
  </div>;
}

const boxBase = 'my-1.5 overflow-hidden rounded-lg border border-white/[.06] bg-[#161b22]';
const boxHeader = 'flex items-center gap-2 border-b border-white/[.04] px-3 py-2';
const boxTitle = 'text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400';

export function FilesChangedBox({ files, created, edited, onOpenFile }: { files?: { path: string; size?: number }[]; created?: string[]; edited?: string[]; onOpenFile?: (path: string) => void }) {
  const createdPaths = created && created.length > 0 ? created : (files || []).map(f => f.path);
  const editedPaths = edited || [];
  const totalCount = createdPaths.length + editedPaths.length;
  if (!totalCount) return null;
  return <CollapsibleSection title="Files changed" icon={FileCode} count={`${totalCount} file${totalCount === 1 ? '' : 's'}`} defaultOpen={totalCount <= 5}>
    <div className="space-y-1">
      {createdPaths.map(p => <button key={`c-${p}`} type="button" onClick={() => onOpenFile?.(p)} title={p} className="flex w-full items-center gap-2 rounded-md border border-white/[.04] bg-white/[.02] px-2.5 py-1.5 text-[11px] transition-colors hover:border-emerald-400/30 hover:bg-emerald-400/[.04]">
        <FileCode className="h-3 w-3 shrink-0 text-emerald-400" />
        <span className="text-zinc-300 truncate font-mono">{p}</span>
        <span className="ml-auto text-[9px] font-bold uppercase text-emerald-400/70 shrink-0">CREATED</span>
        <Check className="h-3 w-3 shrink-0 text-emerald-400" />
      </button>)}
      {editedPaths.map(p => <button key={`e-${p}`} type="button" onClick={() => onOpenFile?.(p)} title={p} className="flex w-full items-center gap-2 rounded-md border border-white/[.04] bg-white/[.02] px-2.5 py-1.5 text-[11px] transition-colors hover:border-amber-400/30 hover:bg-amber-400/[.04]">
        <FileEdit className="h-3 w-3 shrink-0 text-amber-400" />
        <span className="text-zinc-300 truncate font-mono">{p}</span>
        <span className="ml-auto text-[9px] font-bold uppercase text-amber-400/70 shrink-0">EDITED</span>
        <Check className="h-3 w-3 shrink-0 text-emerald-400" />
      </button>)}
    </div>
  </CollapsibleSection>;
}

export function SearchBox({ search }: { search?: { queries: string[]; sources: { title: string; url: string }[] } }) {
  if (!search?.queries?.length) return null;
  return <CollapsibleSection title="Web search" icon={Globe} count={`${search.sources?.length || 0} sources`}>
    <div className="space-y-1.5">
      {search.queries.map((q, i) => <div key={i} className="text-[11px] text-zinc-300">Searched for <span className="text-sky-300 font-medium">{q}</span></div>)}
      {search.sources?.length > 0 && <div className="flex flex-wrap gap-1">{search.sources.slice(0, 5).map((s, i) => <a key={i} href={s.url} target="_blank" rel="noreferrer" className="max-w-[200px] truncate rounded border border-sky-400/15 bg-sky-400/[.06] px-1.5 py-1 text-[9px] text-sky-200 hover:bg-sky-400/10">{s.title}</a>)}</div>}
    </div>
  </CollapsibleSection>;
}

export function DocsBox({ docs, checked }: { docs?: string[]; checked?: boolean }) {
  if (!docs?.length && !checked) return null;
  return <CollapsibleSection title="Read docs" icon={FileText} count={docs?.length ? `${docs.length} doc${docs.length === 1 ? '' : 's'}` : undefined}>
    {docs?.length ? <div className="flex flex-wrap gap-1">{docs.slice(0, 20).map((doc, i) => <span key={i} className="max-w-[200px] truncate rounded border border-amber-400/15 bg-amber-400/[.06] px-1.5 py-1 text-[9px] text-amber-200">{doc}</span>)}</div> : <div className="text-[11px] text-zinc-400">Checked documentation — no relevant docs matched this request.</div>}
  </CollapsibleSection>;
}

export function CommandsBox({ commands }: { commands?: { command: string; status: string; output?: string }[] }) {
  if (!commands?.length) return null;
  return <CollapsibleSection title="Commands run" icon={TerminalSquare} count={`${commands.length} command${commands.length === 1 ? '' : 's'}`}>
    <div className="space-y-1">{commands.map((cmd, i) => <div key={i} className="rounded border border-white/[.04] bg-black/20 px-2.5 py-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-300">{cmd.status === 'done' ? <Check className="h-3 w-3 shrink-0 text-emerald-400" /> : <AlertCircle className="h-3 w-3 shrink-0 text-red-400" />}{cmd.command}</div>
      {cmd.output && <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap break-all text-[9px] font-mono text-zinc-500">{cmd.output}</pre>}
    </div>)}</div>
  </CollapsibleSection>;
}

export function DownloadsBox({ downloads }: { downloads?: { url: string; path: string; success: boolean }[] }) {
  if (!downloads?.length) return null;
  return <CollapsibleSection title="Downloads" icon={Download} count={`${downloads.length} file${downloads.length === 1 ? '' : 's'}`}>
    <div className="space-y-1">{downloads.map((dl, i) => <div key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-300">{dl.success ? <Check className="h-3 w-3 shrink-0 text-emerald-400" /> : <AlertCircle className="h-3 w-3 shrink-0 text-red-400" />}<span className="truncate">{dl.path || dl.url}</span></div>)}</div>
  </CollapsibleSection>;
}

export function ChatMessage({ id, role, content, created_at, messageType = 'message', metadata = {}, attachments, onSavePlan, onApprovePlan, onOpenPlan, onOpenFile }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(metadata.answers || {});
  const [custom, setCustom] = useState<Record<string, string>>({});
  const question = metadata.questions?.[index];
  const status = metadata.status || 'awaiting_answers';

  if (messageType === 'timeline') return null;

  if (role === 'user') return <div className="my-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
    <div className="flex items-center gap-2.5 px-5 py-2 bg-[#161b22] rounded-xl border border-white/[.06]">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-700 text-[9px] font-bold text-zinc-200">YOU</div>
      <div className="min-w-0 flex-1 pt-0.5 text-[12px] leading-5 text-zinc-200"><TruncatedContent text={content} className="text-zinc-200" />
        {attachments?.length ? <div className="mt-2 flex flex-wrap gap-1">{attachments.map((file, i) => <span key={i} className="rounded border border-white/10 bg-white/[.03] px-2 py-1 text-[10px] text-zinc-400">{file.name}</span>)}</div> : null}
      </div>
    </div>
  </div>;

  const select = (value: string) => {
    if (!question) return;
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  };
  const save = () => {
    if (!id) return;
    requestAnimationFrame(() => { onSavePlan?.(id, answers); });
  };
  const goNext = () => {
    if (index < (metadata.questions?.length || 1) - 1) setIndex(index + 1);
  };
  const goPrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  const stepsCount = metadata.stepsCount || 0;
  const hasFiles = (metadata.files && metadata.files.length > 0) || (metadata.created && metadata.created.length > 0) || (metadata.edited && metadata.edited.length > 0);

  return <div className="my-3 animate-in fade-in slide-in-from-bottom-1 duration-200 px-5">
    {/* "Worked X steps" collapsible — shown for build messages */}
    {messageType === 'build' && stepsCount > 0 && <CollapsibleSection title={`Worked ${stepsCount} step${stepsCount === 1 ? '' : 's'}`} icon={Clock} defaultOpen={false}>
      <div className="text-[11px] text-zinc-400">The agent completed {stepsCount} steps to generate your code.</div>
    </CollapsibleSection>}

    {/* Main response content */}
    <div className="my-1">
      <TruncatedContent text={content} />
    </div>

    {/* Reasoning section — show for non-build, non-plan messages with substantial content */}
    {messageType === 'message' && content.length > 100 && !metadata.search && <CollapsibleSection title="Reasoning" icon={Sparkles} defaultOpen={false}>
      <div className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap">{content}</div>
    </CollapsibleSection>}

    {/* Build metadata sections */}
    {messageType === 'build' && <>
      <FilesChangedBox files={metadata.files} created={metadata.created} edited={metadata.edited} onOpenFile={onOpenFile} />
      <SearchBox search={metadata.search} />
      <DocsBox docs={metadata.docs} />
      <CommandsBox commands={metadata.commands} />
      <DownloadsBox downloads={metadata.downloads} />
    </>}
    {messageType !== 'build' && <SearchBox search={metadata.search} />}

    {/* Plan message */}
    {messageType === 'plan' && <>
      <CollapsibleSection title={metadata.plan?.title || 'Project plan'} icon={FileText} defaultOpen={true}>
        <div className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{content}</div>
        <button onClick={() => id && onOpenPlan?.(id)} className="mt-2 flex items-center gap-1.5 text-[11px] text-sky-300 hover:text-sky-200 transition-colors">
          <FileText className="h-3.5 w-3.5" />Open plan.md
        </button>
      </CollapsibleSection>

      {question && status === 'awaiting_answers' && <div className="my-2 rounded-xl border border-white/[.08] bg-[#161b22] p-3.5">
        <p className="mb-2.5 text-[12px] font-semibold text-zinc-100">{question.question}</p>
        <div className="space-y-1.5">{question.options.map((option, i) => { const own = option.toLowerCase().startsWith('write your own'); const selected = answers[question.id] === option || (own && answers[question.id]?.startsWith('custom:')); return <div key={i}><button onClick={() => select(own ? `custom:${custom[question.id] || ''}` : option)} className={`flex w-full gap-2 rounded-lg border p-2.5 text-left text-[11px] transition-all duration-75 ${selected ? 'border-sky-400/50 bg-sky-400/10 text-zinc-100' : 'border-white/[.06] text-zinc-400 hover:bg-white/[.03]'}`}><span className={`mt-0.5 h-3.5 w-3.5 rounded-full border-2 transition-all duration-75 shrink-0 ${selected ? 'border-sky-400 bg-sky-400' : 'border-zinc-600'}`} />{option}</button>{own && selected && <input value={custom[question.id] || ''} onChange={e => { setCustom(prev => ({ ...prev, [question.id]: e.target.value })); select(`custom:${e.target.value}`); }} className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 text-xs outline-none focus:border-sky-400/50" placeholder="Write your requirements..." />}</div>; })}</div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
            <button disabled={!index} onClick={goPrev} className="p-1 hover:bg-white/5 rounded transition-colors"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-1">{index + 1}/{metadata.questions?.length}</span>
            <button disabled={index === (metadata.questions?.length || 1) - 1} onClick={goNext} className="p-1 hover:bg-white/5 rounded transition-colors"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <button onClick={save} className="rounded-lg bg-sky-500 px-3 py-1.5 text-[10px] font-semibold text-black hover:bg-sky-400 transition-colors">{index < (metadata.questions?.length || 1) - 1 ? 'Save answers' : 'Review plan'}</button>
        </div>
      </div>}

      {status === 'awaiting_approval' && <button onClick={() => id && onApprovePlan?.(id)} className="mt-2 flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-[11px] font-bold text-black hover:bg-sky-400 transition-colors"><Check className="h-3.5 w-3.5" />Approve & build</button>}
      {status === 'approved' && <span className="mt-2 flex items-center gap-1.5 text-[11px] text-sky-300"><Loader2 className="h-3.5 w-3.5 animate-spin" />Building approved plan...</span>}
    </>}
  </div>;
}
