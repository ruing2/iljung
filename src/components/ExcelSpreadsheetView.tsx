import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, Download, Copy, Plus, Trash2, Filter, 
  Search, CheckSquare, Square, Check, ArrowUpDown, RefreshCw,
  Sparkles, Calendar, Clock, BarChart3, Edit3
} from 'lucide-react';
import { ScheduleEvent, EventCategory, EventPriority, CATEGORY_COLORS, PRIORITY_STYLES } from '../types/schedule';
import { calculateDuration, exportToExcel, exportToCSV, copyToClipboardAsTSV } from '../utils/excelExport';

interface ExcelSpreadsheetViewProps {
  events: ScheduleEvent[];
  onUpdateEvent: (updated: ScheduleEvent) => void;
  onDeleteEvent: (id: string) => void;
  onAddBlankRow: () => void;
  onEditFullEvent: (event: ScheduleEvent) => void;
}

export const ExcelSpreadsheetView: React.FC<ExcelSpreadsheetViewProps> = ({
  events,
  onUpdateEvent,
  onDeleteEvent,
  onAddBlankRow,
  onEditFullEvent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('전체');
  const [priorityFilter, setPriorityFilter] = useState<string>('전체');
  const [statusFilter, setStatusFilter] = useState<string>('전체');
  const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; colKey: string } | null>({ rowIdx: 0, colKey: 'title' });
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof ScheduleEvent } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeSheetTab, setActiveSheetTab] = useState<'master' | 'summary'>('master');
  const [copyToast, setCopyToast] = useState(false);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      if (categoryFilter !== '전체' && evt.category !== categoryFilter) return false;
      if (priorityFilter !== '전체' && evt.priority !== priorityFilter) return false;
      if (statusFilter === '완료' && !evt.completed) return false;
      if (statusFilter === '진행중' && evt.completed) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = evt.title.toLowerCase().includes(q);
        const matchLocation = evt.location.toLowerCase().includes(q);
        const matchNotes = evt.notes.toLowerCase().includes(q);
        const matchParticipants = evt.participants?.some(p => p.toLowerCase().includes(q));
        if (!matchTitle && !matchLocation && !matchNotes && !matchParticipants) return false;
      }
      return true;
    });
  }, [events, categoryFilter, priorityFilter, statusFilter, searchQuery]);

  // Formula bar address and content computation
  const formulaInfo = useMemo(() => {
    if (!selectedCell || selectedCell.rowIdx < 0 || selectedCell.rowIdx >= filteredEvents.length) {
      return { address: 'A1', value: '=COUNTA(일정)' };
    }
    const evt = filteredEvents[selectedCell.rowIdx];
    const colLetters: Record<string, string> = {
      'no': 'A',
      'completed': 'B',
      'title': 'C',
      'startDate': 'D',
      'startTime': 'E',
      'endDate': 'F',
      'endTime': 'G',
      'duration': 'H',
      'category': 'I',
      'priority': 'J',
      'location': 'K',
      'participants': 'L',
      'notes': 'M'
    };
    const letter = colLetters[selectedCell.colKey] || 'C';
    const address = `${letter}${selectedCell.rowIdx + 2}`;
    
    let value = '';
    if (selectedCell.colKey === 'title') value = evt.title;
    else if (selectedCell.colKey === 'duration') value = `=TEXT("${calculateDuration(evt)}")`;
    else if (selectedCell.colKey === 'startDate') value = evt.startDate;
    else if (selectedCell.colKey === 'startTime') value = evt.startTime;
    else if (selectedCell.colKey === 'endDate') value = evt.endDate;
    else if (selectedCell.colKey === 'endTime') value = evt.endTime;
    else if (selectedCell.colKey === 'location') value = evt.location;
    else if (selectedCell.colKey === 'category') value = evt.category;
    else if (selectedCell.colKey === 'priority') value = evt.priority;
    else if (selectedCell.colKey === 'notes') value = evt.notes;
    else if (selectedCell.colKey === 'participants') value = evt.participants.join(', ');
    else if (selectedCell.colKey === 'completed') value = evt.completed ? '=TRUE()' : '=FALSE()';
    else value = String((evt as any)[selectedCell.colKey] || '');

    return { address, value };
  }, [selectedCell, filteredEvents]);

  // Handle cell click
  const handleCellClick = (rowIdx: number, colKey: string) => {
    setSelectedCell({ rowIdx, colKey });
  };

  // Start in-cell edit
  const handleStartEdit = (evt: ScheduleEvent, field: keyof ScheduleEvent) => {
    setEditingCell({ id: evt.id, field });
    if (field === 'participants') {
      setEditValue(evt.participants.join(', '));
    } else {
      setEditValue(String(evt[field] || ''));
    }
  };

  // Save in-cell edit
  const handleSaveEdit = (evt: ScheduleEvent) => {
    if (!editingCell) return;
    const field = editingCell.field;
    let updated: ScheduleEvent = { ...evt };

    if (field === 'participants') {
      updated.participants = editValue.split(',').map(s => s.trim()).filter(Boolean);
    } else if (field === 'category') {
      updated.category = editValue as EventCategory;
    } else if (field === 'priority') {
      updated.priority = editValue as EventPriority;
    } else {
      (updated as any)[field] = editValue;
    }

    onUpdateEvent(updated);
    setEditingCell(null);
  };

  // Batch selection
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEvents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEvents.map(e => e.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`선택한 ${selectedIds.size}개 일정을 삭제하시겠습니까?`)) {
      selectedIds.forEach(id => onDeleteEvent(id));
      setSelectedIds(new Set());
    }
  };

  const handleBatchComplete = () => {
    selectedIds.forEach(id => {
      const target = events.find(e => e.id === id);
      if (target) {
        onUpdateEvent({ ...target, completed: !target.completed });
      }
    });
    setSelectedIds(new Set());
  };

  const handleCopyTSV = () => {
    copyToClipboardAsTSV(filteredEvents);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 3000);
  };

  // Summary statistics
  const totalCount = events.length;
  const completedCount = events.filter(e => e.completed).length;
  const highPriorityCount = events.filter(e => e.priority === '높음').length;
  const categorySummary = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach(e => { map[e.category] = (map[e.category] || 0) + 1; });
    return Object.entries(map);
  }, [events]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Excel Title Bar & Ribbon */}
      <div className="bg-[#107C41] text-white px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center font-bold text-white shadow-inner">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-wide">
                Smart_Scheduler.xlsx
              </span>
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-emerald-100 font-mono">
                [자동 동기화됨]
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-white/20 text-xs">
            <span className="text-emerald-100">전체 {totalCount}행</span>
            <span className="text-white/40">•</span>
            <span className="text-emerald-100">완료 {completedCount}건</span>
            <span className="text-white/40">•</span>
            <span className="text-emerald-100">우선순위 높음 {highPriorityCount}건</span>
          </div>
        </div>

        {/* Excel Export & Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => exportToExcel(events)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-[#107C41] hover:bg-emerald-50 active:scale-95 shadow-sm transition-all"
            title="Microsoft Excel 형식으로 즉시 다운로드"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (.xlsx) 다운로드</span>
          </button>

          <button
            type="button"
            onClick={() => exportToCSV(events)}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-800 hover:bg-emerald-900 text-white transition-colors"
            title="CSV 파일 다운로드 (Excel 호환 UTF-8 BOM 포함)"
          >
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCopyTSV}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/15 hover:bg-white/25 text-white transition-colors active:scale-95"
            title="엑셀 표 형식으로 복사하여 MS Excel 또는 스프레드시트에 바로 붙여넣기"
          >
            {copyToast ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copyToast ? '복사됨!' : '엑셀 복사'}</span>
          </button>
        </div>
      </div>

      {/* Excel Ribbon Toolbar */}
      <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddBlankRow}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>행 추가</span>
          </button>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-slate-700">
              <span className="text-slate-500 font-medium">{selectedIds.size}개 선택됨:</span>
              <button
                type="button"
                onClick={handleBatchComplete}
                className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 transition-colors"
              >
                완료 토글
              </button>
              <button
                type="button"
                onClick={handleBatchDelete}
                className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/60 dark:text-red-300 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>삭제</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="시트 내 검색 (제목, 장소, 메모)..."
              className="pl-8 pr-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
          >
            <option value="전체">카테고리: 전체</option>
            <option value="업무">업무</option>
            <option value="회의">회의</option>
            <option value="약속">약속</option>
            <option value="개인">개인</option>
            <option value="운동/건강">운동/건강</option>
            <option value="기념일">기념일</option>
            <option value="기타">기타</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
          >
            <option value="전체">중요도: 전체</option>
            <option value="높음">높음</option>
            <option value="보통">보통</option>
            <option value="낮음">낮음</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
          >
            <option value="전체">상태: 전체</option>
            <option value="진행중">진행중</option>
            <option value="완료">완료</option>
          </select>
        </div>
      </div>

      {/* Excel Formula Bar (fx) */}
      <div className="bg-slate-100/70 dark:bg-slate-950/60 px-4 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-mono">
        <div className="w-14 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-center text-slate-700 dark:text-slate-300 font-semibold select-none shadow-2xs">
          {formulaInfo.address}
        </div>
        <div className="text-slate-400 font-serif italic text-sm font-bold select-none">
          fx
        </div>
        <input
          type="text"
          readOnly
          value={formulaInfo.value}
          className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-sans text-xs focus:outline-none"
        />
        <div className="text-[11px] text-slate-400 font-sans hidden sm:block">
          💡 셀을 더블 클릭하면 값을 인라인으로 즉시 수정할 수 있습니다
        </div>
      </div>

      {/* Sheet Content Toggle */}
      {activeSheetTab === 'master' ? (
        <div className="overflow-x-auto max-h-[580px] border-b border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-left border-collapse select-none">
            {/* Table Header: Column Letters */}
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-300 dark:border-slate-700 text-center text-[11px]">
                <th className="w-10 p-1.5 border-r border-slate-300 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="p-0.5 hover:text-emerald-600 transition-colors"
                  >
                    {selectedIds.size === filteredEvents.length && filteredEvents.length > 0 ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>
                </th>
                <th className="w-12 p-2 border-r border-slate-300 dark:border-slate-700">A<br/><span className="text-[10px] font-normal text-slate-400">순번</span></th>
                <th className="w-14 p-2 border-r border-slate-300 dark:border-slate-700">B<br/><span className="text-[10px] font-normal text-slate-400">상태</span></th>
                <th className="min-w-[200px] p-2 border-r border-slate-300 dark:border-slate-700 text-left">C<br/><span className="text-[10px] font-normal text-slate-400">일정명</span></th>
                <th className="w-24 p-2 border-r border-slate-300 dark:border-slate-700">D<br/><span className="text-[10px] font-normal text-slate-400">시작일자</span></th>
                <th className="w-20 p-2 border-r border-slate-300 dark:border-slate-700">E<br/><span className="text-[10px] font-normal text-slate-400">시작시간</span></th>
                <th className="w-24 p-2 border-r border-slate-300 dark:border-slate-700">F<br/><span className="text-[10px] font-normal text-slate-400">종료일자</span></th>
                <th className="w-20 p-2 border-r border-slate-300 dark:border-slate-700">G<br/><span className="text-[10px] font-normal text-slate-400">종료시간</span></th>
                <th className="w-24 p-2 border-r border-slate-300 dark:border-slate-700">H<br/><span className="text-[10px] font-normal text-slate-400">소요시간</span></th>
                <th className="w-24 p-2 border-r border-slate-300 dark:border-slate-700">I<br/><span className="text-[10px] font-normal text-slate-400">카테고리</span></th>
                <th className="w-20 p-2 border-r border-slate-300 dark:border-slate-700">J<br/><span className="text-[10px] font-normal text-slate-400">중요도</span></th>
                <th className="min-w-[160px] p-2 border-r border-slate-300 dark:border-slate-700 text-left">K<br/><span className="text-[10px] font-normal text-slate-400">장소</span></th>
                <th className="min-w-[140px] p-2 border-r border-slate-300 dark:border-slate-700 text-left">L<br/><span className="text-[10px] font-normal text-slate-400">참석자</span></th>
                <th className="min-w-[180px] p-2 border-r border-slate-300 dark:border-slate-700 text-left">M<br/><span className="text-[10px] font-normal text-slate-400">메모/준비사항</span></th>
                <th className="w-16 p-2 text-center">관리</th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400 text-xs">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    등록된 일정이 없습니다. 상단의 자연어 입력란에 문장을 적어 일정을 추가해 보세요!
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt, rowIdx) => {
                  const isSelected = selectedIds.has(evt.id);
                  const isRowActive = selectedCell?.rowIdx === rowIdx;

                  return (
                    <tr
                      key={evt.id}
                      className={`hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 transition-colors ${
                        evt.completed ? 'bg-slate-50/60 dark:bg-slate-900/40 text-slate-400' : ''
                      } ${isSelected ? 'bg-emerald-50/70 dark:bg-emerald-950/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="p-2 text-center border-r border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(evt.id)}
                          className="hover:text-emerald-600 text-slate-400"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>

                      {/* Row No (A) */}
                      <td 
                        onClick={() => handleCellClick(rowIdx, 'no')}
                        className={`p-2 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-slate-500 font-medium ${
                          isRowActive && selectedCell?.colKey === 'no' ? 'ring-2 ring-emerald-600 ring-inset' : ''
                        }`}
                      >
                        {rowIdx + 1}
                      </td>

                      {/* Status / Completed (B) */}
                      <td 
                        onClick={() => handleCellClick(rowIdx, 'completed')}
                        className={`p-2 text-center border-r border-slate-200 dark:border-slate-800 ${
                          isRowActive && selectedCell?.colKey === 'completed' ? 'ring-2 ring-emerald-600 ring-inset' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateEvent({ ...evt, completed: !evt.completed })}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            evt.completed 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {evt.completed ? '완료' : '진행'}
                        </button>
                      </td>

                      {/* Title (C) */}
                      <td 
                        onClick={() => handleCellClick(rowIdx, 'title')}
                        onDoubleClick={() => handleStartEdit(evt, 'title')}
                        className={`p-2 border-r border-slate-200 dark:border-slate-800 font-medium text-slate-900 dark:text-slate-100 cursor-pointer ${
                          isRowActive && selectedCell?.colKey === 'title' ? 'ring-2 ring-emerald-600 ring-inset' : ''
                        }`}
                      >
                        {editingCell?.id === evt.id && editingCell?.field === 'title' ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveEdit(evt)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(evt)}
                            className="w-full px-1.5 py-0.5 border border-emerald-500 rounded bg-white dark:bg-slate-900 text-xs focus:outline-none"
                          />
                        ) : (
                          <div className="flex items-center justify-between group">
                            <span className={evt.completed ? 'line-through text-slate-400' : ''}>
                              {evt.title}
                            </span>
                            <Edit3 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </td>

                      {/* Start Date (D) */}
                      <td 
                        onClick={() => handleCellClick(rowIdx, 'startDate')}
                        onDoubleClick={() => handleStartEdit(evt, 'startDate')}
                        className={`p-2 text-center border-r border-slate-200 dark:border-slate-800 font-mono ${
                          isRowActive && selectedCell?.colKey === 'startDate' ? 'ring-2 ring-emerald-600 ring-inset' : ''
                        }`}
                      >
                        {editingCell?.id === evt.id && editingCell?.field === 'startDate' ? (
                          <input
                            type="date"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveEdit(evt)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(evt)}
                            className="w-full px-1 py-0.5 border border-emerald-500 rounded bg-white dark:bg-slate-900 text-xs focus:outline-none"
                          />
                        ) : (
                          <span>{evt.startDate}</span>
                        )}
                      </td>

                      {/* Start Time (E) */}
                      <td 
                        onClick={() => handleCellClick(rowIdx, 'startTime')}
                        onDoubleClick={() => handleStartEdit(evt, 'startTime')}
                        className={`p-2 text-center border-r border-slate-200 dark:border-slate-800 font-mono ${
                          isRowActive && selectedCell?.colKey === 'startTime' ? 'ring-2 ring-emerald-600 ring-inset' : ''
                        }`}
                      >
                        {editingCell?.id === evt.id && editingCell?.field === 'startTime' ? (
                          <input
                            type="time"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveEdit(evt)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(evt)}
                            className="w-full px-1 py-0.5 border border-emerald-500 rounded bg-white dark:bg-slate-900 text-xs focus:outline-none"
                          />
                        ) : (
                          <span>{evt.isAllDay ? '종일' : evt.startTime}</span>
                        )}
                      </td>

                      {/* End Date (F) */}
                      <td 
                        onClick={() => handleCellClick(rowIdx, 'endDate')}
                        onDoubleClick={() => handleStartEdit(evt, 'endDate')}
                        className={`p-2 text-center border-r border-slate-200 dark:border-slate-800 font-mono ${
                          isRowActive && selectedCell?.colKey === 'endDate' ? 'ring-2 ring-emerald-600 ring-inset' : ''
                        }`}
                      >
                        {editingCell?.id === evt.id && editingCell?.field === 'endDate' ? (
                          <input
                            type="date"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveEdit(evt)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(evt)}
                            className="w-full px-1 py-0.5 border border-emerald-500 rounded bg-white dark:bg-slate-900 text-xs focus:outline-none"
                          />
                        ) : (
                          <span>{evt.endDate}</span>
                        )}
                      </td>

                      {/* End Time (G) */}
                      <td 
                        onClick={() => handleCellClick(rowIdx, 'endTime')}
                        onDoubleClick={() => handleStartEdit(evt, 'endTime')}
                        className={`p-2 text-center border-r border-slate-200 dark:border-slate-800 font-mono ${
                          isRowActive && selectedCell?.colKey === 'endTime' ? 'ring-2 ring-emerald-600 ring-inset' : ''
                        }`}
                      >
                        {editingCell?.id === evt.id && editingCell?.field === 'endTime' ? (
                          <input
                            type="time"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveEdit(evt)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(evt)}
                            className="w-full px-1 py-0.5 border border-emerald-500 rounded bg-white dark:bg-slate-900 text-xs focus:outline-none"
                          />
                        ) : (
                          <span>{evt.isAllDay ? '종일' : evt.endTime}</span>
                        )}
                      </td>

                      {/* Duration (H: Calculated Formula) */}
                      <td 
                        onClick={() => handleCellClick(rowIdx, 'duration')}
                        className={`p-2 text-center border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-800/30 ${
                          isRowActive && selectedCell?.colKey === 'duration' ? 'ring-2 ring-emerald-600 ring-inset' : ''
                        }`}
                        title="Excel 수식으로 자동 계산된 소요 시간"
                      >
                        <span className="font-mono">{calculateDuration(evt)}</span>
                      </td>

                      {/* Category (I) */}
                      <td 
                        onClick={() => handleCellClick(rowIdx, 'category')}
                        onDoubleClick={() => handleStartEdit(evt, 'category')}
                        className={`p-2 text-center border-r border-slate-200 dark:border-slate-800 ${
                          isRowActive && selectedCell?.colKey === 'category' ? 'ring-2 ring-emerald-600 ring-inset' : ''
                        }`}
                      >
                        {editingCell?.id === evt.id && editingCell?.field === 'category' ? (
                          <select
                            autoFocus
                            value={editValue}
                            onChange={(e) => {
                              setEditValue(e.target.value);
                              onUpdateEvent({ ...evt, category: e.target.value as EventCategory });
                              setEditingCell(null);
                            }}
                            onBlur={() => setEditingCell(null)}
                            className="w-full px-1 py-0.5 border border-emerald-500 rounded bg-white dark:bg-slate-900 text-xs focus:outline-none"
                          >
                            <option value="업무">업무</option>
                            <option value="회의">회의</option>
                            <option value="약속">약속</option>
                            <option value="개인">개인</option>
                            <option value="운동/건강">운동/건강</option>
                            <option value="기념일">기념일</option>
                            <option value="기타">기타</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${CATEGORY_COLORS[evt.category]?.badge || 'bg-slate-100'}`}>
                            {evt.category}
                          </span>
                        )}
                      </td>

                      {/* Priority (J) */}
                      <td 
                        onClick={() => handleCellClick(rowIdx, 'priority')}
                        onDoubleClick={() => handleStartEdit(evt, 'priority')}
                        className={`p-2 text-center border-r border-slate-200 dark:border-slate-800 ${
                          isRowActive && selectedCell?.colKey === 'priority' ? 'ring-2 ring-emerald-600 ring-inset' : ''
                        }`}
                      >
                        {editingCell?.id === evt.id && editingCell?.field === 'priority' ? (
                          <select
                            autoFocus
                            value={editValue}
                            onChange={(e) => {
                              setEditValue(e.target.value);
                              onUpdateEvent({ ...evt, priority: e.target.value as EventPriority });
                              setEditingCell(null);
                            }}
                            onBlur={() => setEditingCell(null)}
                            className="w-full px-1 py-0.5 border border-emerald-500 rounded bg-white dark:bg-slate-900 text-xs focus:outline-none"
                          >
                            <option value="높음">높음</option>
                            <option value="보통">보통</option>
                            <option value="낮음">낮음</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 font-medium text-[11px] ${PRIORITY_STYLES[evt.priority]?.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_STYLES[evt.priority]?.dot}`} />
                            {evt.priority}
                          </span>
                        )}
                      </td>

                      {/* Location (K) */}
                      <td 
                        onClick={() => handleCellClick(rowIdx, 'location')}
                        onDoubleClick={() => handleStartEdit(evt, 'location')}
                        className={`p-2 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 truncate max-w-[200px] ${
                          isRowActive && selectedCell?.colKey === 'location' ? 'ring-2 ring-emerald-600 ring-inset' : ''
                        }`}
                      >
                        {editingCell?.id === evt.id && editingCell?.field === 'location' ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveEdit(evt)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(evt)}
                            className="w-full px-1.5 py-0.5 border border-emerald-500 rounded bg-white dark:bg-slate-900 text-xs focus:outline-none"
                          />
                        ) : (
                          <span>{evt.location || '-'}</span>
                        )}
                      </td>

                      {/* Participants (L) */}
                      <td 
                        onClick={() => handleCellClick(rowIdx, 'participants')}
                        onDoubleClick={() => handleStartEdit(evt, 'participants')}
                        className={`p-2 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-[180px] ${
                          isRowActive && selectedCell?.colKey === 'participants' ? 'ring-2 ring-emerald-600 ring-inset' : ''
                        }`}
                      >
                        {editingCell?.id === evt.id && editingCell?.field === 'participants' ? (
                          <input
                            type="text"
                            autoFocus
                            placeholder="쉼표로 구분 (예: 김철수, 이영희)"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveEdit(evt)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(evt)}
                            className="w-full px-1.5 py-0.5 border border-emerald-500 rounded bg-white dark:bg-slate-900 text-xs focus:outline-none"
                          />
                        ) : (
                          <span>{evt.participants?.join(', ') || '-'}</span>
                        )}
                      </td>

                      {/* Notes (M) */}
                      <td 
                        onClick={() => handleCellClick(rowIdx, 'notes')}
                        onDoubleClick={() => handleStartEdit(evt, 'notes')}
                        className={`p-2 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-[220px] ${
                          isRowActive && selectedCell?.colKey === 'notes' ? 'ring-2 ring-emerald-600 ring-inset' : ''
                        }`}
                      >
                        {editingCell?.id === evt.id && editingCell?.field === 'notes' ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveEdit(evt)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(evt)}
                            className="w-full px-1.5 py-0.5 border border-emerald-500 rounded bg-white dark:bg-slate-900 text-xs focus:outline-none"
                          />
                        ) : (
                          <span>{evt.notes || '-'}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditFullEvent(evt)}
                            className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="상세 수정 모달"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteEvent(evt.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Excel Summary Footer Row */}
            {filteredEvents.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800/90 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-center">
                  <td className="p-2 border-r border-slate-300 dark:border-slate-700 font-mono">∑</td>
                  <td className="p-2 border-r border-slate-300 dark:border-slate-700 font-mono text-[11px]">=COUNTA</td>
                  <td className="p-2 border-r border-slate-300 dark:border-slate-700 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                    {completedCount} 완료
                  </td>
                  <td className="p-2 border-r border-slate-300 dark:border-slate-700 text-left font-sans text-xs">
                    총 {filteredEvents.length}개 일정
                  </td>
                  <td colSpan={4} className="p-2 border-r border-slate-300 dark:border-slate-700 text-slate-400 font-mono text-[10px]">
                    =SUM(D2:G{filteredEvents.length + 1})
                  </td>
                  <td className="p-2 border-r border-slate-300 dark:border-slate-700 font-mono text-[11px]">
                    -
                  </td>
                  <td className="p-2 border-r border-slate-300 dark:border-slate-700 font-mono text-[11px] text-indigo-600">
                    {categorySummary.length}개 분류
                  </td>
                  <td className="p-2 border-r border-slate-300 dark:border-slate-700 font-mono text-[11px] text-red-600">
                    {highPriorityCount} 중요
                  </td>
                  <td colSpan={4} className="p-2 text-right text-slate-400 font-mono text-[11px] pr-4">
                    [Excel Sheet Formula Active]
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        /* Summary Analysis Sheet Tab */
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                일정 통계 및 카테고리 요약 시트
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                엑셀 파일 내보내기 시 별도의 '통계 및 요약' 워크시트로 자동 포함되는 데이터입니다.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500">전체 등록 일정</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalCount}건</div>
                <div className="text-[10px] text-slate-400 mt-1">=COUNTA(C2:C{totalCount + 1})</div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-emerald-600">완료된 일정</div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{completedCount}건</div>
                <div className="text-[10px] text-emerald-500 mt-1">
                  달성률 {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-blue-600">진행중 (예정)</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">{totalCount - completedCount}건</div>
                <div className="text-[10px] text-blue-500 mt-1">대기 중인 스케줄</div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-red-600">우선순위 높음</div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-400 mt-1">{highPriorityCount}건</div>
                <div className="text-[10px] text-red-500 mt-1">집중 관리 항목</div>
              </div>
            </div>

            {/* Category breakdown table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-800 dark:text-slate-200">
                카테고리별 일정 분포 현황
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-left">
                    <th className="p-3">카테고리</th>
                    <th className="p-3 text-right">일정 수량</th>
                    <th className="p-3 text-right">비율</th>
                    <th className="p-3">분포 바</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {categorySummary.map(([cat, count]) => {
                    const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                    return (
                      <tr key={cat}>
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${CATEGORY_COLORS[cat as EventCategory]?.badge || 'bg-slate-100'}`}>
                            {cat}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-semibold">{count}건</td>
                        <td className="p-3 text-right font-mono text-slate-500">{pct}%</td>
                        <td className="p-3 w-1/3">
                          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Excel Bottom Sheet Tab Bar */}
      <div className="bg-slate-100 dark:bg-slate-800/90 px-3 py-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveSheetTab('master')}
            className={`px-3 py-1 rounded-t-md font-medium flex items-center gap-1.5 transition-colors border-t-2 ${
              activeSheetTab === 'master'
                ? 'bg-white dark:bg-slate-900 text-[#107C41] border-[#107C41] shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>일정_마스터_시트</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSheetTab('summary')}
            className={`px-3 py-1 rounded-t-md font-medium flex items-center gap-1.5 transition-colors border-t-2 ${
              activeSheetTab === 'summary'
                ? 'bg-white dark:bg-slate-900 text-[#107C41] border-[#107C41] shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>통계_및_요약_시트</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
          <span>Excel View Ready</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
            100% 엑셀 호환
          </span>
        </div>
      </div>
    </div>
  );
};
