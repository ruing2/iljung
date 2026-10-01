import React, { useMemo } from 'react';
import { 
  Clock, MapPin, Users, Calendar, AlertTriangle, CheckCircle2, 
  Circle, Edit3, Trash2, Tag, FileText, ChevronRight 
} from 'lucide-react';
import { ScheduleEvent, CATEGORY_COLORS, PRIORITY_STYLES } from '../types/schedule';
import { calculateDuration } from '../utils/excelExport';

interface TimelineAgendaViewProps {
  events: ScheduleEvent[];
  onSelectEvent: (event: ScheduleEvent) => void;
  onUpdateEvent: (event: ScheduleEvent) => void;
  onDeleteEvent: (id: string) => void;
}

export const TimelineAgendaView: React.FC<TimelineAgendaViewProps> = ({
  events,
  onSelectEvent,
  onUpdateEvent,
  onDeleteEvent,
}) => {
  // Sort events by date and time
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateDiff = a.startDate.localeCompare(b.startDate);
      if (dateDiff !== 0) return dateDiff;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [events]);

  // Group events by relative day
  const groupedEvents = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    const weekLaterStr = weekLater.toISOString().split('T')[0];

    const groups: { [key: string]: { label: string; badge: string; items: ScheduleEvent[] } } = {
      today: { label: '오늘 일정', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', items: [] },
      tomorrow: { label: '내일 일정', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300', items: [] },
      thisWeek: { label: '이번 주 일정', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300', items: [] },
      future: { label: '향후 예정 일정', badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300', items: [] },
      past: { label: '지난 일정', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', items: [] },
    };

    sortedEvents.forEach((evt) => {
      if (evt.startDate < todayStr) {
        groups.past.items.push(evt);
      } else if (evt.startDate === todayStr) {
        groups.today.items.push(evt);
      } else if (evt.startDate === tomorrowStr) {
        groups.tomorrow.items.push(evt);
      } else if (evt.startDate <= weekLaterStr) {
        groups.thisWeek.items.push(evt);
      } else {
        groups.future.items.push(evt);
      }
    });

    return groups;
  }, [sortedEvents]);

  // Conflict detection for adjacent events on same date
  const hasConflict = (current: ScheduleEvent, index: number, list: ScheduleEvent[]) => {
    if (current.isAllDay) return false;
    for (let i = 0; i < list.length; i++) {
      if (i === index) continue;
      const other = list[i];
      if (other.startDate === current.startDate && !other.isAllDay) {
        if (
          (current.startTime >= other.startTime && current.startTime < other.endTime) ||
          (current.endTime > other.startTime && current.endTime <= other.endTime) ||
          (current.startTime <= other.startTime && current.endTime >= other.endTime)
        ) {
          return other;
        }
      }
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            타임라인 &amp; 일정 목록
          </h2>
          <p className="text-xs text-slate-500">
            시간 순으로 정렬된 상세 아젠다 목록입니다.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-400">
          총 {events.length}건 등록
        </span>
      </div>

      {Object.entries(groupedEvents).map(([key, group]) => {
        if (group.items.length === 0) return null;

        return (
          <div key={key} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${group.badge}`}>
                {group.label}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {group.items.length}건
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="space-y-2.5">
              {group.items.map((evt, idx) => {
                const conflicting = hasConflict(evt, idx, group.items);

                return (
                  <div
                    key={evt.id}
                    className={`p-4 rounded-xl border transition-all ${
                      evt.completed
                        ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800/80 opacity-60'
                        : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Complete Checkbox */}
                        <button
                          type="button"
                          onClick={() => onUpdateEvent({ ...evt, completed: !evt.completed })}
                          className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                          title={evt.completed ? '미완료로 변경' : '완료로 변경'}
                        >
                          {evt.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Title & Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              onClick={() => onSelectEvent(evt)}
                              className={`text-sm font-semibold cursor-pointer hover:text-emerald-600 transition-colors ${
                                evt.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {evt.title}
                            </h3>

                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${CATEGORY_COLORS[evt.category]?.badge}`}>
                              {evt.category}
                            </span>

                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${PRIORITY_STYLES[evt.priority]?.bg} ${PRIORITY_STYLES[evt.priority]?.text}`}>
                              {evt.priority}
                            </span>
                          </div>

                          {/* Time & Duration */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1 font-mono font-medium">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {evt.startDate} {evt.isAllDay ? '(종일)' : `${evt.startTime} ~ ${evt.endTime}`}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="font-mono text-slate-500">
                              소요시간: {calculateDuration(evt)}
                            </span>
                            {evt.location && (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="flex items-center gap-1 truncate max-w-[200px]">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{evt.location}</span>
                                </span>
                              </>
                            )}
                          </div>

                          {/* Participants */}
                          {evt.participants && evt.participants.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>참석자: {evt.participants.join(', ')}</span>
                            </div>
                          )}

                          {/* Notes */}
                          {evt.notes && (
                            <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                              <span className="font-medium text-slate-500 mr-1">메모:</span>
                              {evt.notes}
                            </div>
                          )}

                          {/* Conflict Warning */}
                          {conflicting && !evt.completed && (
                            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>
                                ⚠️ '{conflicting.title}' ({conflicting.startTime}~{conflicting.endTime}) 일정과 시간이 중복됩니다!
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onSelectEvent(evt)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="상세 수정"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEvent(evt.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
