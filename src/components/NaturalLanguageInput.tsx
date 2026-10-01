import React, { useState } from 'react';
import { Sparkles, Send, Loader2, ArrowRight, CheckCircle2, Clock, MapPin, Users, Tag, AlertCircle } from 'lucide-react';
import { ScheduleEvent, EventCategory, EventPriority, CATEGORY_COLORS, PRIORITY_STYLES } from '../types/schedule';

interface NaturalLanguageInputProps {
  onAddEvents: (events: Omit<ScheduleEvent, 'id' | 'createdAt'>[]) => void;
  onSelectEventForEdit?: (event: ScheduleEvent) => void;
}

const PRESET_EXAMPLES = [
  '내일 오후 3시에 강남역 스타벅스에서 김부장님과 신규 프로젝트 기획 미팅 1시간 30분',
  '다음 주 화요일 오전 10시 치과 정기 검진 40분 소요',
  '이번 주 금요일 저녁 7시 홍대 입구 삼겹살집 동창 모임 회식비 3만원 지참',
  '10월 5일 오후 4시 주간 업무 보고서 제출 및 10월 8일 종일 부모님 결혼기념일 선물 준비',
  '내일 아침 8시 한강 러닝 40분, 오후 2시 디자인팀 피드백 회의 1시간'
];

export const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({ onAddEvents }) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastParsed, setLastParsed] = useState<{
    reasoning: string;
    events: any[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handleParseAndAdd = async (textToParse?: string) => {
    const text = (textToParse !== undefined ? textToParse : inputText).trim();
    if (!text) {
      setErrorMessage('문장을 입력하거나 아래 추천 예시를 클릭해 주세요.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setAddedSuccess(false);

    try {
      const response = await fetch('/api/parse-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          referenceTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || '일정 분석에 실패했습니다.');
      }

      const data = await response.json();
      if (!data.events || data.events.length === 0) {
        throw new Error('문장에서 일정 정보를 감지하지 못했습니다. 더 구체적으로 작성해 보세요.');
      }

      const newEvents: Omit<ScheduleEvent, 'id' | 'createdAt'>[] = data.events.map((e: any) => ({
        title: e.title || '새 일정',
        startDate: e.startDate || new Date().toISOString().split('T')[0],
        startTime: e.startTime || '09:00',
        endDate: e.endDate || e.startDate || new Date().toISOString().split('T')[0],
        endTime: e.endTime || '10:00',
        isAllDay: !!e.isAllDay,
        location: e.location || '',
        participants: Array.isArray(e.participants) ? e.participants : [],
        category: (e.category as EventCategory) || '업무',
        priority: (e.priority as EventPriority) || '보통',
        notes: e.notes || '',
        completed: false,
        aiReasoning: data.reasoning,
        rawInput: text
      }));

      // Add to schedule list
      onAddEvents(newEvents);
      setLastParsed({ reasoning: data.reasoning, events: newEvents });
      setAddedSuccess(true);
      setInputText('');

      // Clear success notification after 5 seconds
      setTimeout(() => setAddedSuccess(false), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '일정을 해석하는 동안 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleParseAndAdd();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              자연어 스마트 일정 등록
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Gemini AI Powered
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              평소 말하듯이 적어주시면 AI가 날짜, 시간, 장소, 참석자를 자동 추출하여 엑셀 시트에 등록합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="relative">
        <textarea
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="예: 내일 오후 3시에 강남역 스타벅스에서 김부장님과 신규 프로젝트 기획 회의 1시간 반 동안 진행하고, 다음 주 월요일 오전 9시 반에 주간 보고서 제출"
          className="w-full text-sm p-3.5 pr-28 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
        />
        <div className="absolute right-2.5 bottom-3.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleParseAndAdd()}
            disabled={loading || !inputText.trim()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>해석 중...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>등록</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-mono">Enter</kbd> 로 빠른 등록
        </span>
        <span className="text-[11px] text-slate-500">한 문장에 여러 개의 일정이 있어도 동시 추출 가능</span>
      </div>

      {/* Preset quick buttons */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">추천 테스트 문장:</span>
          <span className="text-[11px] text-slate-400">(클릭 시 즉시 해석 및 엑셀 시트에 등록됩니다)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_EXAMPLES.map((example, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setInputText(example);
                handleParseAndAdd(example);
              }}
              disabled={loading}
              className="text-left text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 dark:bg-slate-800/60 dark:hover:bg-emerald-950/40 dark:hover:border-emerald-800 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1.5 group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
              <span className="line-clamp-1">{example}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error display */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Last parsed card feedback */}
      {addedSuccess && lastParsed && (
        <div className="mt-3.5 p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 transition-all animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{lastParsed.events.length}건의 일정이 분석되어 엑셀 시트에 등록되었습니다!</span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              엑셀 뷰에서 확인 가능
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 mb-2.5">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 mr-1.5">💡 AI 해석 근거:</span>
            {lastParsed.reasoning}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {lastParsed.events.map((evt, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {evt.title}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${CATEGORY_COLORS[evt.category as EventCategory]?.badge || 'bg-slate-100'}`}>
                    {evt.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {evt.startDate} {evt.isAllDay ? '(종일)' : `${evt.startTime} ~ ${evt.endTime}`}
                  </span>
                  {evt.priority && (
                    <span className={`px-1 rounded text-[10px] ${PRIORITY_STYLES[evt.priority as EventPriority]?.text}`}>
                      {evt.priority}
                    </span>
                  )}
                </div>
                {evt.location && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{evt.location}</span>
                  </div>
                )}
                {evt.participants && evt.participants.length > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    <Users className="w-3 h-3 shrink-0" />
                    <span>{evt.participants.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
