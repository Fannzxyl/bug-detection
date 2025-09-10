import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import CodeInput from './components/CodeInput';
import AnalysisDisplay from './components/AnalysisDisplay';
import Loader from './components/Loader';
import HistorySidebar from './components/history/HistorySidebar';
import SettingsModal from './components/SettingsModal';
import { analyzeCode, GeminiServiceError } from './services/geminiService';
import { useHistory } from './components/history/HistoryProvider';
import { useSettings } from './contexts/SettingsContext';
import type { AnalysisResult, AppError, HistoryEntry } from './types';

function App() {
  const [code, setCode] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const { addHistoryEntry } = useHistory();
  const { t, language } = useSettings();

  const handleAnalyze = useCallback(async () => {
    if (!code.trim()) {
      setError({
        title: t('errorInputMissingTitle'),
        message: t('errorInputMissingMessage'),
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeCode(code, language);
      setAnalysisResult(result);
      addHistoryEntry({
        title: fileName || `${t('analysisResultTitlePrefix')} ${new Date().toLocaleString()}`,
        code,
        result,
      });
    } catch (e) {
      if (e instanceof GeminiServiceError) {
         if (e.message.includes('API key is not valid')) {
            setError({ title: t('errorAuthTitle'), message: e.message });
         } else if (e.message.includes('network error')) {
            setError({ title: t('errorNetworkTitle'), message: e.message });
         } else if (e.message.includes('Failed to parse')) {
            setError({ title: t('errorInvalidResponseTitle'), message: e.message });
         } else {
            setError({ title: t('errorAnalysisTitle'), message: e.message });
         }
      } else {
        setError({
          title: t('errorUnexpectedTitle'),
          message: `${t('errorUnexpectedMessage')} ${e instanceof Error ? e.message : ''}`,
        });
        console.error(e);
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, language, addHistoryEntry, fileName, t]);

  const handleFileLoad = (fileContent: string, name: string) => {
    setCode(fileContent);
    setFileName(name);
    setAnalysisResult(null);
    setError(null);
  };

  const handleClear = () => {
    setCode('');
    setFileName(null);
    setAnalysisResult(null);
    setError(null);
  };
  
  const handleHistorySelect = (entry: HistoryEntry) => {
    setCode(entry.code);
    setAnalysisResult(entry.result);
    setFileName(entry.title.startsWith(t('analysisResultTitlePrefix')) ? null : entry.title);
    setError(null);
    setIsHistoryOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'h') {
        event.preventDefault();
        setIsHistoryOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  return (
    <div className="flex flex-col h-screen font-sans">
      <Header
        onToggleHistory={() => setIsHistoryOpen(true)}
        onToggleSettings={() => setIsSettingsOpen(true)}
      />
      <main className="flex-grow container mx-auto p-4 flex flex-col gap-6 overflow-y-auto">
        <div className="text-center mt-4">
            <p className="text-gray-400 max-w-2xl mx-auto">{t('appDescription')}</p>
        </div>

        {error && (
            <div 
              className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 text-red-300 p-4 rounded-lg shadow-lg" 
              role="alert"
            >
                <p className="font-bold text-red-200">{error.title}</p>
                <p>{error.message}</p>
            </div>
        )}

        <CodeInput
          code={code}
          setCode={setCode}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          fileName={fileName}
          onFileLoad={handleFileLoad}
          onClear={handleClear}
        />
        
        {isLoading && <Loader />}
        
        {analysisResult && <AnalysisDisplay result={analysisResult} />}

      </main>
      <footer className="text-center p-4 text-sm text-gray-500 border-t border-white/10">
        {t('footerText')}
      </footer>
      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} onSelect={handleHistorySelect} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
