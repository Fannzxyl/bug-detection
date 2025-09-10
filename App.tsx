import React, { useState, useCallback, useEffect, useRef } from 'react';
import Interpreter from 'https://esm.sh/js-interpreter@1.4.1';
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
// Click on a line number to set a breakpoint, then press "Debug".

function calculateTotal(items) {
  let total = 0;
  items.forEach(item => {
    total = item.price * item.quantity; 
    console.log('Calculating for:', item.name, 'New total:', total);
  });
  return total;
}

const myItems = [
    { name: 'Laptop', price: 1200, quantity: 1 },
    { name: 'Mouse', price: 25, quantity: 2 },
    { name: 'Keyboard', price: 75, quantity: 1 }
];

const finalTotal = calculateTotal(myItems);
console.log('Final Total:', finalTotal);
`;

function App() {
  const { language, t } = useSettings();
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
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set([10]));
  const [debuggerState, setDebuggerState] = useState<DebuggerState>({
      isPaused: false,
      scope: null,
      activeLine: -1,
      consoleOutput: [],
      isFinished: false,
  });
  
  const interpreterRef = useRef<any>(null);

  const handleAnalyze = useCallback(async () => {
    if (!code.trim() || isDebugging) return;

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
  }, [code, language, addHistoryEntry, fileName, isDebugging]);

  // --- DEBUGGER LOGIC ---
  const initInterpreter = useCallback(() => {
    // Function to be called by the interpreter for console.log
    const initFunc = (interpreter: any, globalObject: any) => {
        const consoleWrapper = interpreter.nativeToPseudo(
            (text: any) => {
                const message = String(text);
                setDebuggerState(prev => ({...prev, consoleOutput: [...prev.consoleOutput, message]}));
                return interpreter.nativeToPseudo(undefined);
            }
        );
        interpreter.setProperty(globalObject, 'console.log', consoleWrapper);
    };

    try {
      const newInterpreter = new Interpreter(code, initFunc);
      interpreterRef.current = newInterpreter;
      setDebuggerState({
          isPaused: true,
          scope: null,
          activeLine: -1,
          consoleOutput: [t('debuggerConsoleStart')],
          isFinished: false,
      });
      return true;
    } catch (e: any) {
        setError({ title: "Syntax Error", message: `Failed to start debugger: ${e.message}` });
        setIsDebugging(false);
        return false;
    }
  }, [code, t]);
  
  const getInterpreterScope = () => {
      if (!interpreterRef.current || !interpreterRef.current.getScope) {
          return null;
      }
      const scope = interpreterRef.current.getScope();
      const scopeVariables: { [key: string]: any } = {};

      let currentScope = scope;
      while (currentScope) {
          const properties = Object.getOwnPropertyNames(currentScope.properties);
          properties.forEach(prop => {
              if (!(prop in scopeVariables)) { // Avoid overwriting variables from inner scopes
                  const value = interpreterRef.current.pseudoToNative(currentScope.properties[prop]);
                  // Limit depth to avoid circular references and huge objects
                  scopeVariables[prop] = JSON.parse(JSON.stringify(value, (key, value) => {
                    return value;
                  }, 2));
              }
          });
          currentScope = currentScope.parentScope;
      }
      return scopeVariables;
  };

  const runInterpreter = useCallback((stepMode = false) => {
    if (!interpreterRef.current || debuggerState.isFinished) return;

    let hasMoreCode = true;
    let steps = 0;
    const maxSteps = 50000; // Safety break to prevent infinite loops

    while(hasMoreCode) {
        try {
            hasMoreCode = interpreterRef.current.step();
            const node = interpreterRef.current.stateStack[interpreterRef.current.stateStack.length - 1]?.node;
            
            if (node) {
              const activeLine = node.loc.start.line;
              if (activeLine !== debuggerState.activeLine) {
                 if (!stepMode && breakpoints.has(activeLine) && steps > 0) {
                     setDebuggerState(prev => ({ ...prev, isPaused: true, activeLine, scope: getInterpreterScope() }));
                     return;
                 }
                 if(stepMode) {
                     setDebuggerState(prev => ({ ...prev, isPaused: true, activeLine, scope: getInterpreterScope() }));
                     return;
                 }
              }
            }
        } catch (e: any) {
            setDebuggerState(prev => ({ ...prev, consoleOutput: [...prev.consoleOutput, `ERROR: ${e.message}`], isFinished: true, isPaused: true }));
            return;
        }

        if (steps++ > maxSteps) {
          setDebuggerState(prev => ({ ...prev, consoleOutput: [...prev.consoleOutput, "ERROR: Max execution steps exceeded. Possible infinite loop."], isFinished: true, isPaused: true }));
          return;
        }

        if (!hasMoreCode) {
          setDebuggerState(prev => ({ ...prev, isFinished: true, isPaused: true, activeLine: -1, scope: getInterpreterScope() }));
        }
    }
  }, [breakpoints, debuggerState.activeLine, debuggerState.isFinished]);

  const handleDebug = () => {
    setIsDebugging(true);
    setAnalysisResult(null);
    if(initInterpreter()) {
      // Small timeout to allow state to update before running
      setTimeout(() => runInterpreter(false), 10);
    }
  };

  const handleStopDebug = () => {
      setIsDebugging(false);
      interpreterRef.current = null;
      setDebuggerState({ isPaused: false, scope: null, activeLine: -1, consoleOutput: [], isFinished: false });
  };
  
  const handleContinue = () => {
      setDebuggerState(prev => ({...prev, isPaused: false}));
      setTimeout(() => runInterpreter(false), 0);
  };
  
  const handleStep = () => {
      runInterpreter(true);
  };

  const handleRestartDebug = () => {
    if (initInterpreter()) {
      setTimeout(() => runInterpreter(false), 10);
    }
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
  
  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isHistoryOpen) setIsHistoryOpen(false);
        if (isSettingsOpen) setIsSettingsOpen(false);
        if (isDebugging) handleStopDebug();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHistoryOpen, isSettingsOpen, isDebugging]);

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
                onContinue={handleContinue}
                onStep={handleStep}
                onStop={handleStopDebug}
                onRestart={handleRestartDebug}
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