import React, { useState } from 'react';
import { Sparkles, X, Loader2, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { ScheduleEvent } from '../types/schedule';

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: ScheduleEvent[];
}

export const AIAdvisorModal: React.FC<AIAdvisorModalProps> = ({
  isOpen,
  onClose,
  events,
}) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error('일정 분석에 실패했습니다.');
      }

      const data = await response.json();
      setAnalysis(data.analysis || '분석 결과를 생성하지 못했습니다.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !analysis && !loading) {
      runAnalysis();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-fadeIn flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                AI 스케줄 브리핑 &amp; 일정 최적화 분석
              </h3>
              <p className="text-xs text-slate-500">
                Gemini 3.8 Flash가 등록된 {events.length}건의 일정을 종합 분석합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
              <span>전체 일정 시간표와 충돌 여부를 AI가 분석하는 중입니다...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : analysis ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 leading-relaxed whitespace-pre-wrap">
              {analysis}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>재분석 요청</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            확인 완료
          </button>
        </div>
      </div>
    </div>
  );
};
