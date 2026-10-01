import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, Tag, AlertCircle, Trash2 } from 'lucide-react';
import { ScheduleEvent, EventCategory, EventPriority, CATEGORY_COLORS } from '../types/schedule';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit: ScheduleEvent | null;
  initialDate?: string;
  onSave: (event: Omit<ScheduleEvent, 'id' | 'createdAt'>, existingId?: string) => void;
  onDelete?: (id: string) => void;
}

const CATEGORIES: EventCategory[] = ['업무', '회의', '약속', '개인', '운동/건강', '기념일', '기타'];
const PRIORITIES: EventPriority[] = ['높음', '보통', '낮음'];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  initialDate,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [participantsText, setParticipantsText] = useState('');
  const [category, setCategory] = useState<EventCategory>('업무');
  const [priority, setPriority] = useState<EventPriority>('보통');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setStartDate(eventToEdit.startDate);
      setStartTime(eventToEdit.startTime || '09:00');
      setEndDate(eventToEdit.endDate || eventToEdit.startDate);
      setEndTime(eventToEdit.endTime || '10:00');
      setIsAllDay(eventToEdit.isAllDay);
      setLocation(eventToEdit.location || '');
      setParticipantsText(eventToEdit.participants?.join(', ') || '');
      setCategory(eventToEdit.category || '업무');
      setPriority(eventToEdit.priority || '보통');
      setNotes(eventToEdit.notes || '');
      setCompleted(eventToEdit.completed || false);
    } else {
      const today = initialDate || new Date().toISOString().split('T')[0];
      setTitle('');
      setStartDate(today);
      setStartTime('10:00');
      setEndDate(today);
      setEndTime('11:00');
      setIsAllDay(false);
      setLocation('');
      setParticipantsText('');
      setCategory('업무');
      setPriority('보통');
      setNotes('');
      setCompleted(false);
    }
  }, [eventToEdit, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const participants = participantsText
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    onSave({
      title: title.trim(),
      startDate: startDate || new Date().toISOString().split('T')[0],
      startTime: isAllDay ? '00:00' : startTime,
      endDate: endDate || startDate || new Date().toISOString().split('T')[0],
      endTime: isAllDay ? '23:59' : endTime,
      isAllDay,
      location: location.trim(),
      participants,
      category,
      priority,
      notes: notes.trim(),
      completed,
    }, eventToEdit?.id);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            {eventToEdit ? '일정 수정 (엑셀 시트 연동)' : '새 일정 등록 (엑셀 시트 연동)'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              일정명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2026 4분기 사업계획 회의"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                카테고리
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                우선순위
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as EventPriority)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* All day toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAllDay"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isAllDay" className="text-slate-700 dark:text-slate-300 select-none">
              종일 일정
            </label>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                시작일자 및 시간
              </label>
              <div className="space-y-1.5">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate || endDate < e.target.value) setEndDate(e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs"
                />
                {!isAllDay && (
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                종료일자 및 시간
              </label>
              <div className="space-y-1.5">
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs"
                />
                {!isAllDay && (
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              장소 또는 온라인 링크
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 서울 강남구 테헤란로 123 스타벅스 2층"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
            />
          </div>

          {/* Participants */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              참석자 (쉼표로 구분)
            </label>
            <input
              type="text"
              value={participantsText}
              onChange={(e) => setParticipantsText(e.target.value)}
              placeholder="예: 김철수, 이영희, 박과장"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              메모 및 준비사항
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="안건 내용, 준비물, 특이사항"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {eventToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('이 일정을 삭제하시겠습니까?')) {
                    onDelete(eventToEdit.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>일정 삭제</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                {eventToEdit ? '변경사항 저장' : '일정 등록'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
