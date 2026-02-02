import { openai } from './openai';
import { ParsedTask } from '@/types/nlTask';

function getKoreanDayName(dayIndex: number): string {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return days[dayIndex];
}

function buildSystemPrompt(): string {
  const now = new Date();
  const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

  const currentDate = koreaTime.toISOString().split('T')[0];
  const currentTime = koreaTime.toTimeString().slice(0, 5);
  const dayOfWeek = getKoreanDayName(koreaTime.getDay());

  return `You are a task parser for a Korean productivity app. Extract task information from natural language input.

Today's date: ${currentDate} (format: YYYY-MM-DD)
Current time: ${currentTime} (format: HH:MM, 24-hour)
Day of week: ${dayOfWeek}

IMPORTANT RULES:
1. Title should be concise but descriptive (remove time/date info from title)
2. Priority mapping:
   - "중요", "급함", "높은 우선순위", "high", "중요한", "급한" → "high"
   - "낮은 우선순위", "나중에", "여유있게", "low" → "low"
   - Default → "mid"
3. Date parsing (use ${currentDate} as reference):
   - "오늘" → today's date
   - "내일" → tomorrow's date
   - "모레" → day after tomorrow
   - "이번주 금요일" → this week's Friday
   - "다음주 월요일" → next week's Monday
   - Specific date → parse to YYYY-MM-DD
   - If no date specified, use today's date
4. Time parsing:
   - "오후 3시" → "15:00"
   - "3시 반", "3시 30분" → "15:30" (assume PM for times 1-6, AM for 7-11)
   - "아침 9시" → "09:00"
   - "저녁 7시" → "19:00"
   - If duration mentioned (e.g., "30분 동안"), calculate scheduledEndTime
5. If information is ambiguous or uncertain, set confidence lower (0.5-0.7)
6. If input is clear and complete, set confidence high (0.9-1.0)

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "title": "string",
  "description": null,
  "scheduledDate": "YYYY-MM-DD",
  "scheduledTime": "HH:MM or null",
  "scheduledEndTime": "HH:MM or null",
  "priority": "high" | "mid" | "low",
  "confidence": 0.0-1.0
}`;
}

function validateAndNormalize(parsed: unknown): ParsedTask {
  const data = parsed as Record<string, unknown>;

  // 기본값 설정
  const result: ParsedTask = {
    title: String(data.title || '').trim(),
    description: data.description ? String(data.description) : null,
    scheduledDate: null,
    scheduledTime: null,
    scheduledEndTime: null,
    priority: 'mid',
    confidence: 0.5,
  };

  // 날짜 검증 (YYYY-MM-DD)
  if (typeof data.scheduledDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.scheduledDate)) {
    result.scheduledDate = data.scheduledDate;
  }

  // 시간 검증 (HH:MM)
  if (typeof data.scheduledTime === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(data.scheduledTime)) {
    result.scheduledTime = data.scheduledTime;
  }

  if (typeof data.scheduledEndTime === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(data.scheduledEndTime)) {
    result.scheduledEndTime = data.scheduledEndTime;
  }

  // 우선순위 검증
  if (data.priority === 'high' || data.priority === 'mid' || data.priority === 'low') {
    result.priority = data.priority;
  }

  // 신뢰도 검증
  if (typeof data.confidence === 'number' && data.confidence >= 0 && data.confidence <= 1) {
    result.confidence = data.confidence;
  }

  return result;
}

export async function parseNaturalLanguage(input: string): Promise<ParsedTask> {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    throw new Error('입력이 비어있습니다');
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: `Parse this Korean task input: "${trimmedInput}"` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error('AI 응답이 비어있습니다');
  }

  const parsed = JSON.parse(content);
  return validateAndNormalize(parsed);
}
