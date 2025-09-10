import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import CodeInput from './components/CodeInput';
import AnalysisDisplay from './components/AnalysisDisplay';
import Loader from './components/Loader';
import HistorySidebar from './components/history/HistorySidebar';
import SettingsModal from './components/SettingsModal';
import DebuggerPanel from './components/DebuggerPanel';
import { analyzeCode, GeminiServiceError } from './services/geminiService';
import type { AnalysisResult, AppError, HistoryEntry, DebuggerState } from './types';
import { useHistory } from './components/history/HistoryProvider';
import { useSettings } from './contexts/SettingsContext';

// A simple component to display errors
const ErrorDisplay: React.FC<{ error: AppError; onDismiss: () => void }> = ({ error, onDismiss }) => {
    const { t } = useSettings();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-red-900/80 backdrop-blur-md border border-red-500 text-white rounded-lg shadow-2xl max-w-lg w-full">
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-2 text-red-300">{error.title || t('errorTitle')}</h2>
                    <p className="text-red-200">{error.message}</p>
                </div>
                <div className="px-6 py-3 bg-black/30 text-right">
                    <button onClick={onDismiss} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-md font-semibold transition-colors">
                        {t('errorDismiss')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DEFAULT_CODE = `// Welcome to the Gemini Code Inspector!
// Paste your code here, upload a file, or use this example.
// Then, press "Analyze Code" or Ctrl+Enter.

function calculateTotal(items) {
  let total = 0;
  items.forEach(item => {
    // BUG: This should be multiplication, not addition
    total = item.price + item.quantity; 
  });
  return total;
}

// FEATURE: A simple REST API endpoint using express
import express from 'express';
const app = express();

app.get('/api/users', (req, res) => {
  // LOG_SUGGESTION: Should log when this endpoint is hit
  // RISK: No authentication or validation
  const users = [{ id: 1, name: 'John Doe' }];
  res.json(users);
});
`;

function App() {
  const { language } = useSettings();
  const { addHistoryEntry } = useHistory();
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Debugger state
  const [isDebugging, setIsDebugging] = useState(false);
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [debuggerState, setDebuggerState] = useState<DebuggerState>({
      isPaused: false,
      scope: null,
      activeLine: -1,
      consoleOutput: [],
      isFinished: false,
  });

  const handleAnalyze = useCallback(async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeCode(code, language);
      setAnalysisResult(result);
      addHistoryEntry({
        title: fileName || `Analysis of ${code.slice(0, 30)}...`,
        code,
        result,
      });
    } catch (e) {
      if (e instanceof GeminiServiceError) {
        setError({ title: 'Analysis Failed', message: e.message });
      } else if (e instanceof Error) {
        setError({ title: 'An Unexpected Error Occurred', message: e.message });
      } else {
        setError({ title: 'An Unknown Error Occurred', message: String(e) });
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, language, addHistoryEntry, fileName]);
  
  const handleDebug = () => {
    // Placeholder for actual debugging logic
    setIsDebugging(true);
    setAnalysisResult(null); // Clear analysis results when debugging
    setDebuggerState({
      isPaused: true,
      scope: { message: "Debugger is not fully implemented.", advice: "This is a UI placeholder." },
      activeLine: 5, // Example line
      consoleOutput: ["Debugger started.", "Execution paused at breakpoint on line 5."],
      isFinished: false,
    });
  };
  
  const handleStopDebug = () => {
      setIsDebugging(false);
      // Reset debugger state
      setDebuggerState({
          isPaused: false, scope: null, activeLine: -1, consoleOutput: [], isFinished: false
      });
  };

  const handleToggleBreakpoint = (line: number) => {
      setBreakpoints(prev => {
          const newBreakpoints = new Set(prev);
          if (newBreakpoints.has(line)) {
              newBreakpoints.delete(line);
          } else {
              newBreakpoints.add(line);
          }
          return newBreakpoints;
      });
  };

  const handleFileLoad = (content: string, name: string) => {
    setCode(content);
    setFileName(name);
    setAnalysisResult(null);
  };
  
  const handleClear = () => {
    setCode('');
    setFileName(null);
    setAnalysisResult(null);
    setError(null);
  };

  const handleSelectHistory = useCallback((entry: HistoryEntry) => {
    setCode(entry.code);
    setAnalysisResult(entry.result);
    setFileName(entry.title.startsWith('Analysis of') ? null : entry.title);
    setIsHistoryOpen(false);
    setError(null);
    if(isDebugging) handleStopDebug();
  }, [isDebugging]);
  
  // Keyboard shortcut for closing modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isHistoryOpen) setIsHistoryOpen(false);
        if (isSettingsOpen) setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHistoryOpen, isSettingsOpen]);

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      <Header
        onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
      />

      <main className="container mx-auto p-4 sm:p-6 space-y-6">
        <CodeInput
          code={code}
          setCode={setCode}
          onAnalyze={handleAnalyze}
          onDebug={handleDebug}
          isLoading={isLoading}
          fileName={fileName}
          onFileLoad={handleFileLoad}
          onClear={handleClear}
          isDebugging={isDebugging}
          breakpoints={breakpoints}
          onToggleBreakpoint={handleToggleBreakpoint}
          activeLine={debuggerState.activeLine}
        />

        {isDebugging && (
            <DebuggerPanel 
                state={debuggerState}
                onContinue={() => alert('Continue clicked (not implemented)')}
                onStep={() => alert('Step Over clicked (not implemented)')}
                onStop={handleStopDebug}
            />
        )}

        {isLoading && <Loader />}
        {error && <ErrorDisplay error={error} onDismiss={() => setError(null)} />}
        
        {analysisResult && !isDebugging && <AnalysisDisplay result={analysisResult} />}
      </main>

      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={handleSelectHistory}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
