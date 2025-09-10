import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import CodeInput from './components/CodeInput';
import AnalysisDisplay from './components/AnalysisDisplay';
import Loader from './components/Loader';
import { analyzeCode } from './services/geminiService';
import { GeminiServiceError } from './services/geminiService';
import type { AnalysisResult, AppError, HistoryEntry } from './types';
import { useHistory } from './components/history/HistoryProvider';
import HistorySidebar from './components/history/HistorySidebar';

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);
  const [code, setCode] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  const { addHistoryEntry } = useHistory();

  const handleCodeChange = (newCode: string, newFileName: string | null) => {
    setCode(newCode);
    setFileName(newFileName);
  };

  const handleAnalyze = useCallback(async () => {
    if (!code.trim()) {
      setError({
        title: 'Input Missing',
        message: 'Please enter some code or upload a file to analyze.'
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeCode(code);
      setAnalysisResult(result);
      
      addHistoryEntry({
        title: fileName || `Analysis of ${code.substring(0, 40).split('\n')[0]}...`,
        code,
        result,
      });

    } catch (err) {
      console.error('Analysis failed:', err);

      if (err instanceof GeminiServiceError) {
        if (/API key/i.test(err.message)) {
          setError({ title: 'Authentication Error', message: err.message });
        } else if (/network|fetch/i.test(err.message)) {
          setError({ title: 'Network Error', message: err.message });
        } else if (/parse|format|missing fields/i.test(err.message)) {
          setError({ title: 'Invalid Response', message: err.message });
        } else {
          setError({ title: 'Analysis Error', message: err.message });
        }
      } else {
        setError({
          title: 'An Unexpected Error Occurred',
          message: err instanceof Error ? err.message : 'Please check the console for more details.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, fileName, addHistoryEntry]);

  const handleSelectHistoryEntry = (entry: HistoryEntry) => {
    setCode(entry.code);
    setFileName(entry.title.startsWith('Analysis of') ? null : entry.title);
    setAnalysisResult(entry.result);
    setError(null);
    setIsLoading(false);
  };

  const toggleHistory = useCallback(() => setIsHistoryOpen(prev => !prev), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
        event.preventDefault();
        toggleHistory();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleHistory]);

  return (
    <div className="relative min-h-screen bg-gray-900 text-gray-200 font-sans overflow-x-hidden">
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectEntry={handleSelectHistoryEntry}
      />
      <div className={`transition-transform duration-300 ease-in-out ${isHistoryOpen ? 'sm:translate-x-80' : ''}`}>
        <Header onToggleHistory={toggleHistory} />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-gray-400 mb-8">
              Paste your code or upload a file below. Our AI will analyze it for bugs, suggest logging improvements, and summarize its features.
            </p>

            <CodeInput
              code={code}
              fileName={fileName}
              onCodeChange={handleCodeChange}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
            />

            {error && (
              <div className="mt-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                <strong className="font-bold block text-red-100 mb-1">{error.title}</strong>
                <span className="block sm:inline">{error.message}</span>
              </div>
            )}

            {isLoading && <Loader />}

            {analysisResult && !isLoading && (
              <div className="mt-8">
                <AnalysisDisplay result={analysisResult} />
              </div>
            )}
          </div>
        </main>
        <footer className="text-center py-6 text-gray-500 text-sm">
          <p>Powered by Google Gemini. Built by a world-class senior frontend React engineer.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;