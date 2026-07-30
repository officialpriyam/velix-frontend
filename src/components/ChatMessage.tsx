import React, { useState } from 'react';
import { User, Bot, Image, FileCode, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface Attachment {
  name: string;
  type: string;
  size: number;
}

export interface QuestionItem {
  id: string;
  question: string;
  options: string[];
}

export interface PlanData {
  title: string;
  summary: string;
  components?: { name: string; desc: string }[];
  designDirection?: string[];
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  attachments?: Attachment[];
  workingStatus?: string;
  planData?: PlanData;
  questions?: QuestionItem[];
  onSelectOption?: (questionId: string, option: string) => void;
  onPlanSubmit?: (answers: Record<string, string>) => void;
  onOpenPlan?: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  created_at,
  attachments,
  workingStatus,
  planData,
  questions,
  onSelectOption,
  onPlanSubmit,
  onOpenPlan
}) => {
  const isUser = role === 'user';
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customText, setCustomText] = useState<Record<string, string>>({});

  const handleOptionClick = (qId: string, option: string) => {
    const newAnswers = { ...answers, [qId]: option };
    setAnswers(newAnswers);
    if (onSelectOption) onSelectOption(qId, option);
  };

  const currentQ = questions && questions.length > 0 ? questions[currentQIndex] : null;

  if (isUser) {
    return (
      <div className="flex flex-col items-end my-3 animate-in fade-in duration-200">
        {created_at && (
          <span className="text-[10px] text-zinc-500 mb-1 font-medium">{created_at}</span>
        )}
        <div className="bg-[#242429] border border-white/10 text-zinc-100 rounded-3xl px-5 py-2.5 text-xs sm:text-sm max-w-[85%] sm:max-w-[70%] shadow-lg leading-relaxed font-sans font-medium">
          <p className="whitespace-pre-wrap">{content}</p>
          {attachments && attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/10">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-300">
                  {att.type.startsWith('image/') ? <Image className="w-3 h-3 text-blue-400" /> : <FileCode className="w-3 h-3 text-emerald-400" />}
                  <span className="truncate max-w-[120px] font-mono">{att.name}</span>
                  <span className="text-zinc-500 text-[9px]">{formatFileSize(att.size)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant Message / Card
  return (
    <div className="flex gap-3 items-start my-3 animate-in fade-in duration-200">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
        <Bot className="w-4 h-4 text-indigo-400" />
      </div>

      <div className="max-w-[90%] sm:max-w-[85%] space-y-3">
        {/* Main Assistant Card */}
        <div className="bg-[#18181c] border border-white/10 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-zinc-200 shadow-xl backdrop-blur-xl space-y-3">
          {/* Working Title / Header */}
          {workingStatus ? (
            <div className="space-y-1">
              <div className="font-bold text-white text-sm">Working...</div>
              <div className="text-xs text-zinc-400 font-medium">{workingStatus}</div>
            </div>
          ) : null}

          {/* Body Content */}
          {content && (
            <div className="whitespace-pre-wrap font-sans leading-relaxed text-zinc-300">
              {content}
            </div>
          )}

          {/* Interactive Plan Card button */}
          {planData && (
            <div
              onClick={onOpenPlan}
              className="mt-2 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex items-center gap-2 group"
            >
              <FileText className="w-4 h-4 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
              <div className="truncate text-xs">
                <span className="font-bold text-zinc-200">Plan: </span>
                <span className="text-zinc-400">{planData.title || planData.summary}</span>
              </div>
            </div>
          )}

          {/* Attachments if any */}
          {attachments && attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-zinc-400">
                  {att.type.startsWith('image/') ? <Image className="w-3 h-3 text-blue-400" /> : <FileCode className="w-3 h-3 text-zinc-400" />}
                  <span>{att.name}</span>
                  <span className="text-zinc-600">{formatFileSize(att.size)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Questionnaire Card (Screenshot 5 matching!) */}
        {questions && questions.length > 0 && currentQ && (
          <div className="bg-[#1e1e24] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-300">
            <div className="text-xs sm:text-sm font-semibold text-zinc-100 leading-snug">
              {currentQ.question}
            </div>

            <div className="space-y-2">
              {currentQ.options.map((optText, optIdx) => {
                let title = optText;
                let desc = '';
                if (optText.includes(' — ')) {
                  const parts = optText.split(' — ');
                  title = parts[0];
                  desc = parts.slice(1).join(' — ');
                } else if (optText.includes(' - ')) {
                  const parts = optText.split(' - ');
                  title = parts[0];
                  desc = parts.slice(1).join(' - ');
                }

                const isCustom = title.toLowerCase().startsWith('write your own');
                const isSelected = answers[currentQ.id] === optText || (isCustom && answers[currentQ.id]?.startsWith('custom:'));

                return (
                  <div key={optIdx} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isCustom) {
                          handleOptionClick(currentQ.id, optText);
                        } else {
                          handleOptionClick(currentQ.id, `custom:${customText[currentQ.id] || ''}`);
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-blue-500/60 bg-blue-500/10 text-white font-medium shadow-md'
                          : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Radio Icon */}
                      <div className={`w-4 h-4 rounded-full border shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-zinc-500 bg-transparent'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>

                      <div className="flex-1">
                        <div className="text-xs font-semibold text-zinc-100">{title}</div>
                        {desc && <div className="text-[11px] text-zinc-400 mt-0.5 leading-normal">{desc}</div>}
                      </div>
                    </button>

                    {/* Write your own input box */}
                    {isCustom && isSelected && (
                      <div className="ml-7 mt-1">
                        <input
                          type="text"
                          value={customText[currentQ.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomText(prev => ({ ...prev, [currentQ.id]: val }));
                            handleOptionClick(currentQ.id, `custom:${val}`);
                          }}
                          placeholder="Type your requirements..."
                          className="w-full bg-[#141417] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 font-sans"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Questionnaire Action Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                  className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={currentQIndex >= questions.length - 1}
                  onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-zinc-500 ml-1 font-mono">
                  {currentQIndex + 1}/{questions.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onPlanSubmit) onPlanSubmit(answers);
                  }}
                  className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg transition-colors"
                >
                  Skip all
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (currentQIndex < questions.length - 1) {
                      setCurrentQIndex(prev => prev + 1);
                    } else {
                      if (onPlanSubmit) onPlanSubmit(answers);
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md active:scale-95 transition-all flex items-center gap-1"
                >
                  <span>{currentQIndex < questions.length - 1 ? 'Next' : 'Confirm & Build'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
