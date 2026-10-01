import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API: Parse natural language sentence into structured schedule events
app.post('/api/parse-schedule', async (req, res) => {
  try {
    const { text, referenceTime } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: '일정 문장을 입력해 주세요.' });
    }

    const currentRefTime = referenceTime || new Date().toISOString();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `사용자가 입력한 자연어 문장에서 일정 정보를 정밀하게 추출하고 구조화해 주세요.
기준 현재 일시: ${currentRefTime}
사용자 입력 문장:
"${text.trim()}"`,
      config: {
        systemInstruction: `당신은 사용자의 한국어 자연어 문장을 분석하여 정밀한 일정 데이터(스케줄)로 변환해 주는 스케줄링 AI 엔진입니다.
규칙:
1. "내일", "모레", "다음 주 화요일", "이번 주말", "오늘 저녁" 등의 상대적 시간 표현은 기준 현재 일시(${currentRefTime})를 바탕으로 정확한 YYYY-MM-DD로 계산해야 합니다.
2. 시간이 명시되지 않은 일정(예: "내일 은행 업무 보기")은 isAllDay: true로 처리하거나 기본 업무 시간(예: 09:00~10:00)을 제안하세요.
3. 시작 시간만 있고 종료 시간이 명시되지 않은 경우(예: "오후 3시 미팅") 통상 1시간 후(16:00)를 종료 시간으로 설정하세요.
4. 문장에 여러 일정이 함께 언급된 경우(예: "내일 2시 회의하고 다음 주 월요일 오전 9시 보고서 제출"), 각각을 분리하여 events 배열의 개별 객체로 추출하세요.
5. 장소(location), 참석자(participants), 준비물/메모(notes), 카테고리(category: '업무', '회의', '약속', '개인', '운동/건강', '기념일', '기타'), 우선순위(priority: '높음', '보통', '낮음')를 문맥에 맞게 지능적으로 추론하세요.
6. reasoning 필드에는 사용자가 한눈에 알아볼 수 있도록 어떻게 시간을 계산했고 일정을 도출했는지 1~2문장의 친절한 한국어 설명을 작성하세요.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN },
            reasoning: { 
              type: Type.STRING, 
              description: 'AI가 문장을 해석한 요약 해설 (예: "‘내일 오후 3시’를 2026-10-01 15:00으로 해석하여 1시간 동안의 팀 회의 일정을 생성했습니다.")' 
            },
            events: {
              type: Type.ARRAY,
              description: '추출된 일정 목록',
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: '일정 제목' },
                  startDate: { type: Type.STRING, description: '시작 일자 (YYYY-MM-DD)' },
                  startTime: { type: Type.STRING, description: '시작 시간 (HH:mm, 24시간 형식)' },
                  endDate: { type: Type.STRING, description: '종료 일자 (YYYY-MM-DD)' },
                  endTime: { type: Type.STRING, description: '종료 시간 (HH:mm, 24시간 형식)' },
                  isAllDay: { type: Type.BOOLEAN, description: '종일 일정 여부' },
                  location: { type: Type.STRING, description: '장소 또는 회의실/온라인 링크 (없으면 빈 문자열)' },
                  participants: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '참석자 이름 목록'
                  },
                  category: {
                    type: Type.STRING,
                    description: '업무, 회의, 약속, 개인, 운동/건강, 기념일, 기타 중 택 1'
                  },
                  priority: {
                    type: Type.STRING,
                    description: '높음, 보통, 낮음 중 택 1'
                  },
                  notes: { type: Type.STRING, description: '준비물, 안건 등 메모 사항' }
                },
                required: ['title', 'startDate', 'startTime', 'endDate', 'endTime', 'category', 'priority']
              }
            }
          },
          required: ['success', 'reasoning', 'events']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Schedule parse error:', error);
    return res.status(500).json({
      error: error.message || '일정 파싱 중 오류가 발생했습니다.'
    });
  }
});

// API: AI schedule optimization & advice
app.post('/api/analyze-schedule', async (req, res) => {
  try {
    const { events } = req.body;
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: '일정 목록이 필요합니다.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `다음 일정 목록을 검토하고 일정 간 충돌 분석, 최적의 일정 관리 팁, 주간 브리핑 요약을 제공해 주세요.
일정 데이터:
${JSON.stringify(events, null, 2)}`,
      config: {
        systemInstruction: `당신은 최고 수준의 개인 비서 겸 일정 컨설턴트입니다.
사용자의 전체 일정을 분석하여:
1. 시간 중복/충돌이 있는 일정 파악
2. 가장 바쁜 날이나 주의할 시간대
3. 효율적인 시간 활용 및 휴식 팁
4. 엑셀 관리 팁
을 깔끔하고 읽기 쉬운 한국어 마크다운 또는 불릿 포인트로 작성하세요.`,
      }
    });

    return res.json({ analysis: response.text });
  } catch (error: any) {
    console.error('Schedule analysis error:', error);
    return res.status(500).json({
      error: error.message || '일정 분석 중 오류가 발생했습니다.'
    });
  }
});

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
