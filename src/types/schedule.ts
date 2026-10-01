export type EventCategory = '업무' | '회의' | '약속' | '개인' | '운동/건강' | '기념일' | '기타';
export type EventPriority = '높음' | '보통' | '낮음';

export interface ScheduleEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  isAllDay: boolean;
  location: string;
  participants: string[];
  category: EventCategory;
  priority: EventPriority;
  notes: string;
  completed: boolean;
  createdAt: string;
  aiReasoning?: string;
  rawInput?: string;
}

export interface ParseResult {
  success: boolean;
  reasoning: string;
  events: Array<{
    title: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    isAllDay?: boolean;
    location?: string;
    participants?: string[];
    category?: EventCategory;
    priority?: EventPriority;
    notes?: string;
  }>;
}

export const CATEGORY_COLORS: Record<EventCategory, { bg: string; text: string; border: string; badge: string }> = {
  '업무': { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', badge: 'bg-blue-100 text-blue-800 border-blue-300' },
  '회의': { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', badge: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  '약속': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  '개인': { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  '운동/건강': { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800', badge: 'bg-teal-100 text-teal-800 border-teal-300' },
  '기념일': { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', badge: 'bg-rose-100 text-rose-800 border-rose-300' },
  '기타': { bg: 'bg-slate-50 dark:bg-slate-900/40', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700', badge: 'bg-slate-100 text-slate-800 border-slate-300' },
};

export const PRIORITY_STYLES: Record<EventPriority, { text: string; bg: string; dot: string }> = {
  '높음': { text: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900', dot: 'bg-red-500' },
  '보통': { text: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900', dot: 'bg-blue-500' },
  '낮음': { text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700', dot: 'bg-gray-400' },
};
