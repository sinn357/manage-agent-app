export interface ParsedTask {
  title: string;
  description: string | null;
  scheduledDate: string | null; // YYYY-MM-DD
  scheduledTime: string | null; // HH:MM
  scheduledEndTime: string | null; // HH:MM
  priority: 'high' | 'mid' | 'low';
  confidence: number; // 0.0 - 1.0
}

export interface NLParseResponse {
  success: true;
  parsed: ParsedTask;
  rawInput: string;
}

export interface NLParseError {
  success: false;
  error: string;
  code: 'RATE_LIMIT' | 'QUOTA_EXCEEDED' | 'PARSE_ERROR' | 'INVALID_INPUT';
}

export type NLParseResult = NLParseResponse | NLParseError;
