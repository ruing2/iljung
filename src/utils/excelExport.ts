import * as XLSX from 'xlsx';
import { ScheduleEvent } from '../types/schedule';

export function calculateDuration(event: ScheduleEvent): string {
  if (event.isAllDay) return '종일';
  try {
    const start = new Date(`${event.startDate}T${event.startTime}:00`);
    const end = new Date(`${event.endDate}T${event.endTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    if (isNaN(diffMs) || diffMs <= 0) return '1시간';
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    
    if (hours > 0 && remainingMins > 0) {
      return `${hours}시간 ${remainingMins}분`;
    } else if (hours > 0) {
      return `${hours}시간`;
    } else {
      return `${remainingMins}분`;
    }
  } catch {
    return '1시간';
  }
}

export function exportToExcel(events: ScheduleEvent[], fileName = '스마트_일정_목록.xlsx') {
  const wb = XLSX.utils.book_new();

  // 1. Main schedule sheet
  const rows = events.map((evt, idx) => ({
    '순번': idx + 1,
    '상태': evt.completed ? '완료' : '진행중',
    '일정명': evt.title,
    '시작일자': evt.startDate,
    '시작시간': evt.isAllDay ? '종일' : evt.startTime,
    '종료일자': evt.endDate,
    '종료시간': evt.isAllDay ? '종일' : evt.endTime,
    '소요시간': calculateDuration(evt),
    '카테고리': evt.category,
    '우선순위': evt.priority,
    '장소': evt.location || '-',
    '참석자': evt.participants?.join(', ') || '-',
    '메모 및 준비물': evt.notes || '-',
    'AI 해석 근거': evt.aiReasoning || '-',
    '원본 입력문장': evt.rawInput || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 6 },  // 순번
    { wch: 8 },  // 상태
    { wch: 26 }, // 일정명
    { wch: 12 }, // 시작일자
    { wch: 10 }, // 시작시간
    { wch: 12 }, // 종료일자
    { wch: 10 }, // 종료시간
    { wch: 12 }, // 소요시간
    { wch: 12 }, // 카테고리
    { wch: 10 }, // 우선순위
    { wch: 24 }, // 장소
    { wch: 18 }, // 참석자
    { wch: 32 }, // 메모 및 준비물
    { wch: 36 }, // AI 해석 근거
    { wch: 36 }, // 원본 입력문장
  ];

  XLSX.utils.book_append_sheet(wb, ws, '일정 마스터 시트');

  // 2. Summary stats sheet
  const total = events.length;
  const completed = events.filter(e => e.completed).length;
  const highPriority = events.filter(e => e.priority === '높음').length;

  const categoryStats: Record<string, number> = {};
  events.forEach(e => {
    categoryStats[e.category] = (categoryStats[e.category] || 0) + 1;
  });

  const summaryRows = [
    { '항목': '총 일정 수', '수량': total, '비고': '전체 등록 건수' },
    { '항목': '완료된 일정', '수량': completed, '비고': `${total > 0 ? Math.round((completed / total) * 100) : 0}% 달성` },
    { '항목': '진행중 일정', '수량': total - completed, '비고': '미완료 일정' },
    { '항목': '우선순위 높음', '수량': highPriority, '비고': '집중 관리 필요' },
    { '항목': '---', '수량': 0, '비고': '---' },
    ...Object.entries(categoryStats).map(([cat, count]) => ({
      '항목': `카테고리: ${cat}`,
      '수량': count,
      '비고': `${Math.round((count / (total || 1)) * 100)}% 비율`
    }))
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, '통계 및 요약');

  // Write and trigger download
  XLSX.writeFile(wb, fileName);
}

export function exportToCSV(events: ScheduleEvent[], fileName = '스마트_일정_목록.csv') {
  const headers = [
    '순번', '상태', '일정명', '시작일자', '시작시간', '종료일자', '종료시간',
    '소요시간', '카테고리', '우선순위', '장소', '참석자', '메모 및 준비물'
  ];

  const escapeCSV = (val: any) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = events.map((e, idx) => [
    idx + 1,
    e.completed ? '완료' : '진행중',
    escapeCSV(e.title),
    e.startDate,
    e.isAllDay ? '종일' : e.startTime,
    e.endDate,
    e.isAllDay ? '종일' : e.endTime,
    escapeCSV(calculateDuration(e)),
    escapeCSV(e.category),
    escapeCSV(e.priority),
    escapeCSV(e.location || ''),
    escapeCSV(e.participants?.join(', ') || ''),
    escapeCSV(e.notes || '')
  ].join(','));

  // Prepend UTF-8 BOM (\uFEFF) for Excel Korean support
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyToClipboardAsTSV(events: ScheduleEvent[]): boolean {
  const headers = [
    '순번', '상태', '일정명', '시작일자', '시작시간', '종료일자', '종료시간',
    '소요시간', '카테고리', '우선순위', '장소', '참석자', '메모'
  ];

  const rows = events.map((e, idx) => [
    idx + 1,
    e.completed ? '완료' : '진행중',
    e.title,
    e.startDate,
    e.isAllDay ? '종일' : e.startTime,
    e.endDate,
    e.isAllDay ? '종일' : e.endTime,
    calculateDuration(e),
    e.category,
    e.priority,
    e.location || '',
    e.participants?.join(', ') || '',
    e.notes || ''
  ].join('\t'));

  const tsv = [headers.join('\t'), ...rows].join('\n');
  navigator.clipboard.writeText(tsv);
  return true;
}
