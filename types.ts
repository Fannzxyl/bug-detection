export interface BugReport {
  line: number;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
}

export interface LogSuggestion {
  line: number;
  suggestion: string;
}

export interface DiscoveredFeature {
  featureId: string;
  name: string;
  status: 'implemented' | 'partial' | 'stub';
  description: string;
  ui: {
    routes: string[];
    components: string[];
  };
  api: {
    endpoints: string[];
  };
  data: {
    models: string[];
  };
  risks: string[];
  evidence: string[];
}

export interface AnalysisResult {
  bugs: BugReport[];
  logs: LogSuggestion[];
  features: DiscoveredFeature[];
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
