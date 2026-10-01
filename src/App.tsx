import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, Calendar as CalendarIcon, Clock, Plus, 
  Sparkles, Download, AlertTriangle, CheckCircle2, RefreshCw,
  HelpCircle, Layers
} from 'lucide-react';
import { ScheduleEvent } from './types/schedule';
import { getDefaultEvents } from './utils/defaultData';
import { NaturalLanguageInput } from './components/NaturalLanguageInput';
import { ExcelSpreadsheetView } from './components/ExcelSpreadsheetView';
import { CalendarView } from './components/CalendarView';
import { TimelineAgendaView } from './components/TimelineAgendaView';
import { ScheduleModal } from './components/ScheduleModal';
import { AIAdvisorModal } from './components/AIAdvisorModal';
import { exportToExcel } from './utils/excelExport';

const STORAGE_KEY = 'smart_scheduler_events_v2';

export default function App() {
  const [events, setEvents] = useState<ScheduleEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
    return getDefaultEvents();
  });

  const [activeTab, setActiveTab] = useState<'excel' | 'calendar' | 'timeline'>('excel');
  const [modalOpen, setModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<ScheduleEvent | null>(null);
  const [initialDateForAdd, setInitialDateForAdd] = useState<string | undefined>();
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [events]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add multiple events from AI parser
  const handleAddEvents = (newEvents: Omit<ScheduleEvent, 'id' | 'createdAt'>[]) => {
    const createdList: ScheduleEvent[] = newEvents.map((evt, idx) => ({
      ...evt,
      id: `evt-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
    }));

    setEvents(prev => [...createdList, ...prev]);
    showToast(`${createdList.length}건의 일정이 분석되어 엑셀 시트에 등록되었습니다!`);
  };

  // Update single event
  const handleUpdateEvent = (updated: ScheduleEvent) => {
    setEvents(prev => prev.map(e => (e.id === updated.id ? updated : e)));
    showToast(`'${updated.title}' 일정이 업데이트되었습니다.`);
  };

  // Delete event
  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    showToast('일정이 삭제되었습니다.');
  };

  // Save from manual modal
  const handleSaveModal = (data: Omit<ScheduleEvent, 'id' | 'createdAt'>, existingId?: string) => {
    if (existingId) {
      setEvents(prev => prev.map(e => e.id === existingId ? { ...e, ...data } : e));
      showToast('일정이 수정되었습니다.');
    } else {
      const newEvt: ScheduleEvent = {
        ...data,
        id: `evt-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setEvents(prev => [newEvt, ...prev]);
      showToast('새 일정이 등록되었습니다.');
    }
  };

  // Add blank row to Excel
  const handleAddBlankRow = () => {
    const today = new Date().toISOString().split('T')[0];
    const newEvt: ScheduleEvent = {
      id: `evt-${Date.now()}`,
      title: '새 일정',
      startDate: today,
      startTime: '09:00',
      endDate: today,
      endTime: '10:00',
      isAllDay: false,
      location: '',
      participants: [],
      category: '업무',
      priority: '보통',
      notes: '',
      completed: false,
      createdAt: new Date().toISOString(),
      rawInput: '수동 추가'
    };
    setEvents(prev => [newEvt, ...prev]);
    showToast('엑셀 시트에 빈 새 행이 추가되었습니다. 더블 클릭하여 수정하세요.');
  };

  // Open modal for specific date
  const handleAddEventForDate = (dateStr: string) => {
    setInitialDateForAdd(dateStr);
    setEventToEdit(null);
    setModalOpen(true);
  };

  // Reset to default sample events
  const handleResetData = () => {
    if (confirm('샘플 데이터로 초기화하시겠습니까? 현재 변경사항이 초기화됩니다.')) {
      const samples = getDefaultEvents();
      setEvents(samples);
      showToast('샘플 일정으로 초기화되었습니다.');
    }
  };

  // Conflicts check
  const conflictsCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < events.length; i++) {
      const a = events[i];
      if (a.completed || a.isAllDay) continue;
      for (let j = i + 1; j < events.length; j++) {
        const b = events[j];
        if (b.completed || b.isAllDay) continue;
        if (a.startDate === b.startDate) {
          if (
            (a.startTime >= b.startTime && a.startTime < b.endTime) ||
            (a.endTime > b.startTime && a.endTime <= b.endTime) ||
            (a.startTime <= b.startTime && a.endTime >= b.endTime)
          ) {
            count++;
          }
        }
      }
    }
    return count;
  }, [events]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#107C41] to-emerald-500 text-white flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                  스마트 일정 플래너 &amp; 엑셀 뷰어
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  AI Schedule &amp; Excel
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                자연어 문장을 해석해 일정으로 관리하고 실시간 엑셀 시트 뷰로 편집 및 다운로드
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdvisorModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">AI 스케줄 브리핑</span>
            </button>

            <button
              type="button"
              onClick={() => exportToExcel(events)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#107C41] hover:bg-[#0E6435] text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
              title="현재 등록된 모든 일정을 Microsoft Excel (.xlsx) 파일로 내보내기"
            >
              <Download className="w-3.5 h-3.5" />
              <span>엑셀 다운로드</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEventToEdit(null);
                setInitialDateForAdd(undefined);
                setModalOpen(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:bg-slate-800 dark:hover:bg-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">직접 추가</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Natural Language AI Input Section */}
        <section aria-label="자연어 일정 등록">
          <NaturalLanguageInput onAddEvents={handleAddEvents} />
        </section>

        {/* Time conflict notification banner if overlaps exist */}
        {conflictsCount > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>일정 충돌 주의:</strong> 같은 일자에 시간이 겹치는 일정이 <strong>{conflictsCount}건</strong> 감지되었습니다. 엑셀 뷰 또는 타임라인에서 시간을 조정해 보세요.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAdvisorModalOpen(true)}
              className="px-2.5 py-1 rounded bg-amber-200/70 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 font-medium transition-colors text-[11px]"
            >
              AI 충돌 분석 보기
            </button>
          </div>
        )}

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="inline-flex p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('excel')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'excel'
                  ? 'bg-white dark:bg-slate-900 text-[#107C41] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>엑셀 시트 뷰 (Excel View)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 font-mono">
                {events.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>월간 캘린더</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>타임라인 &amp; 목록</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetData}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 text-xs transition-colors"
              title="샘플 데이터 복원"
            >
              <RefreshCw className="w-3 h-3" />
              <span>샘플 데이터 복원</span>
            </button>
          </div>
        </div>

        {/* Active Tab View Content */}
        {activeTab === 'excel' && (
          <ExcelSpreadsheetView
            events={events}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onAddBlankRow={handleAddBlankRow}
            onEditFullEvent={(evt) => {
              setEventToEdit(evt);
              setModalOpen(true);
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            events={events}
            onSelectEvent={(evt) => {
              setEventToEdit(evt);
              setModalOpen(true);
            }}
            onAddEventForDate={handleAddEventForDate}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineAgendaView
            events={events}
            onSelectEvent={(evt) => {
              setEventToEdit(evt);
              setModalOpen(true);
            }}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">스마트 일정 플래너</span>
            <span>•</span>
            <span>자연어 AI 해석 &amp; 엑셀 스프레드시트 뷰어</span>
          </div>
          <div>
            지원 형식: <strong>.xlsx</strong> (Microsoft Excel 통합 문서), <strong>.csv</strong> (UTF-8 BOM), <strong>클립보드 TSV</strong>
          </div>
        </div>
      </footer>

      {/* Manual Add/Edit Modal */}
      <ScheduleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
        initialDate={initialDateForAdd}
        onSave={handleSaveModal}
        onDelete={handleDeleteEvent}
      />

      {/* AI Schedule Advisor Modal */}
      <AIAdvisorModal
        isOpen={advisorModalOpen}
        onClose={() => setAdvisorModalOpen(false)}
        events={events}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
