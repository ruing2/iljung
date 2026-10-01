import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, 
  MapPin, Users, Plus, CheckCircle2 
} from 'lucide-react';
import { ScheduleEvent, EventCategory, CATEGORY_COLORS } from '../types/schedule';

interface CalendarViewProps {
  events: ScheduleEvent[];
  onSelectEvent: (event: ScheduleEvent) => void;
  onAddEventForDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onSelectEvent,
  onAddEventForDate,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: string; events: ScheduleEvent[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar matrix calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days = [];
  // Prev month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ dayNumber: i, dateStr, isCurrentMonth: true });
  }
  // Next month padding to reach 35 or 42 cells
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ dayNumber: i, dateStr, isCurrentMonth: false });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const handleDayClick = (dateStr: string) => {
    const dayEvts = events.filter(e => e.startDate === dateStr);
    setSelectedDayEvents({ date: dateStr, events: dayEvts });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-5">
      {/* Calendar Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {year}년 {month + 1}월
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            (총 {events.filter(e => e.startDate.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length}건 일정)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={jumpToToday}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            오늘
          </button>
          <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs mb-2">
        <div className="text-red-500 py-1">일</div>
        <div className="text-slate-600 dark:text-slate-400 py-1">월</div>
        <div className="text-slate-600 dark:text-slate-400 py-1">화</div>
        <div className="text-slate-600 dark:text-slate-400 py-1">수</div>
        <div className="text-slate-600 dark:text-slate-400 py-1">목</div>
        <div className="text-slate-600 dark:text-slate-400 py-1">금</div>
        <div className="text-blue-500 py-1">토</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((cell, idx) => {
          const dayEvents = events.filter(e => e.startDate === cell.dateStr);
          const isToday = cell.dateStr === todayStr;
          const isSunday = idx % 7 === 0;
          const isSaturday = idx % 7 === 6;

          return (
            <div
              key={cell.dateStr + idx}
              onClick={() => handleDayClick(cell.dateStr)}
              className={`min-h-[100px] p-1.5 rounded-xl border transition-all flex flex-col justify-between group cursor-pointer ${
                cell.isCurrentMonth
                  ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/20'
                  : 'bg-slate-100/30 dark:bg-slate-900/30 border-transparent opacity-40'
              } ${isToday ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 bg-emerald-50/30' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isSunday
                      ? 'text-red-500'
                      : isSaturday
                      ? 'text-blue-500'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddEventForDate(cell.dateStr);
                  }}
                  className="w-5 h-5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="이 날짜에 새 일정 추가"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Event chips */}
              <div className="space-y-1 overflow-hidden flex-1">
                {dayEvents.slice(0, 3).map((evt) => (
                  <div
                    key={evt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(evt);
                    }}
                    className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium border flex items-center gap-1 hover:brightness-95 transition-all ${
                      CATEGORY_COLORS[evt.category]?.badge || 'bg-slate-200 text-slate-800'
                    } ${evt.completed ? 'line-through opacity-60' : ''}`}
                    title={`${evt.title} (${evt.isAllDay ? '종일' : `${evt.startTime}~${evt.endTime}`})`}
                  >
                    {!evt.isAllDay && <span className="text-[9px] opacity-75">{evt.startTime}</span>}
                    <span className="truncate">{evt.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-slate-400 font-semibold pl-1">
                    +{dayEvents.length - 3}건 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Modal / Drawer */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  {selectedDayEvents.date} 일정 목록
                </h3>
                <p className="text-xs text-slate-500">
                  총 {selectedDayEvents.events.length}건의 일정이 등록되어 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayEvents(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1"
              >
                닫기
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {selectedDayEvents.events.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  이 날짜에는 등록된 일정이 없습니다.
                </div>
              ) : (
                selectedDayEvents.events.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setSelectedDayEvents(null);
                      onSelectEvent(evt);
                    }}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold text-xs text-slate-900 dark:text-slate-100 ${evt.completed ? 'line-through text-slate-400' : ''}`}>
                        {evt.title}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${CATEGORY_COLORS[evt.category]?.badge}`}>
                        {evt.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{evt.isAllDay ? '종일 일정' : `${evt.startTime} ~ ${evt.endTime}`}</span>
                      {evt.location && (
                        <>
                          <span>•</span>
                          <span className="truncate">{evt.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const targetDate = selectedDayEvents.date;
                  setSelectedDayEvents(null);
                  onAddEventForDate(targetDate);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>이 날짜에 일정 추가</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
