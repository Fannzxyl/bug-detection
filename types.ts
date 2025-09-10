export interface BugReport {
  line: number;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
}

export interface LogSuggestion {
  line: number;
  suggestion: string;
}

export interface AnalysisResult {
  bugs: BugReport[];
  logs: LogSuggestion[];
  features: string[];
}

export interface AppError {
    title: string;
    message: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  title: string;
  code: string;
  result: AnalysisResult;
}