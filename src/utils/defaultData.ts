import { ScheduleEvent } from '../types/schedule';

// Helper to format date string
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getDefaultEvents(): ScheduleEvent[] {
  const today = new Date();
  const d0 = new Date(today);
  const d1 = new Date(today);
  d1.setDate(d1.getDate() + 1);
  const d2 = new Date(today);
  d2.setDate(d2.getDate() + 2);
  const d4 = new Date(today);
  d4.setDate(d4.getDate() + 4);
  const d6 = new Date(today);
  d6.setDate(d6.getDate() + 6);

  return [
    {
      id: 'evt-1',
      title: '주간 팀 스프린트 킥오프 회의',
      startDate: formatDate(d0),
      startTime: '10:00',
      endDate: formatDate(d0),
      endTime: '11:30',
      isAllDay: false,
      location: '본사 대회의실 3호 (또는 Google Meet)',
      participants: ['김부장', '이지은', '박민우'],
      category: '회의',
      priority: '높음',
      notes: '스마트 스케줄러 기능 명세 및 배포 일정 점검',
      completed: false,
      createdAt: new Date().toISOString(),
      aiReasoning: '오늘 오전 10시 팀 킥오프 회의 1시간 30분 일정으로 생성',
      rawInput: '오늘 오전 10시에 대회의실에서 팀 스프린트 회의 1시간 반 동안 진행'
    },
    {
      id: 'evt-2',
      title: '고객사 솔루션 도입 데모 시연',
      startDate: formatDate(d1),
      startTime: '14:00',
      endDate: formatDate(d1),
      endTime: '15:30',
      isAllDay: false,
      location: '강남구 테헤란로 위워크 7층',
      participants: ['최이사', '한팀장'],
      category: '업무',
      priority: '높음',
      notes: '제품 브로슈어 및 엑셀 일정 연동 프레젠테이션 준비',
      completed: false,
      createdAt: new Date().toISOString(),
      aiReasoning: '내일 오후 2시 고객사 데모 시연 1시간 30분으로 해석',
      rawInput: '내일 오후 2시 테헤란로 위워크에서 고객사 데모 시연'
    },
    {
      id: 'evt-3',
      title: '치과 정기 스케일링 및 구강 검진',
      startDate: formatDate(d2),
      startTime: '16:00',
      endDate: formatDate(d2),
      endTime: '16:50',
      isAllDay: false,
      location: '서울밝은치과의원 (역삼역 3번 출구)',
      participants: [],
      category: '운동/건강',
      priority: '보통',
      notes: '예약 확인 문자 확인 및 건강보험증 지참',
      completed: false,
      createdAt: new Date().toISOString(),
      aiReasoning: '모레 오후 4시 치과 검진 예약 50분 소요로 분석',
      rawInput: '모레 오후 4시 역삼역 서울밝은치과 정기 검진'
    },
    {
      id: 'evt-4',
      title: '개발팀 동료 분기 회식',
      startDate: formatDate(d4),
      startTime: '19:00',
      endDate: formatDate(d4),
      endTime: '21:30',
      isAllDay: false,
      location: '교대역 맛있는 삼겹살 본점',
      participants: ['팀원 전원 (8명)'],
      category: '약속',
      priority: '보통',
      notes: '법인카드 사전 승인 요청 완료, 예약자명 김철수',
      completed: false,
      createdAt: new Date().toISOString(),
      aiReasoning: '이번 주 금요일 저녁 7시 삼겹살 회식 2시간 30분 파싱',
      rawInput: '이번 주 금요일 저녁 7시 교대역 삼겹살집 회식'
    },
    {
      id: 'evt-5',
      title: '피트니스 PT 세션 (하체 근력)',
      startDate: formatDate(d6),
      startTime: '09:00',
      endDate: formatDate(d6),
      endTime: '10:00',
      isAllDay: false,
      location: '에이블짐 헬스장',
      participants: ['이강사 트레이너'],
      category: '운동/건강',
      priority: '낮음',
      notes: '운동화, 물병 지참',
      completed: false,
      createdAt: new Date().toISOString(),
      aiReasoning: '주말 아침 9시 개인 운동 1시간 설정',
      rawInput: '주말 아침 9시 헬스장 PT 1시간'
    }
  ];
}
