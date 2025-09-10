import React, { useRef, useCallback, useEffect, useState } from 'react';
import { AnalyzeIcon, ClearIcon, UploadIcon, DebugIcon } from './Icon';
import { useSettings } from '../contexts/SettingsContext';

interface CodeInputProps {
  code: string;
  setCode: (code: string) => void;
  onAnalyze: () => void;
  onDebug: () => void;
  isLoading: boolean;
  fileName: string | null;
  onFileLoad: (content: string, name:string) => void;
  onClear: () => void;
  isDebugging: boolean;
  breakpoints: Set<number>;
  onToggleBreakpoint: (line: number) => void;
  activeLine: number;
}

const CodeInput: React.FC<CodeInputProps> = ({ 
    code, setCode, onAnalyze, onDebug, isLoading, fileName, 
    onFileLoad, onClear, isDebugging, breakpoints, onToggleBreakpoint, activeLine 
}) => {
  const { t } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(code.split('\n').length);

  // Disable debug button for non-JS files
  const isJsFile = fileName ? /\.(js|jsx|ts|tsx)$/i.test(fileName) : true;

  useEffect(() => {
    setLineCount(code.split('\n').length);
  }, [code]);

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          onFileLoad(text, file.name);
        }
      };
      reader.onerror = () => {
        alert(t('fileReadError'));
      };
      reader.readAsText(file);
      event.target.value = ''; // Reset file input
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      if (!isLoading && !isDebugging) {
        onAnalyze();
      }
    }
  }, [isLoading, onAnalyze, isDebugging]);

  return (
    <div className="bg-gray-800/50 border border-white/10 p-4 rounded-lg shadow-lg flex flex-col gap-4">
      <div className="relative flex h-96">
        <div ref={lineNumbersRef} className="bg-gray-900/50 p-3 text-right text-gray-500 select-none overflow-y-hidden font-mono text-sm rounded-l-lg">
           {Array.from({ length: lineCount }, (_, i) => i + 1).map(lineNum => (
                <div 
                    key={lineNum}
                    onClick={() => onToggleBreakpoint(lineNum)}
                    className={`cursor-pointer relative pr-2 ${activeLine === lineNum ? 'text-yellow-300' : ''}`}
                >
                    {lineNum}
                    {breakpoints.has(lineNum) && <div className="absolute top-1/2 -right-0.5 w-2 h-2 bg-brand-purple rounded-full -translate-y-1/2"></div>}
                </div>
            ))}
        </div>
        <textarea
          ref={textareaRef}
          onScroll={handleScroll}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('codeInputPlaceholder')}
          className="w-full h-full p-3 bg-gray-900/20 text-gray-300 rounded-r-lg focus:ring-2 focus:ring-brand-purple focus:outline-none transition-shadow resize-y font-mono text-sm"
          spellCheck="false"
          disabled={isLoading || isDebugging}
        />
        {fileName && (
          <div className="absolute bottom-2 right-2 text-xs bg-gray-900/80 text-gray-400 px-2 py-1 rounded">
            {t('loadedFromFile')}: {fileName}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.php,.html,.css,.json,text/*"
          />
          <button
            onClick={handleUploadClick}
            disabled={isLoading || isDebugging}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-md transition-colors disabled:opacity-50"
          >
            <UploadIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('uploadFileButton')}</span>
          </button>
          <button
            onClick={onClear}
            disabled={isLoading || isDebugging}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-md transition-colors disabled:opacity-50"
          >
            <ClearIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('clearInputButton')}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={onDebug}
                disabled={isLoading || isDebugging || !isJsFile}
                title={!isJsFile ? t('debugButtonDisabledTooltip') : t('debugButton')}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
                <DebugIcon className="w-5 h-5" />
                {t('debugButton')}
            </button>
            <button
            onClick={onAnalyze}
            disabled={isLoading || isDebugging}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purple/90 hover:to-indigo-600/90 text-white font-semibold rounded-md transition-all shadow-md hover:shadow-lg hover:shadow-brand-purple/20 disabled:from-gray-500 disabled:to-gray-600 disabled:shadow-none"
            >
            <AnalyzeIcon className="w-5 h-5" />
            {isLoading ? t('analyzingButton') : t('analyzeButton')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CodeInput;