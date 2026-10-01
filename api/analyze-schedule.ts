import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { events } = req.body as { events?: unknown[] };
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: '일정 목록이 필요합니다.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `다음 일정 목록을 검토하고 일정 간 충돌 분석, 최적의 일정 관리 팁, 주간 브리핑 요약을 제공해 주세요.\n일정 데이터:\n${JSON.stringify(events, null, 2)}`,
      config: {
        systemInstruction: `당신은 최고 수준의 개인 비서 겸 일정 컨설턴트입니다.
사용자의 전체 일정을 분석하여:
1. 시간 중복/충돌이 있는 일정 파악
2. 가장 바쁜 날이나 주의할 시간대
3. 효율적인 시간 활용 및 휴식 팁
4. 엑셀 관리 팁
을 깔끔하고 읽기 쉬운 한국어 마크다운 또는 불릿 포인트로 작성하세요.`,
      },
    });

    return res.json({ analysis: response.text });
  } catch (error: any) {
    console.error('Schedule analysis error:', error);
    return res.status(500).json({
      error: error.message || '일정 분석 중 오류가 발생했습니다.',
    });
  }
}
